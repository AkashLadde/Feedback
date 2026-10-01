import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { FileText, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

export const StudentFeedbackHistoryPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await api.getStudentFeedback('me');
      if (res.success) {
        setFeedbacks(res.feedbacks);
        setSummary(res.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

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
            <FileText className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              My Feedback Verification Statuses
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Status of submitted laboratory feedback after attendance matching and anti-proxy verification
          </p>
        </div>

        <button
          onClick={fetchFeedback}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
            <span className="text-xs text-slate-500 font-medium">Total Submitted</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{summary.total}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
            <span className="text-xs text-slate-500 font-medium">Verified Genuine</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{summary.verified}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
            <span className="text-xs text-slate-500 font-medium">Under Review</span>
            <div className="text-2xl font-bold text-amber-600 mt-1">{summary.underReview}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
            <span className="text-xs text-slate-500 font-medium">Invalidated</span>
            <div className="text-2xl font-bold text-red-600 mt-1">{summary.invalid}</div>
          </div>
        </div>
      )}

      {/* Feedbacks Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-3">Laboratory</th>
                <th className="py-3 px-3">Experiment</th>
                <th className="py-3 px-3">Teaching Basics</th>
                <th className="py-3 px-3">Understanding</th>
                <th className="py-3 px-3 text-right">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {feedbacks.length > 0 ? (
                feedbacks.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {new Date(f.submitted_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">{f.lab_name}</td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      Exp {f.experiment_number}: {f.experiment_title}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">{f.teaching_basics}</td>
                    <td className="py-3 px-3 font-medium text-slate-700">{f.understanding}</td>
                    <td className="py-3 px-3 text-right">
                      {getStatusBadge(f.verification_status)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No feedback records found.
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
