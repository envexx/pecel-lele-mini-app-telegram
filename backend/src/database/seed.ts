import 'dotenv/config';
import pool from './connection';
import { runMigrations } from './migrate';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  console.log('Seeding database...');

  await runMigrations();

  // Create admin user
  const adminId = uuidv4();
  const passwordHash = await bcrypt.hash('admin123', 10);

  await pool.query(
    `INSERT INTO users (id, username, password_hash, role, telegram_id)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (username) DO NOTHING`,
    [adminId, 'admin', passwordHash, 'admin', null]
  );

  // Create sample menu items
  const menuItems = [
    // Makanan Utama
    { name: 'Pecel Lele Goreng', price: 15000, category: 'makanan_utama' },
    { name: 'Pecel Lele Bakar', price: 18000, category: 'makanan_utama' },
    { name: 'Pecel Lele Kremes', price: 17000, category: 'makanan_utama' },
    { name: 'Pecel Lele Penyet', price: 16000, category: 'makanan_utama' },
    { name: 'Ayam Goreng', price: 16000, category: 'makanan_utama' },
    { name: 'Ayam Bakar', price: 18000, category: 'makanan_utama' },
    { name: 'Ayam Penyet', price: 17000, category: 'makanan_utama' },

    // Lauk
    { name: 'Nasi Putih', price: 5000, category: 'lauk' },
    { name: 'Tempe Goreng', price: 3000, category: 'lauk' },
    { name: 'Tahu Goreng', price: 3000, category: 'lauk' },
    { name: 'Lalapan', price: 3000, category: 'lauk' },
    { name: 'Sambel Extra', price: 2000, category: 'lauk' },
    { name: 'Kerupuk', price: 2000, category: 'lauk' },

    // Minuman
    { name: 'Es Teh Manis', price: 5000, category: 'minuman' },
    { name: 'Es Jeruk', price: 6000, category: 'minuman' },
    { name: 'Teh Hangat', price: 4000, category: 'minuman' },
    { name: 'Kopi', price: 5000, category: 'minuman' },
    { name: 'Air Mineral', price: 3000, category: 'minuman' },
    { name: 'Es Campur', price: 8000, category: 'minuman' },

    // Extra
    { name: 'Nasi Tambah', price: 3000, category: 'extra' },
    { name: 'Sambel Korek', price: 2000, category: 'extra' },
    { name: 'Telur Ceplok', price: 4000, category: 'extra' },
    { name: 'Telur Dadar', price: 5000, category: 'extra' },
  ];

  for (const item of menuItems) {
    await pool.query(
      `INSERT INTO menu_items (id, name, price, category, is_available)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [uuidv4(), item.name, item.price, item.category, true]
    );
  }

  console.log('Seed completed successfully.');
  console.log('Admin credentials: username=admin, password=admin123');
}

seed().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
