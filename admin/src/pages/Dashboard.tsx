import { useEffect, useState } from 'react';
import { LayoutDashboard, Key, CheckCircle2, XCircle, Package, TrendingUp } from 'lucide-react';
import { api } from '../api';

interface Stats {
  total: number;
  active: number;
  unused: number;
  revoked: number;
  expired: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, unused: 0, revoked: 0, expired: 0 });

  const load = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const activePercent = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          Обзор <LayoutDashboard className="text-purple-400" size={28} />
        </h1>
        <p className="text-gray-400 mt-1">Общая статистика по лицензиям</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Package className="text-purple-400" size={20} />}
          label="Всего кодов"
          value={stats.total}
          sub="Сгенерировано"
        />
        <StatCard
          icon={<CheckCircle2 className="text-green-400" size={20} />}
          label="Активных"
          value={stats.active}
          sub={`${activePercent}% от всех`}
          valueColor="text-green-400"
        />
        <StatCard
          icon={<Key className="text-blue-400" size={20} />}
          label="Не использованы"
          value={stats.unused}
          sub="Готовы к продаже"
          valueColor="text-blue-400"
        />
        <StatCard
          icon={<XCircle className="text-red-400" size={20} />}
          label="Заблокированы"
          value={stats.revoked + stats.expired}
          sub={`Заблок: ${stats.revoked} / Истёк: ${stats.expired}`}
          valueColor="text-red-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#161622] border border-white/5 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="text-purple-400" size={20} /> Статус активаций
          </h3>
          
          <div className="space-y-4">
            <StatusBar label="Активны" value={stats.active} total={stats.total} color="green" />
            <StatusBar label="Не использованы" value={stats.unused} total={stats.total} color="blue" />
            <StatusBar label="Заблокированы" value={stats.revoked} total={stats.total} color="red" />
            <StatusBar label="Истёк срок" value={stats.expired} total={stats.total} color="yellow" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-900/30 to-purple-600/10 border border-purple-500/30 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Быстрые действия</h3>
          <p className="text-gray-400 text-sm mb-4">
            Перейди в раздел "Лицензии" чтобы сгенерировать новые коды или управлять существующими.
          </p>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-3xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-gray-400 mt-1">Всего в системе</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-3xl font-bold text-green-400">{stats.active + stats.unused}</p>
              <p className="text-xs text-gray-400 mt-1">Рабочих кодов</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, valueColor }: any) {
  return (
    <div className="bg-[#161622] border border-white/5 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <p className={`text-3xl font-bold ${valueColor || 'text-white'}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  );
}

function StatusBar({ label, value, total, color }: any) {
  const percent = total > 0 ? (value / total) * 100 : 0;
  const colors: any = {
    green: 'bg-green-400',
    blue: 'bg-blue-400',
    red: 'bg-red-400',
    yellow: 'bg-yellow-400',
  };
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-medium">{value}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full ${colors[color]} transition-all duration-500`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}