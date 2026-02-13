import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
  createUser: (data: { username: string; password: string; role: string; telegram_id?: string }) =>
    api.post('/auth/users', data),
  deleteUser: (id: string) => api.delete(`/auth/users/${id}`),
};

// Menu
export const menuApi = {
  getAll: (params?: { category?: string; available?: string }) =>
    api.get('/menu', { params }),
  getById: (id: string) => api.get(`/menu/${id}`),
  create: (data: { name: string; price: number; category: string; is_available?: boolean; photo_url?: string }) =>
    api.post('/menu', data),
  update: (id: string, data: Partial<{ name: string; price: number; category: string; is_available: boolean; photo_url: string }>) =>
    api.put(`/menu/${id}`, data),
  delete: (id: string) => api.delete(`/menu/${id}`),
  toggleAvailability: (id: string, is_available: boolean) =>
    api.patch(`/menu/${id}/availability`, { is_available }),
};

// Orders
export const ordersApi = {
  getAll: (params?: Record<string, string>) =>
    api.get('/orders', { params }),
  getActive: () => api.get('/orders/active'),
  getById: (id: string) => api.get(`/orders/${id}`),
  create: (data: {
    order_type: string;
    table_number?: number;
    customer_name?: string;
    items: { menu_item_id: string; quantity: number }[];
    notes?: string;
  }) => api.post('/orders', data),
  updateItems: (id: string, items: { menu_item_id: string; quantity: number }[]) =>
    api.put(`/orders/${id}/items`, { items }),
  updateStatus: (id: string, status: string) =>
    api.patch(`/orders/${id}/status`, { status }),
};

// Payments
export const paymentsApi = {
  process: (data: {
    order_id: string;
    payments: { amount: number; payment_method: string; payment_proof_url?: string; notes?: string }[];
  }) => api.post('/payments', data),
  getDebts: (status?: string) =>
    api.get('/payments/debts', { params: status ? { status } : {} }),
  payDebt: (id: string) => api.patch(`/payments/debts/${id}/pay`),
};

// Reports
export const reportsApi = {
  daily: (date?: string) =>
    api.get('/reports/daily', { params: date ? { date } : {} }),
  sales: (params?: { from?: string; to?: string; period?: string }) =>
    api.get('/reports/sales', { params }),
  menuPerformance: (params?: { from?: string; to?: string }) =>
    api.get('/reports/menu-performance', { params }),
};

export default api;
