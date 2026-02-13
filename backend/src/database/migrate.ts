import 'dotenv/config';
import pool from './connection';

const migrations = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK(role IN ('admin', 'kasir', 'staff')),
  telegram_id VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Menu items table
CREATE TABLE IF NOT EXISTS menu_items (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price INT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK(category IN ('makanan_utama', 'lauk', 'minuman', 'extra')),
  is_available BOOLEAN NOT NULL DEFAULT true,
  photo_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(36) PRIMARY KEY,
  order_number INT NOT NULL,
  order_type VARCHAR(20) NOT NULL CHECK(order_type IN ('dine-in', 'online')),
  table_number INT,
  customer_name VARCHAR(255),
  total_amount INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'ready', 'completed', 'cancelled')),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('paid', 'unpaid', 'partial')),
  notes TEXT,
  created_by_user_id VARCHAR(36) REFERENCES users(id),
  order_created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  order_updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  order_processing_at TIMESTAMP,
  order_ready_at TIMESTAMP,
  order_completed_at TIMESTAMP
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id VARCHAR(36) NOT NULL REFERENCES menu_items(id),
  quantity INT NOT NULL DEFAULT 1,
  price_at_order INT NOT NULL,
  subtotal INT NOT NULL
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  payment_method VARCHAR(20) NOT NULL CHECK(payment_method IN ('cash', 'transfer', 'qris', 'hutang')),
  payment_proof_url TEXT,
  payment_time TIMESTAMP NOT NULL DEFAULT NOW(),
  notes TEXT
);

-- Debts table
CREATE TABLE IF NOT EXISTS debts (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  amount INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK(status IN ('unpaid', 'paid')),
  debt_date TIMESTAMP NOT NULL DEFAULT NOW(),
  paid_date TIMESTAMP,
  notes TEXT
);

-- Order logs table
CREATE TABLE IF NOT EXISTS order_logs (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  action VARCHAR(30) NOT NULL CHECK(action IN ('created', 'updated', 'status_changed', 'paid', 'item_added', 'item_removed')),
  old_value TEXT,
  new_value TEXT,
  "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
  user_id VARCHAR(36) REFERENCES users(id)
);

-- Order number sequence table
CREATE TABLE IF NOT EXISTS order_sequence (
  date VARCHAR(10) PRIMARY KEY,
  last_number INT NOT NULL DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(order_created_at);
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_order_logs_order ON order_logs(order_id);
`;

export async function runMigrations() {
  console.log('Running database migrations...');
  await pool.query(migrations);
  console.log('Migrations completed successfully.');
}

if (require.main === module) {
  runMigrations().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
}
