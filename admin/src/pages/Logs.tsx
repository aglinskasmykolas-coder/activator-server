import { useEffect, useState } from 'react';
import { ScrollText, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../api';

interface LogEntry {
  id: number;
  licenseCode: string;
  action: string;
  hwid: string;
  ip: string;
  userAgent: string;
  success: number;
  message: string;
  timestamp: number;
}

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const load = async () => {
    try {
      const { data } = await api.get('/admin/logs?limit=200');
      setLogs(data.logs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          Логи <ScrollText className="text-purple-400" size={28} />
        </h1>
        <p className="text-gray-400 mt-1">История активаций и проверок ({logs.length} записей)</p>
      </div>

      <div className="bg-[#161622] border border-white/5 rounded-2xl overflow-hidden">
        {logs.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <ScrollText size={48} className="mx-auto mb-4 opacity-30" />
            <p>Логов пока нет</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase border-b border-white/5">
                <th className="pl-6 py-4 font-medium">Время</th>
                <th className="py-4 font-medium">Действие</th>
                <th className="py-4 font-medium">Код</th>
                <th className="py-4 font-medium">Статус</th>
                <th className="py-4 font-medium">HWID</th>
                <th className="py-4 font-medium">IP</th>
                <th className="py-4 pr-6 font-medium">Сообщение</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="pl-6 py-3 text-gray-400 text-xs font-mono">
                    {new Date(log.timestamp).toLocaleString('ru')}
                  </td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      log.action === 'activate' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3">
                    <code className="text-white font-mono text-xs bg-white/5 px-2 py-1 rounded">{log.licenseCode}</code>
                  </td>
                  <td className="py-3">
                    {log.success ? (
                      <CheckCircle2 className="text-green-400" size={16} />
                    ) : (
                      <XCircle className="text-red-400" size={16} />
                    )}
                  </td>
                  <td className="py-3">
                    <span className="text-gray-400 font-mono text-xs" title={log.hwid}>
                      {log.hwid ? log.hwid.slice(0, 12) + '...' : '—'}
                    </span>
                  </td>
                  <td className="py-3 text-gray-400 text-xs font-mono">{log.ip || '—'}</td>
                  <td className="py-3 pr-6 text-xs">
                    <span className={log.success ? 'text-green-400' : 'text-red-400'}>{log.message}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}