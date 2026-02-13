import { create } from 'zustand';
import type { CartItem } from '../types';

interface CartState {
  items: CartItem[];
  orderType: 'dine-in' | 'online';
  tableNumber: number | null;
  customerName: string;
  notes: string;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  setOrderType: (type: 'dine-in' | 'online') => void;
  setTableNumber: (num: number | null) => void;
  setCustomerName: (name: string) => void;
  setNotes: (notes: string) => void;
  getTotal: () => number;
  getItemCount: () => number;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  orderType: 'dine-in',
  tableNumber: null,
  customerName: '',
  notes: '',

  addItem: (item) => {
    set((state) => {
      const existing = state.items.find((i) => i.menu_item_id === item.menu_item_id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.menu_item_id === item.menu_item_id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { items: [...state.items, { ...item, quantity: 1 }] };
    });
  },

  removeItem: (menuItemId) => {
    set((state) => ({
      items: state.items.filter((i) => i.menu_item_id !== menuItemId),
    }));
  },

  updateQuantity: (menuItemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(menuItemId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.menu_item_id === menuItemId ? { ...i, quantity } : i
      ),
    }));
  },

  setOrderType: (type) => set({ orderType: type }),
  setTableNumber: (num) => set({ tableNumber: num }),
  setCustomerName: (name) => set({ customerName: name }),
  setNotes: (notes) => set({ notes }),

  getTotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  clearCart: () =>
    set({
      items: [],
      orderType: 'dine-in',
      tableNumber: null,
      customerName: '',
      notes: '',
    }),
}));
