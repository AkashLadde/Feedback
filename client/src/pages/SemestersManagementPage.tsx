import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  Building2,
  Users,
  GraduationCap,
  Layers,
  ArrowRight
} from 'lucide-react';

export const SemestersManagementPage: React.FC = () => {
  const { user, setActiveTab, refreshTrigger } = useAuth();
  const [semesters, setSemesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form states
  const [semNumber, setSemNumber] = useState('3');
  const [semName, setSemName] = useState('3rd Semester');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      const res = await api.getSemesters();
      if (res.success) {
        setSemesters(res.semesters || []);
      }
    } catch (err: any) {
      console.error('Failed to load semesters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSemesters();
  }, [refreshTrigger]);

  const handleSemNumberChange = (num: string) => {
    setSemNumber(num);
    const n = parseInt(num, 10);
    const suffix = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
    setSemName(`${n}${suffix} Semester`);
  };

  const handleCreateSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);
      const res = await api.createSemester({
        number: parseInt(semNumber, 10),
        name: semName,
        academic_year: academicYear
      });

      if (res.success) {
        setCreateModalOpen(false);
        await fetchSemesters();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add semester');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSemester = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;
    try {
      const res = await api.deleteSemester(id);
      if (res.success) {
        await fetchSemesters();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete semester');
    }
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HOD';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-cyan-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-600" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Academic Semesters Registry
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Department of IoT and Cybersecurity Including Blockchain Technology • Manage academic terms, lab allocations & student cohorts
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Semester</span>
          </button>
        )}
      </div>

      {/* Semesters Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <div className="w-8 h-8 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <span>Loading academic semesters...</span>
        </div>
      ) : semesters.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-cyan-100 text-center space-y-4 shadow-sm">
          <Calendar className="w-12 h-12 text-cyan-200 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">No Semesters Found</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click "Add New Semester" to register an academic semester (e.g. 3rd Semester) and begin mapping laboratories and students.
          </p>
          {isAdmin && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Semester</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {semesters.map((sem) => (
            <div
              key={sem.id}
              className="bg-white rounded-2xl border border-cyan-100 shadow-sm p-5 flex flex-col justify-between hover:border-cyan-300 hover:shadow-md transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center font-extrabold text-cyan-700 text-base">
                    S{sem.number}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {sem.status || 'ACTIVE'}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteSemester(sem.id, sem.name)}
                        className="p-1 text-slate-300 hover:text-orange-600 rounded transition-colors"
                        title="Delete Semester"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-base font-bold text-slate-900">{sem.name}</h2>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">AY {sem.academic_year || '2026-2027'}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="bg-cyan-50/40 p-2.5 rounded-xl border border-cyan-100">
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-cyan-600" />
                      <span>Laboratories</span>
                    </div>
                    <div className="text-base font-extrabold text-slate-900 mt-0.5">
                      {sem.lab_count || 0}
                    </div>
                  </div>

                  <div className="bg-orange-50/40 p-2.5 rounded-xl border border-orange-100">
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3 text-orange-600" />
                      <span>Students</span>
                    </div>
                    <div className="text-base font-extrabold text-slate-900 mt-0.5">
                      {sem.student_count || 0}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                <button
                  onClick={() => setActiveTab('laboratories')}
                  className="text-xs font-bold text-cyan-700 hover:text-cyan-900 flex items-center gap-1 transition-colors"
                >
                  <span>View Labs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setActiveTab('students')}
                  className="text-xs font-bold text-orange-600 hover:text-orange-800 flex items-center gap-1 transition-colors"
                >
                  <span>View Students</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Semester Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-cyan-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Register Academic Semester</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateSemester} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Semester Number (1 - 8)</label>
                <select
                  value={semNumber}
                  onChange={(e) => handleSemNumberChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white focus:ring-2 focus:ring-cyan-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      Semester {n}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Semester Title</label>
                <input
                  type="text"
                  required
                  value={semName}
                  onChange={(e) => setSemName(e.target.value)}
                  placeholder="e.g. 3rd Semester"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Academic Year</label>
                <input
                  type="text"
                  required
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="2026-2027"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg font-bold shadow shadow-orange-500/20"
                >
                  {submitting ? 'Registering...' : 'Register Semester'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

