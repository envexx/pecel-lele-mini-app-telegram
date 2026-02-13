import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, LogIn } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mb-4">
        <Shield className="w-8 h-8 text-purple-600" />
      </div>
      <h1 className="text-2xl font-bold mb-1">Admin Login</h1>
      <p className="text-gray-500 text-sm mb-8">Masuk untuk mengelola sistem</p>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
        )}
        <div>
          <label className="text-sm text-gray-600 mb-1 block">Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="input-field"
            placeholder="Username"
            required
          />
        </div>
        <div>
          <label className="text-sm text-gray-600 mb-1 block">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input-field"
            placeholder="Password"
            required
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
          <LogIn className="w-5 h-5" />
          {loading ? 'Memproses...' : 'Masuk'}
        </button>
      </form>

      <button onClick={() => navigate('/')} className="mt-6 text-sm text-gray-400 hover:text-gray-600">
        Kembali ke beranda
      </button>
    </div>
  );
}
