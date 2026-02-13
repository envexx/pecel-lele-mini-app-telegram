import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, Edit3, Plus, Minus, X, Check } from 'lucide-react';
import { ordersApi, menuApi } from '../../lib/api';
import { formatRupiah, formatTime, getStatusColor } from '../../lib/utils';
import { STATUS_LABELS, CATEGORY_LABELS } from '../../types';
import type { Order, MenuItem } from '../../types';

interface EditItem {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [editItems, setEditItems] = useState<EditItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchOrder = () => {
    if (!id) return;
    ordersApi.getById(id).then(({ data }) => {
      setOrder(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const startEdit = () => {
    if (!order) return;
    setEditItems(order.items.map(i => ({
      menu_item_id: i.menu_item_id,
      name: i.name,
      price: i.price_at_order,
      quantity: i.quantity,
    })));
    setEditing(true);
    menuApi.getAll({ available: 'true' }).then(({ data }) => setMenuItems(data));
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditItems([]);
    setShowMenu(false);
  };

  const updateQty = (menuItemId: string, delta: number) => {
    setEditItems(prev => {
      const updated = prev.map(i =>
        i.menu_item_id === menuItemId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i
      ).filter(i => i.quantity > 0);
      return updated;
    });
  };

  const addItem = (item: MenuItem) => {
    setEditItems(prev => {
      const existing = prev.find(i => i.menu_item_id === item.id);
      if (existing) {
        return prev.map(i => i.menu_item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menu_item_id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
    setShowMenu(false);
  };

  const saveEdit = async () => {
    if (!id || editItems.length === 0) {
      alert('Pesanan harus punya minimal 1 item');
      return;
    }
    setSaving(true);
    try {
      await ordersApi.updateItems(id, editItems.map(i => ({ menu_item_id: i.menu_item_id, quantity: i.quantity })));
      setEditing(false);
      setShowMenu(false);
      fetchOrder();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal update pesanan');
    } finally {
      setSaving(false);
    }
  };

  const editTotal = editItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const canEdit = order && order.status !== 'completed' && order.status !== 'cancelled';

  if (loading) return <div className="p-4 text-center text-gray-400 mt-20">Memuat...</div>;
  if (!order) return <div className="p-4 text-center text-gray-400 mt-20">Pesanan tidak ditemukan</div>;

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/kasir')} className="p-2 hover:bg-gray-100 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Pesanan #{order.order_number}</h1>
      </div>

      {/* Status & Info */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className={getStatusColor(order.status)}>{STATUS_LABELS[order.status]}</span>
          <span className="text-xs text-gray-400">{formatTime(order.order_created_at)}</span>
        </div>
        <div className="space-y-1 text-sm">
          <p><span className="text-gray-500">Tipe:</span> {order.order_type === 'dine-in' ? `Dine-in - Meja ${order.table_number}` : 'Online/Takeaway'}</p>
          {order.customer_name && <p><span className="text-gray-500">Pelanggan:</span> {order.customer_name}</p>}
          {order.notes && <p><span className="text-gray-500">Catatan:</span> {order.notes}</p>}
        </div>
      </div>

      {/* Items - Normal View */}
      {!editing && (
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Item Pesanan</h3>
            {canEdit && (
              <button onClick={startEdit} className="text-blue-500 text-sm flex items-center gap-1">
                <Edit3 className="w-4 h-4" /> Edit
              </button>
            )}
          </div>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.name}</span>
                <span className="font-medium">{formatRupiah(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-3 pt-3 flex justify-between font-bold">
            <span>Total</span>
            <span className="text-orange-600">{formatRupiah(order.total_amount)}</span>
          </div>
        </div>
      )}

      {/* Items - Edit Mode */}
      {editing && (
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Edit Pesanan</h3>
            <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            {editItems.map((item) => (
              <div key={item.menu_item_id} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-orange-600">{formatRupiah(item.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.menu_item_id, -1)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                  <button onClick={() => updateQty(item.menu_item_id, 1)} className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add item button */}
          <button onClick={() => setShowMenu(!showMenu)} className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 flex items-center justify-center gap-1 hover:border-orange-400 hover:text-orange-500">
            <Plus className="w-4 h-4" /> Tambah Item
          </button>

          {/* Menu picker */}
          {showMenu && (
            <div className="mt-3 max-h-60 overflow-y-auto border rounded-xl p-2 space-y-1">
              {menuItems.filter(m => !editItems.find(e => e.menu_item_id === m.id)).map(item => (
                <button key={item.id} onClick={() => addItem(item)} className="w-full text-left p-2 hover:bg-orange-50 rounded-lg flex justify-between text-sm">
                  <span>{item.name}</span>
                  <span className="text-orange-600">{formatRupiah(item.price)}</span>
                </button>
              ))}
              {menuItems.filter(m => !editItems.find(e => e.menu_item_id === m.id)).length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">Semua menu sudah ditambahkan</p>
              )}
            </div>
          )}

          {/* Edit total & save */}
          <div className="border-t mt-3 pt-3 flex justify-between font-bold">
            <span>Total Baru</span>
            <span className="text-orange-600">{formatRupiah(editTotal)}</span>
          </div>

          <div className="flex gap-2 mt-3">
            <button onClick={saveEdit} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-1 text-sm">
              <Check className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button onClick={cancelEdit} className="btn-secondary flex-1 text-sm">Batal</button>
          </div>
        </div>
      )}

      {/* Payment Info */}
      {order.payments && order.payments.length > 0 && (
        <div className="card mb-4">
          <h3 className="font-semibold mb-3">Pembayaran</h3>
          {order.payments.map((p) => (
            <div key={p.id} className="flex justify-between text-sm mb-1">
              <span className="capitalize">{p.payment_method}</span>
              <span>{formatRupiah(p.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {!editing && order.status !== 'completed' && order.status !== 'cancelled' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 max-w-lg mx-auto">
          {order.status === 'ready' || order.payment_status === 'unpaid' ? (
            <button
              onClick={() => navigate(`/kasir/payment/${order.id}`)}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Proses Pembayaran
            </button>
          ) : (
            <p className="text-center text-sm text-gray-400">Menunggu pesanan diproses dapur</p>
          )}
        </div>
      )}
    </div>
  );
}
