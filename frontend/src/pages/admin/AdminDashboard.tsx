import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, UtensilsCrossed, FileText, LogOut, History } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { reportsApi } from '../../lib/api';
import { formatRupiah } from '../../lib/utils';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    reportsApi.daily().then(({ data }) => setReport(data)).catch(console.error);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Halo, {user?.username}</p>
        </div>
        <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Today's Summary */}
      {report && (
        <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white mb-6">
          <p className="text-sm opacity-80 mb-1">Penjualan Hari Ini</p>
          <p className="text-3xl font-bold">{formatRupiah(report.summary.total_sales)}</p>
          <div className="flex gap-4 mt-3 text-sm">
            <div>
              <p className="opacity-70">Transaksi</p>
              <p className="font-bold">{report.summary.total_transactions}</p>
            </div>
            <div>
              <p className="opacity-70">Rata-rata</p>
              <p className="font-bold">{formatRupiah(report.summary.avg_order_value)}</p>
            </div>
            {report.debts && (
              <div>
                <p className="opacity-70">Hutang</p>
                <p className="font-bold">{formatRupiah(report.debts.total_debt_amount)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="space-y-3">
        <button
          onClick={() => navigate('/admin/menu')}
          className="card w-full flex items-center gap-4 hover:shadow-md transition-all active:scale-[0.98]"
        >
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <UtensilsCrossed className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Kelola Menu</h3>
            <p className="text-gray-500 text-sm">Tambah, edit, hapus menu</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/admin/reports')}
          className="card w-full flex items-center gap-4 hover:shadow-md transition-all active:scale-[0.98]"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Laporan</h3>
            <p className="text-gray-500 text-sm">Laporan harian & performa menu</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/admin/transactions')}
          className="card w-full flex items-center gap-4 hover:shadow-md transition-all active:scale-[0.98]"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <History className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Riwayat Transaksi</h3>
            <p className="text-gray-500 text-sm">Lihat semua pesanan</p>
          </div>
        </button>
      </div>
    </div>
  );
}
