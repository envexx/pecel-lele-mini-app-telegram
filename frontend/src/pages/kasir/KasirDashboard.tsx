import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Clock, CreditCard, ArrowLeft } from 'lucide-react';
import { ordersApi } from '../../lib/api';
import { formatRupiah, formatTime, getStatusColor } from '../../lib/utils';
import { STATUS_LABELS } from '../../types';
import type { Order } from '../../types';

export default function KasirDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const { data } = await ordersApi.getActive();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const processingCount = orders.filter(o => o.status === 'processing').length;
  const readyCount = orders.filter(o => o.status === 'ready').length;

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Kasir</h1>
        </div>
        <button onClick={() => navigate('/kasir/debts')} className="text-sm text-red-600 font-medium">
          Hutang
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card text-center">
          <p className="text-2xl font-bold text-amber-500">{pendingCount}</p>
          <p className="text-xs text-gray-500">Menunggu</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-blue-500">{processingCount}</p>
          <p className="text-xs text-gray-500">Diproses</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-500">{readyCount}</p>
          <p className="text-xs text-gray-500">Siap</p>
        </div>
      </div>

      {/* Active Orders */}
      <h2 className="font-semibold text-gray-700 mb-3">Pesanan Aktif</h2>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Memuat...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-10 text-gray-400">Belum ada pesanan aktif</div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <button
              key={order.id}
              onClick={() => navigate(`/kasir/order/${order.id}`)}
              className="card w-full text-left hover:shadow-md transition-all active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">#{order.order_number}</span>
                  <span className={getStatusColor(order.status)}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-400 text-xs">
                  <Clock className="w-3 h-3" />
                  {formatTime(order.order_created_at)}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {order.order_type === 'dine-in' ? `Meja ${order.table_number}` : 'Online'}
                  {order.customer_name && ` - ${order.customer_name}`}
                </div>
                <div className="font-semibold text-sm">{formatRupiah(order.total_amount)}</div>
              </div>
              {order.items && order.items.length > 0 && (
                <div className="mt-2 text-xs text-gray-400">
                  {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => navigate('/kasir/new-order')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl shadow-lg flex items-center justify-center active:scale-90 transition-all"
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
}
