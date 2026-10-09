import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  MessageSquare,
  Star,
  Download,
  Filter,
  Users,
  Building2,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Award
} from 'lucide-react';

export const AdminFeedbackPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [stats, setStats] = useState<{ total: number; avgRating: number; ratingCounts: Record<number, number> }>({
    total: 0,
    avgRating: 5.0,
    ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  const [selectedSem, setSelectedSem] = useState<string>('ALL');
  const [selectedRating, setSelectedRating] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await api.getAllFeedback({
        semester: selectedSem,
        rating: selectedRating || undefined
      });
      if (res.success) {
        setFeedbacks(res.feedbacks || []);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [selectedSem, selectedRating]);

  const handleExportCSV = () => {
    if (feedbacks.length === 0) {
      alert('No feedback records available to export.');
      return;
    }

    let csv = 'Feedback ID,Date,Semester,Subject Code,Subject Name,Faculty,Rating,Teaching Basics,Hands-On,Doubt Support,Understanding,Viva Taken,Hardware Setup,Punctuality,Comments\n';
    for (const f of feedbacks) {
      csv += `"${f.id}","${f.submitted_at || ''}","${f.semester || ''}","${f.lab_code || ''}","${f.lab_name || ''}","${f.teacher_name || ''}","${f.overall_rating || 5}","${(f.teaching_basics || '').replace(/"/g, '""')}","${(f.hands_on || '').replace(/"/g, '""')}","${(f.doubt_support || '').replace(/"/g, '""')}","${(f.reason_understanding || f.understanding || '').replace(/"/g, '""')}","${(f.viva_taken || f.viva || '').replace(/"/g, '""')}","${(f.hardware_setup || '').replace(/"/g, '""')}","${(f.lab_punctuality || '').replace(/"/g, '""')}","${(f.comments || '').replace(/"/g, '""')}"\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `GNDEC_Student_Feedback_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Student Feedback Records & Quality Assessment
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official feedback submissions evaluated across 3rd, 5th, and 7th Semester faculty and subjects
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchFeedback}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
            title="Refresh Feedback Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-gradient-to-r from-pink-800 to-pink-700 hover:from-pink-900 hover:to-pink-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-pink-900/20 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-700 flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Feedbacks Logged</div>
            <div className="text-2xl font-extrabold text-slate-900">{stats.total}</div>
            <div className="text-[11px] text-slate-400">Anonymous & Verified</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
            <Star className="w-6 h-6 fill-amber-400 stroke-amber-500" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Average Satisfaction Score</div>
            <div className="text-2xl font-extrabold text-slate-900">{stats.avgRating} <span className="text-xs font-normal text-slate-400">/ 5.0</span></div>
            <div className="text-[11px] text-emerald-600 font-bold">Excellent Rating Metric</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-700 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">5-Star Feedback Count</div>
            <div className="text-2xl font-extrabold text-slate-900">{stats.ratingCounts[5] || 0}</div>
            <div className="text-[11px] text-pink-800 font-medium">Highest Praise Given</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Semester Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs flex-wrap">
            {['ALL', '3', '5', '7'].map(sem => (
              <button
                key={sem}
                onClick={() => setSelectedSem(sem)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  selectedSem === sem
                    ? 'bg-pink-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sem === 'ALL' ? 'All Semesters' : `Sem ${sem}`}
              </button>
            ))}
          </div>

          {/* Rating Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setSelectedRating('')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                !selectedRating ? 'bg-pink-700 text-white' : 'text-slate-600'
              }`}
            >
              All Stars
            </button>
            {[5, 4, 3, 2, 1].map(r => (
              <button
                key={r}
                onClick={() => setSelectedRating(String(r))}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-0.5 ${
                  selectedRating === String(r) ? 'bg-pink-700 text-white' : 'text-slate-600'
                }`}
              >
                <span>{r}</span>
                <Star className="w-3 h-3 fill-amber-400 stroke-amber-500" />
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Showing <strong>{feedbacks.length}</strong> feedback evaluations
        </span>
      </div>

      {/* Feedback Feed */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-pink-700 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <span className="text-xs font-bold">Loading student feedback records...</span>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-xs font-bold">No feedback records found matching selected filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {feedbacks.map((fb) => (
            <div
              key={fb.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle hover:border-pink-300 transition-all space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{fb.lab_name}</span>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      {fb.lab_code}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Faculty: <strong>{fb.teacher_name || 'Department Faculty'}</strong> • Semester {fb.semester}
                  </div>
                </div>

                {/* Rating Badge */}
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl shrink-0">
                  <Star className="w-4 h-4 fill-amber-400 stroke-amber-500" />
                  <span className="text-xs font-extrabold text-amber-900">{fb.overall_rating || 5}.0</span>
                </div>
              </div>

              {/* Evaluation Parameters Pills */}
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Teaching Basics:</span>
                  <span className="font-semibold text-slate-800">{fb.teaching_basics}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Hands-On Lab Done:</span>
                  <span className="font-semibold text-slate-800">{fb.hands_on}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Doubt Support:</span>
                  <span className="font-semibold text-slate-800">{fb.doubt_support || 'Extremely supportive'}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Viva Conducted:</span>
                  <span className="font-semibold text-slate-800">{fb.viva_taken || fb.viva || 'Yes'}</span>
                </div>
              </div>

              {/* Comments if any */}
              {fb.comments && (
                <div className="p-3 bg-pink-50/50 rounded-xl border border-pink-100 text-xs text-pink-950 italic">
                  "{fb.comments}"
                </div>
              )}

              {/* Footer */}
              <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400">
                <span>Submitted by: <strong>{fb.student_name} ({fb.usn})</strong></span>
                <span>{fb.submitted_at?.split('T')[0] || fb.submitted_at}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
