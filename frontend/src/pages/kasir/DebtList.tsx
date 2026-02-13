import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { paymentsApi } from '../../lib/api';
import { formatRupiah, formatDate } from '../../lib/utils';
import type { Debt } from '../../types';

export default function DebtList() {
  const navigate = useNavigate();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [filter, setFilter] = useState<'unpaid' | 'paid' | ''>('unpaid');

  const fetchDebts = async () => {
    const { data } = await paymentsApi.getDebts(filter || undefined);
    setDebts(data);
  };

  useEffect(() => { fetchDebts(); }, [filter]);

  const handlePay = async (id: string) => {
    if (!confirm('Lunasi hutang ini?')) return;
    await paymentsApi.payDebt(id);
    fetchDebts();
  };

  const totalUnpaid = debts.filter(d => d.status === 'unpaid').reduce((s, d) => s + d.amount, 0);

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/kasir')} className="p-2 hover:bg-gray-100 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Daftar Hutang</h1>
      </div>

      {filter === 'unpaid' && totalUnpaid > 0 && (
        <div className="card bg-red-50 border-red-200 mb-4">
          <p className="text-sm text-red-600">Total Hutang Belum Lunas</p>
          <p className="text-2xl font-bold text-red-700">{formatRupiah(totalUnpaid)}</p>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {(['unpaid', 'paid', ''] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${filter === f ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            {f === 'unpaid' ? 'Belum Lunas' : f === 'paid' ? 'Lunas' : 'Semua'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {debts.map(debt => (
          <div key={debt.id} className="card">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold">{debt.customer_name}</p>
                <p className="text-xs text-gray-400">Order #{debt.order_number} - {formatDate(debt.debt_date)}</p>
              </div>
              <span className={debt.status === 'unpaid' ? 'badge-hutang' : 'badge-completed'}>
                {debt.status === 'unpaid' ? 'Belum Lunas' : 'Lunas'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <p className="font-bold text-lg">{formatRupiah(debt.amount)}</p>
              {debt.status === 'unpaid' && (
                <button onClick={() => handlePay(debt.id)} className="btn-success text-xs py-1.5 px-3">
                  Lunasi
                </button>
              )}
            </div>
          </div>
        ))}
        {debts.length === 0 && <p className="text-center text-gray-400 py-10">Tidak ada data hutang</p>}
      </div>
    </div>
  );
}
