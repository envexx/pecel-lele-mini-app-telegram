import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../database/connection';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { generateId } from '../utils/helpers';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password diperlukan' });
    }

    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

// POST /api/auth/users (Admin only - create user)
router.post('/users', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, role, telegram_id } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password, dan role diperlukan' });
    }

    if (!['admin', 'kasir', 'staff'].includes(role)) {
      return res.status(400).json({ error: 'Role harus admin, kasir, atau staff' });
    }

    const { rows: existing } = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username sudah digunakan' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = generateId();

    await pool.query(
      'INSERT INTO users (id, username, password_hash, role, telegram_id) VALUES ($1, $2, $3, $4, $5)',
      [id, username, passwordHash, role, telegram_id || null]
    );

    res.status(201).json({
      id,
      username,
      role,
      telegram_id: telegram_id || null,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/users (Admin only - list users)
router.get('/users', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT id, username, role, telegram_id, created_at FROM users');
    res.json(rows);
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/auth/users/:id (Admin only)
router.delete('/users/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (id === req.user?.id) {
      return res.status(400).json({ error: 'Tidak bisa menghapus akun sendiri' });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    res.json({ message: 'User berhasil dihapus' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
