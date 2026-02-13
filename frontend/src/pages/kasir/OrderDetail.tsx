import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, Edit3 } from 'lucide-react';
import { ordersApi } from '../../lib/api';
import { formatRupiah, formatTime, getStatusColor } from '../../lib/utils';
import { STATUS_LABELS } from '../../types';
import type { Order } from '../../types';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    ordersApi.getById(id).then(({ data }) => {
      setOrder(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

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

      {/* Items */}
      <div className="card mb-4">
        <h3 className="font-semibold mb-3">Item Pesanan</h3>
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
      {order.status !== 'completed' && order.status !== 'cancelled' && (
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
