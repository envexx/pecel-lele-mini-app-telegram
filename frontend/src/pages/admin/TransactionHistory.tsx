import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { ordersApi } from '../../lib/api';
import { formatRupiah, formatTime, formatDate, getStatusColor } from '../../lib/utils';
import { STATUS_LABELS } from '../../types';
import type { Order } from '../../types';

export default function TransactionHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const params: any = {};
    if (statusFilter) params.status = statusFilter;
    ordersApi.getAll(params).then(({ data }) => setOrders(data)).catch(console.error);
  }, [statusFilter]);

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-100 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Riwayat Transaksi</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4">
        {['', 'completed', 'cancelled', 'pending', 'processing', 'ready'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium ${statusFilter === s ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            {s === '' ? 'Semua' : STATUS_LABELS[s] || s}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {orders.map(order => (
          <div key={order.id} className="card">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">#{order.order_number}</span>
                <span className={getStatusColor(order.status)}>{STATUS_LABELS[order.status]}</span>
              </div>
              <span className="font-semibold text-sm">{formatRupiah(order.total_amount)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>
                {order.order_type === 'dine-in' ? `Meja ${order.table_number}` : 'Online'}
                {order.customer_name && ` - ${order.customer_name}`}
              </span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(order.order_created_at)} {formatTime(order.order_created_at)}
              </div>
            </div>
          </div>
        ))}
        {orders.length === 0 && <p className="text-center text-gray-400 py-10">Tidak ada data</p>}
      </div>
    </div>
  );
}
