import { Router, Request, Response } from 'express';
import pool from '../database/connection';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { generateId, getCurrentTimestamp } from '../utils/helpers';

const router = Router();

// GET /api/menu - Get all menu items (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, available } = req.query;
    let query = 'SELECT * FROM menu_items';
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (category) {
      conditions.push(`category = $${paramIdx++}`);
      params.push(category);
    }

    if (available !== undefined) {
      conditions.push(`is_available = $${paramIdx++}`);
      params.push(available === 'true');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY category, name';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/menu/:id - Get single menu item
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM menu_items WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Menu item tidak ditemukan' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Get menu item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/menu - Create menu item (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, price, category, is_available, photo_url } = req.body;

    if (!name || price === undefined || !category) {
      return res.status(400).json({ error: 'Nama, harga, dan kategori diperlukan' });
    }

    if (!['makanan_utama', 'lauk', 'minuman', 'extra'].includes(category)) {
      return res.status(400).json({ error: 'Kategori tidak valid' });
    }

    const id = generateId();
    const now = getCurrentTimestamp();

    await pool.query(
      'INSERT INTO menu_items (id, name, price, category, is_available, photo_url, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [id, name, price, category, is_available !== undefined ? is_available : true, photo_url || null, now, now]
    );

    const { rows } = await pool.query('SELECT * FROM menu_items WHERE id = $1', [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/menu/:id - Update menu item (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, price, category, is_available, photo_url } = req.body;

    const { rows: existing } = await pool.query('SELECT * FROM menu_items WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Menu item tidak ditemukan' });
    }

    const now = getCurrentTimestamp();

    await pool.query(
      'UPDATE menu_items SET name = COALESCE($1, name), price = COALESCE($2, price), category = COALESCE($3, category), is_available = COALESCE($4, is_available), photo_url = COALESCE($5, photo_url), updated_at = $6 WHERE id = $7',
      [
        name || null,
        price !== undefined ? price : null,
        category || null,
        is_available !== undefined ? is_available : null,
        photo_url !== undefined ? photo_url : null,
        now,
        id
      ]
    );

    const { rows } = await pool.query('SELECT * FROM menu_items WHERE id = $1', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/menu/:id - Delete menu item (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM menu_items WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Menu item tidak ditemukan' });
    }

    res.json({ message: 'Menu item berhasil dihapus' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/menu/:id/availability - Toggle availability (Admin only)
router.patch('/:id/availability', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { is_available } = req.body;

    const result = await pool.query(
      'UPDATE menu_items SET is_available = $1, updated_at = $2 WHERE id = $3',
      [is_available, getCurrentTimestamp(), id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Menu item tidak ditemukan' });
    }

    const { rows } = await pool.query('SELECT * FROM menu_items WHERE id = $1', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Toggle availability error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
