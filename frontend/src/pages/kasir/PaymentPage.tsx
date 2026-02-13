import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { ordersApi, paymentsApi } from '../../lib/api';
import { formatRupiah } from '../../lib/utils';
import type { Order } from '../../types';

type PaymentMethod = 'cash' | 'transfer' | 'qris' | 'hutang';

export default function PaymentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [cashAmount, setCashAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    ordersApi.getById(id).then(({ data }) => {
      setOrder(data);
      setCustomerName(data.customer_name || '');
    });
  }, [id]);

  if (!order) return <div className="p-4 text-center text-gray-400 mt-20">Memuat...</div>;

  const change = method === 'cash' && cashAmount ? Math.max(0, parseInt(cashAmount) - order.total_amount) : 0;

  const handlePay = async () => {
    if (method === 'hutang' && !customerName.trim()) {
      alert('Nama pelanggan wajib untuk hutang');
      return;
    }
    if (method === 'cash' && (!cashAmount || parseInt(cashAmount) < order.total_amount)) {
      alert('Jumlah bayar kurang');
      return;
    }

    setSubmitting(true);
    try {
      const amount = method === 'cash' ? order.total_amount : order.total_amount;
      const { data } = await paymentsApi.process({
        order_id: order.id,
        payments: [{ amount, payment_method: method }],
      });
      setResult(data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal memproses pembayaran');
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-xl font-bold mb-2">Pembayaran Berhasil!</h2>
        <p className="text-gray-500 mb-1">Total: {formatRupiah(result.total_amount)}</p>
        {result.change > 0 && (
          <p className="text-lg font-bold text-green-600 mb-4">Kembalian: {formatRupiah(result.change)}</p>
        )}
        <button onClick={() => navigate('/kasir')} className="btn-primary mt-4">
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Pembayaran</h1>
      </div>

      {/* Order Summary */}
      <div className="card mb-4">
        <p className="text-sm text-gray-500">Pesanan #{order.order_number}</p>
        <p className="text-2xl font-bold text-orange-600 mt-1">{formatRupiah(order.total_amount)}</p>
      </div>

      {/* Payment Method */}
      <h3 className="font-semibold mb-3">Metode Pembayaran</h3>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {(['cash', 'transfer', 'qris', 'hutang'] as PaymentMethod[]).map(m => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            className={`py-3 rounded-xl text-sm font-medium transition-all capitalize ${method === m ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            {m === 'qris' ? 'QRIS' : m}
          </button>
        ))}
      </div>

      {/* Cash Input */}
      {method === 'cash' && (
        <div className="mb-4">
          <label className="text-sm text-gray-600 mb-1 block">Jumlah Bayar</label>
          <input
            type="number"
            value={cashAmount}
            onChange={e => setCashAmount(e.target.value)}
            className="input-field text-lg"
            placeholder="0"
          />
          {change > 0 && (
            <p className="mt-2 text-green-600 font-bold">Kembalian: {formatRupiah(change)}</p>
          )}
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[order.total_amount, 50000, 100000].map(v => (
              <button
                key={v}
                onClick={() => setCashAmount(String(v))}
                className="btn-secondary text-xs"
              >
                {formatRupiah(v)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hutang - Customer Name */}
      {method === 'hutang' && (
        <div className="mb-4">
          <label className="text-sm text-gray-600 mb-1 block">Nama Pelanggan *</label>
          <input
            type="text"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            className="input-field"
            placeholder="Nama pelanggan"
          />
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={submitting}
        className="btn-primary w-full mt-4 disabled:opacity-50"
      >
        {submitting ? 'Memproses...' : `Bayar ${formatRupiah(order.total_amount)}`}
      </button>
    </div>
  );
}
