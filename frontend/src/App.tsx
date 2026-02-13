import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import RoleSelector from './pages/RoleSelector';
import KasirDashboard from './pages/kasir/KasirDashboard';
import NewOrder from './pages/kasir/NewOrder';
import OrderDetail from './pages/kasir/OrderDetail';
import PaymentPage from './pages/kasir/PaymentPage';
import DebtList from './pages/kasir/DebtList';
import KitchenView from './pages/kitchen/KitchenView';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import MenuManagement from './pages/admin/MenuManagement';
import ReportsPage from './pages/admin/ReportsPage';
import TransactionHistory from './pages/admin/TransactionHistory';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuthStore();
  if (!token || user?.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 max-w-lg mx-auto">
      <Routes>
        <Route path="/" element={<RoleSelector />} />

        {/* Kasir Routes */}
        <Route path="/kasir" element={<KasirDashboard />} />
        <Route path="/kasir/new-order" element={<NewOrder />} />
        <Route path="/kasir/order/:id" element={<OrderDetail />} />
        <Route path="/kasir/payment/:id" element={<PaymentPage />} />
        <Route path="/kasir/debts" element={<DebtList />} />

        {/* Kitchen Routes */}
        <Route path="/kitchen" element={<KitchenView />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/menu" element={<AdminRoute><MenuManagement /></AdminRoute>} />
        <Route path="/admin/reports" element={<AdminRoute><ReportsPage /></AdminRoute>} />
        <Route path="/admin/transactions" element={<AdminRoute><TransactionHistory /></AdminRoute>} />
      </Routes>
    </div>
  );
}
