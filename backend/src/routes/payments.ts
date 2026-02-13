import { Router, Request, Response } from 'express';
import pool from '../database/connection';
import { generateId, getCurrentTimestamp } from '../utils/helpers';

const router = Router();

// POST /api/payments - Process payment
router.post('/', async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { order_id, payments } = req.body;

    if (!order_id || !payments || payments.length === 0) {
      return res.status(400).json({ error: 'Order ID dan pembayaran diperlukan' });
    }

    const { rows: orderRows } = await client.query('SELECT * FROM orders WHERE id = $1', [order_id]);
    if (orderRows.length === 0) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }
    const order = orderRows[0];

    if (order.payment_status === 'paid') {
      return res.status(400).json({ error: 'Pesanan sudah dibayar' });
    }

    const now = getCurrentTimestamp();
    let totalPaid = 0;
    const paymentRecords: any[] = [];

    const { rows: existingRows } = await client.query('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE order_id = $1', [order_id]);
    const alreadyPaid = parseInt(existingRows[0]?.total) || 0;

    for (const payment of payments) {
      const { amount, payment_method, payment_proof_url, notes } = payment;

      if (!amount || !payment_method) {
        return res.status(400).json({ error: 'Jumlah dan metode pembayaran diperlukan' });
      }

      if (!['cash', 'transfer', 'qris', 'hutang'].includes(payment_method)) {
        return res.status(400).json({ error: 'Metode pembayaran tidak valid' });
      }

      totalPaid += amount;

      paymentRecords.push({
        id: generateId(),
        order_id,
        amount,
        payment_method,
        payment_proof_url: payment_proof_url || null,
        notes: notes || null,
      });
    }

    const grandTotalPaid = alreadyPaid + totalPaid;
    let paymentStatus: string;
    let change = 0;

    if (grandTotalPaid >= order.total_amount) {
      paymentStatus = 'paid';
      change = grandTotalPaid - order.total_amount;
    } else {
      paymentStatus = 'partial';
    }

    const hasHutang = paymentRecords.some(p => p.payment_method === 'hutang');

    await client.query('BEGIN');

    for (const p of paymentRecords) {
      await client.query(
        'INSERT INTO payments (id, order_id, amount, payment_method, payment_proof_url, payment_time, notes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [p.id, p.order_id, p.amount, p.payment_method, p.payment_proof_url, now, p.notes]
      );
    }

    await client.query(
      `UPDATE orders SET payment_status = $1::varchar, status = CASE WHEN $1::varchar = 'paid' THEN 'completed' ELSE status END, order_completed_at = CASE WHEN $1::varchar = 'paid' THEN $2::timestamp ELSE order_completed_at END, order_updated_at = $2::timestamp WHERE id = $3`,
      [paymentStatus, now, order_id]
    );

    if (hasHutang) {
      const hutangPayments = paymentRecords.filter(p => p.payment_method === 'hutang');
      for (const hp of hutangPayments) {
        const customerName = order.customer_name || 'Unknown';
        await client.query(
          'INSERT INTO debts (id, order_id, customer_name, amount, status, debt_date, notes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [generateId(), order_id, customerName, hp.amount, 'unpaid', now, hp.notes]
        );
      }
    }

    await client.query(
      'INSERT INTO order_logs (id, order_id, action, new_value, "timestamp") VALUES ($1, $2, $3, $4, $5)',
      [generateId(), order_id, 'paid', JSON.stringify({ total_paid: grandTotalPaid, method: paymentRecords.map(p => p.payment_method) }), now]
    );

    await client.query('COMMIT');

    res.json({
      message: paymentStatus === 'paid' ? 'Pembayaran berhasil' : 'Pembayaran partial berhasil',
      payment_status: paymentStatus,
      total_amount: order.total_amount,
      total_paid: grandTotalPaid,
      change,
      payments: paymentRecords,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Process payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/payments/debts - Get all debts
router.get('/debts', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT d.*, o.order_number, o.order_type, o.table_number
      FROM debts d
      LEFT JOIN orders o ON d.order_id = o.id
    `;
    const params: any[] = [];

    if (status) {
      query += ' WHERE d.status = $1';
      params.push(status);
    }

    query += ' ORDER BY d.debt_date DESC';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get debts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/payments/debts/:id/pay - Pay off debt
router.patch('/debts/:id/pay', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const now = getCurrentTimestamp();

    const { rows: debtRows } = await pool.query('SELECT * FROM debts WHERE id = $1', [id]);
    if (debtRows.length === 0) {
      return res.status(404).json({ error: 'Hutang tidak ditemukan' });
    }
    const debt = debtRows[0];

    if (debt.status === 'paid') {
      return res.status(400).json({ error: 'Hutang sudah dilunasi' });
    }

    await pool.query('UPDATE debts SET status = $1, paid_date = $2 WHERE id = $3', ['paid', now, id]);

    const { rows: unpaidRows } = await pool.query(
      'SELECT COUNT(*) as count FROM debts WHERE order_id = $1 AND status = $2',
      [debt.order_id, 'unpaid']
    );

    if (parseInt(unpaidRows[0].count) === 0) {
      await pool.query('UPDATE orders SET payment_status = $1, order_updated_at = $2 WHERE id = $3', ['paid', now, debt.order_id]);
    }

    res.json({ message: 'Hutang berhasil dilunasi' });
  } catch (error) {
    console.error('Pay debt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
