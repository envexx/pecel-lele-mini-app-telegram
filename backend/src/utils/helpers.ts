import pool from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

export function generateId(): string {
  return uuidv4();
}

export async function getNextOrderNumber(): Promise<number> {
  const today = new Date().toISOString().split('T')[0];

  const { rows } = await pool.query('SELECT last_number FROM order_sequence WHERE date = $1', [today]);

  if (rows.length > 0) {
    const next = rows[0].last_number + 1;
    await pool.query('UPDATE order_sequence SET last_number = $1 WHERE date = $2', [next, today]);
    return next;
  } else {
    await pool.query('INSERT INTO order_sequence (date, last_number) VALUES ($1, $2)', [today, 1]);
    return 1;
  }
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}
