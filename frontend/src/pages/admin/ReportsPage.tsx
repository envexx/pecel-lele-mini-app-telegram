import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { reportsApi } from '../../lib/api';
import { formatRupiah } from '../../lib/utils';

export default function ReportsPage() {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<any>(null);
  const [menuPerf, setMenuPerf] = useState<any[]>([]);

  useEffect(() => {
    reportsApi.daily(date).then(({ data }) => setReport(data)).catch(console.error);
  }, [date]);

  useEffect(() => {
    reportsApi.menuPerformance().then(({ data }) => setMenuPerf(data)).catch(console.error);
  }, []);

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-100 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Laporan</h1>
      </div>

      <div className="mb-4">
        <label className="text-sm text-gray-600 mb-1 block">Tanggal</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field" />
      </div>

      {report && (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="card text-center">
              <p className="text-lg font-bold">{report.summary.total_transactions}</p>
              <p className="text-xs text-gray-500">Transaksi</p>
            </div>
            <div className="card text-center">
              <p className="text-lg font-bold text-green-600">{formatRupiah(report.summary.total_sales)}</p>
              <p className="text-xs text-gray-500">Penjualan</p>
            </div>
            <div className="card text-center">
              <p className="text-lg font-bold">{formatRupiah(report.summary.avg_order_value)}</p>
              <p className="text-xs text-gray-500">Rata-rata</p>
            </div>
          </div>

          {report.payment_breakdown?.length > 0 && (
            <div className="card mb-4">
              <h3 className="font-semibold mb-2 text-sm">Metode Pembayaran</h3>
              {report.payment_breakdown.map((p: any) => (
                <div key={p.payment_method} className="flex justify-between text-sm py-1">
                  <span className="capitalize">{p.payment_method}</span>
                  <span className="font-medium">{formatRupiah(p.total)} ({p.count}x)</span>
                </div>
              ))}
            </div>
          )}

          {report.top_items?.length > 0 && (
            <div className="card mb-4">
              <h3 className="font-semibold mb-2 text-sm">Menu Terlaris</h3>
              {report.top_items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm py-1">
                  <span>{item.name}</span>
                  <span className="font-medium">{item.total_qty}x - {formatRupiah(item.total_revenue)}</span>
                </div>
              ))}
            </div>
          )}

          {report.peak_hours?.length > 0 && (
            <div className="card mb-4">
              <h3 className="font-semibold mb-2 text-sm">Jam Ramai</h3>
              {report.peak_hours.map((h: any) => (
                <div key={h.hour} className="flex justify-between text-sm py-1">
                  <span>{h.hour}:00</span>
                  <span className="font-medium">{h.order_count} pesanan</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {menuPerf.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-2 text-sm">Performa Menu (30 hari)</h3>
          {menuPerf.slice(0, 15).map((item: any) => (
            <div key={item.id} className="flex justify-between text-sm py-1">
              <span>{item.name}</span>
              <span className="font-medium">{item.total_sold}x - {formatRupiah(item.total_revenue)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
