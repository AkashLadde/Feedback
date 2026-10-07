import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { History, Shield, RefreshCw, Search, Clock } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs({ search });
      if (res.success) setLogs(res.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-pink-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-pink-700" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Administrative & Security Audit Trail
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Immutable system audit logs tracking user logins, session activations, QR code rotations, and manual resolutions
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-3.5 py-2 bg-slate-50 hover:bg-pink-50 text-slate-700 hover:text-pink-900 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-slate-200 hover:border-pink-200"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-pink-100 shadow-sm flex items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, user email, or details..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-pink-600"
          />
        </form>
        <span className="text-xs text-slate-500 font-medium">
          Showing <strong className="text-pink-900">{logs.length}</strong> logged events
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-pink-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-pink-50/50 border-b border-pink-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Actor Role</th>
                <th className="py-3 px-3">User Email</th>
                <th className="py-3 px-3">Action Type</th>
                <th className="py-3 px-3">Entity Target</th>
                <th className="py-3 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-pink-50/30 transition-colors">
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-sans font-bold text-[10px] bg-pink-50 text-pink-900 px-2 py-0.5 rounded border border-pink-200">
                      {log.user_role || 'SYSTEM'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700 font-sans font-medium">{log.user_email || 'system.daemon'}</td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-pink-700">{log.action}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-500">{log.entity_type} #{log.entity_id || 'N/A'}</td>
                  <td className="py-3 px-4 font-sans text-xs text-slate-800">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


