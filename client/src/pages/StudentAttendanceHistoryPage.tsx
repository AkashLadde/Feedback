import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { CheckCircle2, Clock, MapPin, Building2, ShieldCheck, RefreshCw } from 'lucide-react';

export const StudentAttendanceHistoryPage: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.getStudentAttendance('me');
      if (res.success) {
        setRecords(res.records);
        setSummary(res.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              My Laboratory Attendance History
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official laboratory attendance check-in records with geofence verification timestamps
          </p>
        </div>

        <button
          onClick={fetchAttendance}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Attendance Stats Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
            <span className="text-xs text-slate-500 font-medium">Total Registered Sessions</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{summary.totalSessions}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
            <span className="text-xs text-slate-500 font-medium">Present (Verified Inside Geofence)</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{summary.present}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
            <span className="text-xs text-slate-500 font-medium">Compliance Attendance Rate</span>
            <div className="text-2xl font-bold text-blue-600 mt-1">{summary.percentage}%</div>
          </div>
        </div>
      )}

      {/* Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-3">Laboratory</th>
                <th className="py-3 px-3">Experiment</th>
                <th className="py-3 px-3">Geofence Distance</th>
                <th className="py-3 px-3">GPS Accuracy</th>
                <th className="py-3 px-3 text-right">Attendance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length > 0 ? (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {new Date(r.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{r.lab_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{r.lab_code}</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      Exp {r.experiment_number}: {r.experiment_title}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-emerald-700">{r.distance_to_lab}m</span>
                      <span className="text-[10px] text-slate-400 ml-1">({r.geofence_status})</span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono">±{r.accuracy}m</td>
                    <td className="py-3 px-3 text-right">
                      <span className="font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                        {r.verification_status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No attendance records logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
