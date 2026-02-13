import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChefHat, Clock } from 'lucide-react';
import { ordersApi } from '../../lib/api';
import { formatRupiah, formatTime, getStatusColor } from '../../lib/utils';
import { STATUS_LABELS } from '../../types';
import type { Order } from '../../types';

export default function KitchenView() {
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
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const processingOrders = orders.filter(o => o.status === 'processing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  const renderOrderCard = (order: Order) => (
    <div key={order.id} className="card mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold">#{order.order_number}</span>
          <span className={getStatusColor(order.status)}>{STATUS_LABELS[order.status]}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-400 text-xs">
          <Clock className="w-3 h-3" />
          {formatTime(order.order_created_at)}
        </div>
      </div>

      <div className="text-sm text-gray-600 mb-2">
        {order.order_type === 'dine-in' ? `Meja ${order.table_number}` : 'Online'}
        {order.customer_name && ` - ${order.customer_name}`}
      </div>

      {order.items && (
        <div className="space-y-1 mb-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm bg-gray-50 rounded-lg px-3 py-1.5">
              <span className="font-medium">{item.quantity}x {item.name}</span>
            </div>
          ))}
        </div>
      )}

      {order.notes && (
        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5 mb-3">📝 {order.notes}</p>
      )}

      <div className="flex gap-2">
        {order.status === 'pending' && (
          <button
            onClick={() => handleStatusChange(order.id, 'processing')}
            className="btn-primary flex-1 text-sm py-2"
          >
            Mulai Proses
          </button>
        )}
        {order.status === 'processing' && (
          <button
            onClick={() => handleStatusChange(order.id, 'ready')}
            className="btn-success flex-1 text-sm py-2"
          >
            Siap Disajikan
          </button>
        )}
        {order.status === 'ready' && (
          <span className="text-center text-sm text-green-600 font-medium flex-1 py-2">
            ✅ Menunggu diambil
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <ChefHat className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold">Dapur</h1>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Memuat pesanan...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p>Belum ada pesanan aktif</p>
        </div>
      ) : (
        <div>
          {pendingOrders.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold text-amber-600 mb-3">⏳ Menunggu ({pendingOrders.length})</h2>
              {pendingOrders.map(renderOrderCard)}
            </div>
          )}
          {processingOrders.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold text-blue-600 mb-3">🔥 Sedang Diproses ({processingOrders.length})</h2>
              {processingOrders.map(renderOrderCard)}
            </div>
          )}
          {readyOrders.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold text-green-600 mb-3">✅ Siap ({readyOrders.length})</h2>
              {readyOrders.map(renderOrderCard)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
