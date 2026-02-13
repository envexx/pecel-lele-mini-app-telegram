import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingCart } from 'lucide-react';
import { menuApi, ordersApi } from '../../lib/api';
import { useCartStore } from '../../stores/cartStore';
import { formatRupiah } from '../../lib/utils';
import { CATEGORY_LABELS } from '../../types';
import type { MenuItem } from '../../types';

export default function NewOrder() {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const cart = useCartStore();

  useEffect(() => {
    menuApi.getAll({ available: 'true' }).then(({ data }) => {
      setMenuItems(data);
      setLoading(false);
    });
  }, []);

  const categories = ['all', ...new Set(menuItems.map(i => i.category))];
  const filtered = selectedCategory === 'all' ? menuItems : menuItems.filter(i => i.category === selectedCategory);

  const handleSubmit = async () => {
    if (cart.items.length === 0) return;
    if (cart.orderType === 'dine-in' && !cart.tableNumber) {
      alert('Pilih nomor meja');
      return;
    }
    if (cart.orderType === 'online' && !cart.customerName.trim()) {
      alert('Masukkan nama pelanggan');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await ordersApi.create({
        order_type: cart.orderType,
        table_number: cart.tableNumber || undefined,
        customer_name: cart.customerName || undefined,
        items: cart.items.map(i => ({ menu_item_id: i.menu_item_id, quantity: i.quantity })),
        notes: cart.notes || undefined,
      });
      cart.clearCart();
      navigate(`/kasir/order/${data.id}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal membuat pesanan');
    } finally {
      setSubmitting(false);
    }
  };

  const getItemQty = (id: string) => cart.items.find(i => i.menu_item_id === id)?.quantity || 0;

  return (
    <div className="p-4 pb-32">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/kasir')} className="p-2 hover:bg-gray-100 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Pesanan Baru</h1>
      </div>

      {/* Order Type */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => cart.setOrderType('dine-in')}
          className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${cart.orderType === 'dine-in' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          Dine-in
        </button>
        <button
          onClick={() => cart.setOrderType('online')}
          className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${cart.orderType === 'online' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          Online / Takeaway
        </button>
      </div>

      {/* Table / Name */}
      {cart.orderType === 'dine-in' ? (
        <div className="mb-4">
          <label className="text-sm text-gray-600 mb-1 block">Nomor Meja</label>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <button
                key={n}
                onClick={() => cart.setTableNumber(n)}
                className={`py-2 rounded-xl text-sm font-medium transition-all ${cart.tableNumber === n ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <label className="text-sm text-gray-600 mb-1 block">Nama Pelanggan *</label>
          <input
            type="text"
            value={cart.customerName}
            onChange={e => cart.setCustomerName(e.target.value)}
            className="input-field"
            placeholder="Nama pelanggan"
          />
        </div>
      )}

      {/* Optional name for dine-in */}
      {cart.orderType === 'dine-in' && (
        <div className="mb-4">
          <label className="text-sm text-gray-600 mb-1 block">Nama (opsional)</label>
          <input
            type="text"
            value={cart.customerName}
            onChange={e => cart.setCustomerName(e.target.value)}
            className="input-field"
            placeholder="Nama pelanggan"
          />
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategory === cat ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            {cat === 'all' ? 'Semua' : CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {/* Menu Items */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Memuat menu...</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => {
            const qty = getItemQty(item.id);
            return (
              <div key={item.id} className="card flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <p className="text-orange-600 text-sm font-semibold">{formatRupiah(item.price)}</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  {qty > 0 && (
                    <>
                      <button
                        onClick={() => cart.updateQuantity(item.id, qty - 1)}
                        className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center active:scale-90"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-6 text-center font-semibold text-sm">{qty}</span>
                    </>
                  )}
                  <button
                    onClick={() => cart.addItem({ menu_item_id: item.id, name: item.name, price: item.price, category: item.category })}
                    className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center active:scale-90"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Notes */}
      <div className="mt-4">
        <label className="text-sm text-gray-600 mb-1 block">Catatan</label>
        <input
          type="text"
          value={cart.notes}
          onChange={e => cart.setNotes(e.target.value)}
          className="input-field"
          placeholder="Catatan pesanan (opsional)"
        />
      </div>

      {/* Cart Footer */}
      {cart.items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 max-w-lg mx-auto">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Buat Pesanan ({cart.getItemCount()} item) - {formatRupiah(cart.getTotal())}</span>
          </button>
        </div>
      )}
    </div>
  );
}
