import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, Key, ScrollText, LogOut, Shield } from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Licenses from './pages/Licenses';
import Logs from './pages/Logs';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));

  useEffect(() => {
    const handler = () => setToken(localStorage.getItem('admin_token'));
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  if (!token) {
    return <Login onSuccess={(t) => { localStorage.setItem('admin_token', t); setToken(t); }} />;
  }

  const logout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
  };

  return (
    <HashRouter>
      <div className="flex h-screen bg-[#0a0a12]">
        {/* Sidebar */}
        <aside className="w-64 bg-[#0f0f1a] border-r border-white/5 flex flex-col">
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
              <Shield className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-white font-semibold">Admin Panel</h1>
              <p className="text-xs text-gray-500">Roblox Activator</p>
            </div>
          </div>

          <nav className="flex-1 px-3 space-y-1">
            <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Обзор" />
            <NavItem to="/licenses" icon={<Key size={20} />} label="Лицензии" />
            <NavItem to="/logs" icon={<ScrollText size={20} />} label="Логи" />
          </nav>

          <button
            onClick={logout}
            className="m-3 p-3 flex items-center gap-3 text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition"
          >
            <LogOut size={18} /> Выйти
          </button>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/licenses" element={<Licenses />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition ${
          isActive
            ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      {icon}
      <span className="font-medium">{label}</span>
    </NavLink>
  );
}