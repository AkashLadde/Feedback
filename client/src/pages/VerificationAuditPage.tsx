import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { VerificationDetailModal } from '../components/VerificationDetailModal';
import {
  ShieldCheck,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileSpreadsheet,
  Clock,
  MapPin,
  RefreshCw
} from 'lucide-react';

export const VerificationAuditPage: React.FC = () => {
  const { refreshTrigger } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [inspectFeedbackId, setInspectFeedbackId] = useState<number | null>(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await api.getVerificationRecords({
        status: selectedStatus,
        search
      });
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
    fetchRecords();
  }, [selectedStatus, refreshTrigger]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecords();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded text-[11px]">VERIFIED</span>;
      case 'SUSPICIOUS':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 font-bold px-2 py-0.5 rounded text-[11px]">SUSPICIOUS</span>;
      case 'MISMATCH':
        return <span className="bg-purple-100 text-purple-800 border border-purple-300 font-bold px-2 py-0.5 rounded text-[11px]">MISMATCH</span>;
      case 'INVALID':
        return <span className="bg-red-100 text-red-800 border border-red-300 font-bold px-2 py-0.5 rounded text-[11px]">INVALID</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 border border-slate-300 font-bold px-2 py-0.5 rounded text-[11px]">PENDING REVIEW</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Attendance + Feedback Verification Engine Audit
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time verification log matching physical attendance records against dynamic QR feedback submissions
          </p>
        </div>

        <button
          onClick={fetchRecords}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit Feed</span>
        </button>
      </div>

      {/* Summary Filter Pills */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { id: 'ALL', label: 'All Records', count: summary.total, color: 'border-slate-300 bg-white text-slate-800' },
            { id: 'VERIFIED', label: 'Verified Genuine', count: summary.verified, color: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
            { id: 'SUSPICIOUS', label: 'Suspicious Proxy', count: summary.suspicious, color: 'border-amber-300 bg-amber-50 text-amber-800' },
            { id: 'MISMATCH', label: 'Lab/Sec Mismatch', count: summary.mismatch, color: 'border-purple-300 bg-purple-50 text-purple-800' },
            { id: 'INVALID', label: 'Invalid Tokens/Geo', count: summary.invalid, color: 'border-red-300 bg-red-50 text-red-800' },
            { id: 'PENDING REVIEW', label: 'Pending Review', count: summary.pending_review, color: 'border-slate-300 bg-slate-100 text-slate-700' }
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setSelectedStatus(pill.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedStatus === pill.id ? 'ring-2 ring-blue-500 font-bold shadow-sm' : 'opacity-80 hover:opacity-100'
              } ${pill.color}`}
            >
              <div className="text-[10px] uppercase font-semibold">{pill.label}</div>
              <div className="text-xl font-extrabold mt-0.5">{pill.count || 0}</div>
            </button>
          ))}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student name, USN, or lab code..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>

        <div className="text-xs text-slate-500">
          Showing <strong>{records.length}</strong> verification logs
        </div>
      </div>

      {/* Verification Audit Table (Section 35) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-3">Laboratory</th>
                <th className="py-3 px-3">Experiment</th>
                <th className="py-3 px-3 text-center">Attendance</th>
                <th className="py-3 px-3 text-center">Feedback</th>
                <th className="py-3 px-3">Location / Dist</th>
                <th className="py-3 px-3">Submission Time</th>
                <th className="py-3 px-3 text-center">Verification Status</th>
                <th className="py-3 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length > 0 ? (
                records.map((r) => {
                  let flagsArr: string[] = [];
                  try {
                    flagsArr = typeof r.flags === 'string' ? JSON.parse(r.flags) : (r.flags || []);
                  } catch (e) {
                    flagsArr = [];
                  }

                  return (
                    <tr
                      key={r.feedback_id}
                      onClick={() => setInspectFeedbackId(r.feedback_id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{r.student_name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{r.usn}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{r.lab_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{r.lab_code}</div>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700">
                        Exp {r.experiment_number}: {r.experiment_title?.slice(0, 28)}...
                      </td>
                      <td className="py-3 px-3 text-center">
                        {r.attendance_id ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Present</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            <XCircle className="w-3 h-3 text-red-600" />
                            <span>Missing</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-medium text-slate-700">
                        <span className="text-[11px] text-blue-700 font-semibold">{r.teaching_basics}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`font-mono text-[11px] font-bold ${
                          r.feedback_dist > 50 ? 'text-red-600' : 'text-slate-800'
                        }`}>
                          {r.feedback_dist}m from lab
                        </span>
                        {r.feedback_dist > 50 && (
                          <div className="text-[10px] text-red-600 font-semibold">Outside 50m!</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                        {new Date(r.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {getStatusBadge(r.verification_status)}
                        {flagsArr.length > 0 && (
                          <div className="text-[9px] font-mono text-red-600 mt-0.5 truncate max-w-[120px]">
                            {flagsArr[0]}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectFeedbackId(r.feedback_id);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Open Inspection Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    No verification records found matching current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Detail Modal */}
      {inspectFeedbackId && (
        <VerificationDetailModal
          feedbackId={inspectFeedbackId}
          onClose={() => setInspectFeedbackId(null)}
          onResolved={fetchRecords}
        />
      )}
    </div>
  );
};
