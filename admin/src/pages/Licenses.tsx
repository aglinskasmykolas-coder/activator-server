import { useEffect, useState } from 'react';
import { Key, Plus, Search, Filter, Copy, Trash2, Ban, RotateCcw, X, Check, Loader2, Download } from 'lucide-react';
import { api } from '../api';

interface License {
  id: number;
  code: string;
  type: string;
  status: 'unused' | 'active' | 'revoked' | 'expired';
  hwid: string | null;
  activatedAt: number | null;
  expiresAt: number | null;
  createdAt: number;
  note: string | null;
}

export default function Licenses() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [newCodes, setNewCodes] = useState<string[]>([]);

  const load = async () => {
    try {
      const { data } = await api.get('/admin/list');
      setLicenses(data.licenses);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const handleGenerate = async (type: string, count: number, note: string) => {
    setLoading(true);
    try {
      const { data } = await api.post('/admin/generate', { type, count, note });
      setNewCodes(data.codes);
      await load();
    } catch (err) {
      alert('Ошибка генерации');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (code: string) => {
    if (!confirm(`Заблокировать код ${code}?`)) return;
    await api.post('/admin/revoke', { code });
    await load();
  };

  const handleResetHwid = async (code: string) => {
    if (!confirm(`Сбросить привязку HWID для ${code}? Клиент сможет активировать код заново на другом устройстве.`)) return;
    await api.post('/admin/reset-hwid', { code });
    await load();
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`УДАЛИТЬ код ${code} НАВСЕГДА? Это действие необратимо.`)) return;
    await api.delete('/admin/delete', { data: { code } });
    await load();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(newCodes.join('\n'));
    alert(`${newCodes.length} кодов скопировано в буфер обмена`);
  };

  const downloadAll = () => {
    const blob = new Blob([newCodes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codes_${Date.now()}.txt`;
    a.click();
  };

  const filtered = licenses.filter(l => {
    const matchesSearch = l.code.toLowerCase().includes(search.toLowerCase()) || 
                         (l.note || '').toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || l.status === filter;
    return matchesSearch && matchesFilter;
  });

  const formatDate = (ts: number | null) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('ru');
  };

  const typeLabels: any = {
    '7d': '7 дней',
    '14d': '14 дней',
    '30d': '30 дней',
    '365d': '1 год',
    'lifetime': '∞ Навсегда',
  };

  const statusStyles: any = {
    unused: { bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'Не использован' },
    active: { bg: 'bg-green-500/20', text: 'text-green-300', label: 'Активен' },
    revoked: { bg: 'bg-red-500/20', text: 'text-red-300', label: 'Заблокирован' },
    expired: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Истёк' },
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            Лицензии <Key className="text-purple-400" size={28} />
          </h1>
          <p className="text-gray-400 mt-1">Управление всеми кодами активации</p>
        </div>
        <button
          onClick={() => setShowGenerate(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-xl transition font-medium"
        >
          <Plus size={18} /> Сгенерировать коды
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#161622] border border-white/5 rounded-2xl p-4 mb-4 flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по коду или заметке..."
            className="w-full bg-[#0a0a12] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white placeholder:text-gray-600"
          />
        </div>
        <div className="flex items-center gap-1 bg-[#0a0a12] border border-white/10 rounded-xl p-1">
          {['all', 'unused', 'active', 'revoked', 'expired'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-lg transition ${
                filter === f ? 'bg-purple-500/20 text-purple-300' : 'text-gray-400 hover:text-white'
              }`}
            >
              {f === 'all' ? 'Все' : statusStyles[f].label} ({licenses.filter(l => f === 'all' || l.status === f).length})
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#161622] border border-white/5 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Key size={48} className="mx-auto mb-4 opacity-30" />
            <p>Нет лицензий</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase border-b border-white/5">
                <th className="pl-6 py-4 font-medium">Код</th>
                <th className="py-4 font-medium">Тип</th>
                <th className="py-4 font-medium">Статус</th>
                <th className="py-4 font-medium">HWID</th>
                <th className="py-4 font-medium">Активирован</th>
                <th className="py-4 font-medium">Истекает</th>
                <th className="py-4 font-medium">Заметка</th>
                <th className="py-4 pr-6 font-medium text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => {
                const st = statusStyles[l.status];
                return (
                  <tr key={l.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="pl-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-white font-mono text-sm bg-white/5 px-2 py-1 rounded">{l.code}</code>
                        <button onClick={() => copyCode(l.code)} className="text-gray-500 hover:text-white p-1">
                          <Copy size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="text-purple-300 text-sm">{typeLabels[l.type]}</span>
                    </td>
                    <td className="py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="py-4">
                      {l.hwid ? (
                        <span className="text-gray-400 font-mono text-xs" title={l.hwid}>
                          {l.hwid.slice(0, 8)}...
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="py-4 text-gray-400 text-xs">{formatDate(l.activatedAt)}</td>
                    <td className="py-4 text-gray-400 text-xs">
                      {l.type === 'lifetime' ? <span className="text-purple-300">∞</span> : formatDate(l.expiresAt)}
                    </td>
                    <td className="py-4 text-gray-400 text-xs max-w-[150px] truncate">{l.note || '—'}</td>
                    <td className="py-4 pr-6">
                      <div className="flex items-center justify-end gap-1">
                        {l.hwid && (
                          <button
                            onClick={() => handleResetHwid(l.code)}
                            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                            title="Сбросить HWID"
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
                        {l.status !== 'revoked' && (
                          <button
                            onClick={() => handleRevoke(l.code)}
                            className="p-2 text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition"
                            title="Заблокировать"
                          >
                            <Ban size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(l.code)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                          title="Удалить"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Generate Modal */}
      {showGenerate && (
        <GenerateModal
          onClose={() => { setShowGenerate(false); setNewCodes([]); }}
          onGenerate={handleGenerate}
          loading={loading}
          newCodes={newCodes}
          onCopyAll={copyAll}
          onDownload={downloadAll}
        />
      )}
    </div>
  );
}

function GenerateModal({ onClose, onGenerate, loading, newCodes, onCopyAll, onDownload }: any) {
  const [type, setType] = useState('30d');
  const [count, setCount] = useState(1);
  const [note, setNote] = useState('');

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-[#161622] border border-white/10 rounded-2xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {newCodes.length > 0 ? `Сгенерировано ${newCodes.length} кодов` : 'Генерация кодов'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {newCodes.length > 0 ? (
          <div>
            <div className="bg-[#0a0a12] rounded-xl p-4 max-h-64 overflow-auto mb-4 border border-white/5">
              {newCodes.map((code: string, i: number) => (
                <div key={i} className="text-white font-mono text-sm py-1">{code}</div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={onCopyAll} className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl">
                <Copy size={16} /> Копировать все
              </button>
              <button onClick={onDownload} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-xl">
                <Download size={16} /> Скачать .txt
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Тип лицензии</label>
              <div className="grid grid-cols-5 gap-2">
                {['7d', '14d', '30d', '365d', 'lifetime'].map(t => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`py-2 rounded-lg text-xs font-medium transition ${
                      type === t ? 'bg-purple-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {t === 'lifetime' ? '∞' : t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Количество ({count})</label>
              <input
                type="range"
                min="1"
                max="100"
                value={count}
                onChange={e => setCount(parseInt(e.target.value))}
                className="w-full accent-purple-500"
              />
              <div className="flex gap-2 mt-2">
                {[1, 5, 10, 25, 50, 100].map(n => (
                  <button
                    key={n}
                    onClick={() => setCount(n)}
                    className={`flex-1 py-1 text-xs rounded ${count === n ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-gray-400'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Заметка (необязательно)</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Например: партия для Иванова"
                className="w-full bg-[#0a0a12] border border-white/10 rounded-xl px-4 py-2 text-white placeholder:text-gray-600"
              />
            </div>

            <button
              onClick={() => onGenerate(type, count, note)}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
              Сгенерировать {count} {count === 1 ? 'код' : 'кодов'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}