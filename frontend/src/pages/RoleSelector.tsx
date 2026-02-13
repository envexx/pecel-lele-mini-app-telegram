import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ChefHat, Shield } from 'lucide-react';

export default function RoleSelector() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-orange-600 mb-2">POS Pecel Lele</h1>
        <p className="text-gray-500 text-sm">Pilih akses untuk melanjutkan</p>
      </div>

      <div className="w-full space-y-4">
        <button
          onClick={() => navigate('/kasir')}
          className="card w-full flex items-center gap-4 hover:border-orange-300 hover:shadow-md transition-all active:scale-[0.98]"
        >
          <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center">
            <ShoppingCart className="w-7 h-7 text-orange-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-lg">Kasir</h3>
            <p className="text-gray-500 text-sm">Input pesanan & pembayaran</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/kitchen')}
          className="card w-full flex items-center gap-4 hover:border-blue-300 hover:shadow-md transition-all active:scale-[0.98]"
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
            <ChefHat className="w-7 h-7 text-blue-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-lg">Staff Dapur</h3>
            <p className="text-gray-500 text-sm">Lihat & proses pesanan</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/admin/login')}
          className="card w-full flex items-center gap-4 hover:border-purple-300 hover:shadow-md transition-all active:scale-[0.98]"
        >
          <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center">
            <Shield className="w-7 h-7 text-purple-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-lg">Admin</h3>
            <p className="text-gray-500 text-sm">Kelola menu, laporan & pengaturan</p>
          </div>
        </button>
      </div>
    </div>
  );
}
