import { Router, Request, Response } from 'express';
import pool from '../database/connection';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/reports/daily - Daily report
router.get('/daily', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

    // Total sales
    const { rows: [salesData] } = await pool.query(`
      SELECT 
        COUNT(*)::int as total_transactions,
        COALESCE(SUM(total_amount), 0)::int as total_sales,
        COALESCE(AVG(total_amount), 0)::int as avg_order_value
      FROM orders 
      WHERE DATE(order_created_at) = $1 AND status = 'completed'
    `, [date]);

    // Breakdown by payment method
    const { rows: paymentBreakdown } = await pool.query(`
      SELECT 
        p.payment_method,
        COUNT(*)::int as count,
        SUM(p.amount)::int as total
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      WHERE DATE(o.order_created_at) = $1
      GROUP BY p.payment_method
    `, [date]);

    // Top selling items
    const { rows: topItems } = await pool.query(`
      SELECT 
        mi.name,
        mi.category,
        SUM(oi.quantity)::int as total_qty,
        SUM(oi.subtotal)::int as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE DATE(o.order_created_at) = $1 AND o.status = 'completed'
      GROUP BY mi.id, mi.name, mi.category
      ORDER BY total_qty DESC
      LIMIT 10
    `, [date]);

    // Total unpaid debts
    const { rows: [debtData] } = await pool.query(`
      SELECT 
        COUNT(*)::int as total_debts,
        COALESCE(SUM(amount), 0)::int as total_debt_amount
      FROM debts 
      WHERE status = 'unpaid'
    `);

    // Peak hours
    const { rows: peakHours } = await pool.query(`
      SELECT 
        to_char(order_created_at, 'HH24') as hour,
        COUNT(*)::int as order_count
      FROM orders
      WHERE DATE(order_created_at) = $1 AND status != 'cancelled'
      GROUP BY to_char(order_created_at, 'HH24')
      ORDER BY order_count DESC
      LIMIT 5
    `, [date]);

    // Order type breakdown
    const { rows: orderTypeBreakdown } = await pool.query(`
      SELECT 
        order_type,
        COUNT(*)::int as count,
        SUM(total_amount)::int as total
      FROM orders
      WHERE DATE(order_created_at) = $1 AND status = 'completed'
      GROUP BY order_type
    `, [date]);

    res.json({
      date,
      summary: {
        total_transactions: salesData.total_transactions,
        total_sales: salesData.total_sales,
        avg_order_value: salesData.avg_order_value,
      },
      payment_breakdown: paymentBreakdown,
      top_items: topItems,
      debts: debtData,
      peak_hours: peakHours,
      order_type_breakdown: orderTypeBreakdown,
    });
  } catch (error) {
    console.error('Daily report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reports/sales - Sales over time range
router.get('/sales', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { from, to, period } = req.query;
    const dateFrom = (from as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dateTo = (to as string) || new Date().toISOString().split('T')[0];

    let groupBy: string;

    switch (period) {
      case 'weekly':
        groupBy = "to_char(order_created_at, 'IYYY-\"W\"IW')";
        break;
      case 'monthly':
        groupBy = "to_char(order_created_at, 'YYYY-MM')";
        break;
      default:
        groupBy = "DATE(order_created_at)::text";
        break;
    }

    const { rows: sales } = await pool.query(`
      SELECT 
        ${groupBy} as period,
        COUNT(*)::int as total_transactions,
        SUM(total_amount)::int as total_sales,
        AVG(total_amount)::int as avg_order_value
      FROM orders
      WHERE DATE(order_created_at) BETWEEN $1 AND $2 AND status = 'completed'
      GROUP BY ${groupBy}
      ORDER BY period ASC
    `, [dateFrom, dateTo]);

    res.json({
      from: dateFrom,
      to: dateTo,
      period: period || 'daily',
      data: sales,
    });
  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reports/menu-performance - Menu item performance
router.get('/menu-performance', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { from, to } = req.query;
    const dateFrom = (from as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dateTo = (to as string) || new Date().toISOString().split('T')[0];

    const { rows: performance } = await pool.query(`
      SELECT 
        mi.id,
        mi.name,
        mi.category,
        mi.price,
        COALESCE(SUM(oi.quantity), 0)::int as total_sold,
        COALESCE(SUM(oi.subtotal), 0)::int as total_revenue
      FROM menu_items mi
      LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
      LEFT JOIN orders o ON oi.order_id = o.id AND DATE(o.order_created_at) BETWEEN $1 AND $2 AND o.status = 'completed'
      GROUP BY mi.id, mi.name, mi.category, mi.price
      ORDER BY total_sold DESC
    `, [dateFrom, dateTo]);

    res.json(performance);
  } catch (error) {
    console.error('Menu performance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
