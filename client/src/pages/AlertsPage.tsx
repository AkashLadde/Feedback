import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  BellRing,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Filter,
  RefreshCw,
  Clock,
  ShieldAlert
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const { user, refreshTrigger } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [counts, setCounts] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('UNRESOLVED');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [resolveModalAlert, setResolveModalAlert] = useState<any | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [resolving, setResolving] = useState<boolean>(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.getAlerts({
        status: selectedStatus,
        severity: selectedSeverity
      });
      if (res.success) {
        setAlerts(res.alerts);
        setCounts(res.counts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [selectedStatus, selectedSeverity, refreshTrigger]);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveModalAlert) return;
    try {
      setResolving(true);
      await api.resolveAlert(resolveModalAlert.id, {
        status: 'RESOLVED',
        resolution_notes: notes
      });
      setResolveModalAlert(null);
      setNotes('');
      await fetchAlerts();
    } catch (err: any) {
      alert('Failed to resolve alert: ' + err.message);
    } finally {
      setResolving(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow">CRITICAL</span>;
      case 'HIGH':
        return <span className="bg-red-100 text-red-800 border border-red-300 font-bold text-[10px] px-2 py-0.5 rounded">HIGH</span>;
      case 'MEDIUM':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[10px] px-2 py-0.5 rounded">MEDIUM</span>;
      default:
        return <span className="bg-blue-100 text-blue-800 border border-blue-300 font-bold text-[10px] px-2 py-0.5 rounded">INFO</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-red-600" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Security Alerts & Verification Anomaly Center
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time notifications triggered by missing attendance, outside-geofence submissions, and expired dynamic QR tokens
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Alerts</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          {['UNRESOLVED', 'RESOLVED', 'ALL'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedStatus === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Severity:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                selectedSeverity === sev
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-2xl border transition-all ${
                alert.status === 'UNRESOLVED'
                  ? 'bg-white border-amber-300 shadow-sm'
                  : 'bg-slate-50 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl mt-0.5 ${
                    alert.severity === 'CRITICAL' || alert.severity === 'HIGH'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    <ShieldAlert className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(alert.severity)}
                      <span className="font-bold text-slate-900 text-sm">{alert.type}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500 font-mono">
                        {new Date(alert.created_at).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 font-medium mt-1 leading-relaxed">
                      {alert.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 mt-2">
                      {alert.student_name && (
                        <span>Student: <strong>{alert.student_name}</strong> ({alert.usn})</span>
                      )}
                      {alert.lab_name && (
                        <span>Lab: <strong>{alert.lab_name}</strong></span>
                      )}
                      {alert.experiment_number && (
                        <span>Experiment: <strong>#{alert.experiment_number}</strong></span>
                      )}
                    </div>

                    {alert.resolution_notes && (
                      <div className="mt-2 text-[11px] bg-emerald-50 text-emerald-800 p-2 rounded-lg border border-emerald-200">
                        <strong>Resolution Note:</strong> {alert.resolution_notes} (by {alert.resolved_by_name || 'Admin'})
                      </div>
                    )}
                  </div>
                </div>

                {alert.status === 'UNRESOLVED' && (
                  <button
                    onClick={() => {
                      setResolveModalAlert(alert);
                      setNotes('');
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Resolve Alert
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
            <div className="font-bold text-slate-700">No Unresolved Alerts</div>
            <div className="text-xs text-slate-400">All laboratory security verification signals are currently normal.</div>
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      {resolveModalAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Resolve Security Alert</h3>
              <button onClick={() => setResolveModalAlert(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-600 font-medium">{resolveModalAlert.message}</p>

            <form onSubmit={handleResolve} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Resolution Investigation Notes</label>
                <textarea
                  required
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Explain resolution (e.g. Student warned regarding proxy sharing, or verified manual exception)..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolveModalAlert(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow"
                >
                  Mark as Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
