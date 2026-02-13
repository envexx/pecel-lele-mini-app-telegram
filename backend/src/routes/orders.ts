import { Router, Request, Response } from 'express';
import pool from '../database/connection';
import { AuthRequest } from '../middleware/auth';
import { generateId, getNextOrderNumber, getCurrentTimestamp } from '../utils/helpers';
import { notifyKitchenNewOrder, notifyKitchenOrderUpdated, notifyKasirOrderReady } from '../services/telegram';

const router = Router();

interface OrderItemInput {
  menu_item_id: string;
  quantity: number;
}

const ITEMS_SUBQUERY = `
  COALESCE((SELECT json_agg(json_build_object(
    'id', oi.id,
    'menu_item_id', oi.menu_item_id,
    'quantity', oi.quantity,
    'price_at_order', oi.price_at_order,
    'subtotal', oi.subtotal,
    'name', mi.name,
    'category', mi.category
  ))
  FROM order_items oi
  LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
  WHERE oi.order_id = o.id), '[]'::json) as items
`;

// GET /api/orders - Get all orders (with filters)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, order_type, date_from, date_to, payment_status, search } = req.query;
    let query = `SELECT o.*, ${ITEMS_SUBQUERY} FROM orders o`;
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (status) {
      conditions.push(`o.status = $${idx++}`);
      params.push(status);
    }
    if (order_type) {
      conditions.push(`o.order_type = $${idx++}`);
      params.push(order_type);
    }
    if (date_from) {
      conditions.push(`o.order_created_at >= $${idx++}`);
      params.push(date_from);
    }
    if (date_to) {
      conditions.push(`o.order_created_at <= $${idx++}::timestamp + interval '1 day'`);
      params.push(date_to);
    }
    if (payment_status) {
      conditions.push(`o.payment_status = $${idx++}`);
      params.push(payment_status);
    }
    if (search) {
      conditions.push(`(o.customer_name ILIKE $${idx++} OR o.order_number::text = $${idx++})`);
      params.push(`%${search}%`, search);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY o.order_created_at DESC';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/active - Get active orders (not completed/cancelled)
router.get('/active', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT o.*, ${ITEMS_SUBQUERY}
      FROM orders o
      WHERE o.status IN ('pending', 'processing', 'ready')
      ORDER BY 
        CASE o.status 
          WHEN 'pending' THEN 1 
          WHEN 'processing' THEN 2 
          WHEN 'ready' THEN 3 
        END,
        o.order_created_at ASC
    `);

    res.json(rows);
  } catch (error) {
    console.error('Get active orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/:id - Get single order
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.*, ${ITEMS_SUBQUERY} FROM orders o WHERE o.id = $1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }

    const order = rows[0];

    // Get payments
    const { rows: payments } = await pool.query('SELECT * FROM payments WHERE order_id = $1', [req.params.id]);
    order.payments = payments;

    // Get logs
    const { rows: logs } = await pool.query('SELECT * FROM order_logs WHERE order_id = $1 ORDER BY "timestamp" DESC', [req.params.id]);
    order.logs = logs;

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders - Create new order
router.post('/', async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { order_type, table_number, customer_name, items, notes } = req.body;

    if (!order_type || !items || items.length === 0) {
      return res.status(400).json({ error: 'Tipe order dan item diperlukan' });
    }

    if (order_type === 'dine-in' && !table_number) {
      return res.status(400).json({ error: 'Nomor meja diperlukan untuk dine-in' });
    }

    if (order_type === 'online' && !customer_name) {
      return res.status(400).json({ error: 'Nama pelanggan diperlukan untuk order online' });
    }

    const orderId = generateId();
    const orderNumber = await getNextOrderNumber();
    const now = getCurrentTimestamp();

    // Calculate total and validate items
    let totalAmount = 0;
    const orderItems: { id: string; menu_item_id: string; quantity: number; price: number; subtotal: number; name: string }[] = [];

    for (const item of items as OrderItemInput[]) {
      const { rows: menuRows } = await client.query('SELECT * FROM menu_items WHERE id = $1 AND is_available = true', [item.menu_item_id]);
      if (menuRows.length === 0) {
        return res.status(400).json({ error: `Menu item ${item.menu_item_id} tidak tersedia` });
      }
      const menuItem = menuRows[0];

      const subtotal = menuItem.price * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        id: generateId(),
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price: menuItem.price,
        subtotal,
        name: menuItem.name,
      });
    }

    await client.query('BEGIN');

    await client.query(
      `INSERT INTO orders (id, order_number, order_type, table_number, customer_name, total_amount, status, payment_status, notes, order_created_at, order_updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', 'unpaid', $7, $8, $9)`,
      [orderId, orderNumber, order_type, table_number || null, customer_name || null, totalAmount, notes || null, now, now]
    );

    for (const item of orderItems) {
      await client.query(
        'INSERT INTO order_items (id, order_id, menu_item_id, quantity, price_at_order, subtotal) VALUES ($1, $2, $3, $4, $5, $6)',
        [item.id, orderId, item.menu_item_id, item.quantity, item.price, item.subtotal]
      );
    }

    await client.query(
      'INSERT INTO order_logs (id, order_id, action, new_value, "timestamp") VALUES ($1, $2, $3, $4, $5)',
      [generateId(), orderId, 'created', JSON.stringify({ order_number: orderNumber, total: totalAmount }), now]
    );

    await client.query('COMMIT');

    // Send Telegram notification to kitchen
    notifyKitchenNewOrder({
      order_number: orderNumber,
      order_type,
      table_number,
      customer_name,
      items: orderItems.map(i => ({ name: i.name, quantity: i.quantity })),
      notes,
    }).catch(console.error);

    const { rows: created } = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    res.status(201).json({ ...created[0], items: orderItems });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// PUT /api/orders/:id/items - Update order items
router.put('/:id/items', async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { items } = req.body;

    const { rows: orderRows } = await client.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderRows.length === 0) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }
    const order = orderRows[0];

    if (order.status === 'completed' || order.status === 'cancelled') {
      return res.status(400).json({ error: 'Pesanan sudah selesai/dibatalkan, tidak bisa diedit' });
    }

    const now = getCurrentTimestamp();
    let totalAmount = 0;
    const newItems: any[] = [];

    for (const item of items as OrderItemInput[]) {
      const { rows: menuRows } = await client.query('SELECT * FROM menu_items WHERE id = $1', [item.menu_item_id]);
      if (menuRows.length === 0) {
        return res.status(400).json({ error: `Menu item ${item.menu_item_id} tidak ditemukan` });
      }
      const menuItem = menuRows[0];

      const subtotal = menuItem.price * item.quantity;
      totalAmount += subtotal;

      newItems.push({
        id: generateId(),
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price: menuItem.price,
        subtotal,
        name: menuItem.name,
      });
    }

    await client.query('BEGIN');

    await client.query('DELETE FROM order_items WHERE order_id = $1', [id]);

    for (const item of newItems) {
      await client.query(
        'INSERT INTO order_items (id, order_id, menu_item_id, quantity, price_at_order, subtotal) VALUES ($1, $2, $3, $4, $5, $6)',
        [item.id, id, item.menu_item_id, item.quantity, item.price, item.subtotal]
      );
    }

    await client.query('UPDATE orders SET total_amount = $1, order_updated_at = $2 WHERE id = $3', [totalAmount, now, id]);

    await client.query(
      'INSERT INTO order_logs (id, order_id, action, old_value, new_value, "timestamp") VALUES ($1, $2, $3, $4, $5, $6)',
      [generateId(), id, 'updated', JSON.stringify({ total: order.total_amount }), JSON.stringify({ total: totalAmount }), now]
    );

    await client.query('COMMIT');

    notifyKitchenOrderUpdated({
      order_number: order.order_number,
      table_number: order.table_number,
      items: newItems.map(i => ({ name: i.name, quantity: i.quantity })),
    }).catch(console.error);

    const { rows: updated } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    res.json({ ...updated[0], items: newItems });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update order items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// PATCH /api/orders/:id/status - Update order status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid' });
    }

    const { rows: orderRows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderRows.length === 0) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }
    const order = orderRows[0];

    const now = getCurrentTimestamp();
    const setClauses: string[] = ['status = $1', 'order_updated_at = $2'];
    const values: any[] = [status, now];
    let idx = 3;

    if (status === 'processing') { setClauses.push(`order_processing_at = $${idx++}`); values.push(now); }
    if (status === 'ready') { setClauses.push(`order_ready_at = $${idx++}`); values.push(now); }
    if (status === 'completed') { setClauses.push(`order_completed_at = $${idx++}`); values.push(now); }

    values.push(id);
    await pool.query(`UPDATE orders SET ${setClauses.join(', ')} WHERE id = $${idx}`, values);

    await pool.query(
      'INSERT INTO order_logs (id, order_id, action, old_value, new_value, "timestamp") VALUES ($1, $2, $3, $4, $5, $6)',
      [generateId(), id, 'status_changed', order.status, status, now]
    );

    if (status === 'ready') {
      notifyKasirOrderReady({
        order_number: order.order_number,
        order_type: order.order_type,
        table_number: order.table_number,
        total_amount: order.total_amount,
      }).catch(console.error);
    }

    const { rows: updated } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
