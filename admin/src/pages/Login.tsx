import { useState } from 'react';
import { Shield, Lock, Loader2 } from 'lucide-react';
import { api } from '../api';

export default function Login({ onSuccess }: { onSuccess: (token: string) => void }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!password) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/admin/login', { password });
      onSuccess(data.token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a12] p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#161622] border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
              <Shield className="text-white" size={32} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-2">Admin Panel</h1>
          <p className="text-gray-400 text-center mb-8 text-sm">
            Введите пароль для доступа
          </p>

          <div className="relative mb-4">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Пароль"
              className="w-full bg-[#0a0a12] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none transition"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || !password}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> Вход...</> : 'Войти'}
          </button>
        </div>

        <p className="text-center text-gray-500 text-xs mt-4">
          © 2025 Voras. Roblox Activator Admin
        </p>
      </div>
    </div>
  );
}