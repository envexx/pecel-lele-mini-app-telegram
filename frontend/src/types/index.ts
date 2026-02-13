export interface User {
  id: string;
  username: string;
  role: 'admin' | 'kasir' | 'staff';
  telegram_id?: string;
  created_at: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'makanan_utama' | 'lauk' | 'minuman' | 'extra';
  is_available: boolean;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id?: string;
  menu_item_id: string;
  quantity: number;
  price_at_order: number;
  subtotal: number;
  name: string;
  category?: string;
}

export interface Order {
  id: string;
  order_number: number;
  order_type: 'dine-in' | 'online';
  table_number?: number;
  customer_name?: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'ready' | 'completed' | 'cancelled';
  payment_status: 'paid' | 'unpaid' | 'partial';
  notes?: string;
  created_by_user_id?: string;
  order_created_at: string;
  order_updated_at: string;
  order_processing_at?: string;
  order_ready_at?: string;
  order_completed_at?: string;
  items: OrderItem[];
  payments?: Payment[];
  logs?: OrderLog[];
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  payment_method: 'cash' | 'transfer' | 'qris' | 'hutang';
  payment_proof_url?: string;
  payment_time: string;
  notes?: string;
}

export interface Debt {
  id: string;
  order_id: string;
  customer_name: string;
  amount: number;
  status: 'unpaid' | 'paid';
  debt_date: string;
  paid_date?: string;
  notes?: string;
  order_number?: number;
  order_type?: string;
  table_number?: number;
}

export interface OrderLog {
  id: string;
  order_id: string;
  action: string;
  old_value?: string;
  new_value?: string;
  timestamp: string;
  user_id?: string;
}

export interface DailyReport {
  date: string;
  summary: {
    total_transactions: number;
    total_sales: number;
    avg_order_value: number;
  };
  payment_breakdown: { payment_method: string; count: number; total: number }[];
  top_items: { name: string; category: string; total_qty: number; total_revenue: number }[];
  debts: { total_debts: number; total_debt_amount: number };
  peak_hours: { hour: string; order_count: number }[];
  order_type_breakdown: { order_type: string; count: number; total: number }[];
}

export interface CartItem {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

export type CategoryLabel = {
  [key: string]: string;
};

export const CATEGORY_LABELS: CategoryLabel = {
  makanan_utama: 'Makanan Utama',
  lauk: 'Lauk',
  minuman: 'Minuman',
  extra: 'Extra',
};

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Menunggu',
  processing: 'Diproses',
  ready: 'Siap',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  transfer: 'Transfer',
  qris: 'QRIS',
  hutang: 'Hutang',
};
