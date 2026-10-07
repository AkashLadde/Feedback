import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  BookOpen,
  Edit2,
  Building2,
  CheckCircle,
  FileCode,
  Sparkles
} from 'lucide-react';

export const ExperimentsManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [labs, setLabs] = useState<any[]>([]);
  const [selectedLabId, setSelectedLabId] = useState<number>(1);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExp, setEditingExp] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getLabs().then((res) => {
      if (res.success && res.labs.length > 0) {
        setLabs(res.labs);
        setSelectedLabId(res.labs[0].id);
      }
    });
  }, []);

  const fetchExperiments = async () => {
    if (!selectedLabId) return;
    try {
      setLoading(true);
      const res = await api.getExperiments(selectedLabId);
      if (res.success) {
        setExperiments(res.experiments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, [selectedLabId]);

  const handleSaveExp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExp) return;
    try {
      setSaving(true);
      await api.updateExperiment(editingExp.id, {
        title: editingExp.title,
        description: editingExp.description,
        objectives: editingExp.objectives,
        tools_required: editingExp.tools_required
      });
      setEditingExp(null);
      await fetchExperiments();
    } catch (err: any) {
      alert('Failed to update experiment: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const selectedLab = labs.find((l) => l.id === selectedLabId);
  const canEdit = user?.role === 'ADMIN' || user?.role === 'FACULTY';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-pink-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-pink-700" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              12-Experiment Laboratory Syllabus Management
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Configure experiment titles, practical objectives, tools required, and viva criteria
          </p>
        </div>

        {/* Lab Selector Pill Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
          {labs.map((lab) => (
            <button
              key={lab.id}
              onClick={() => setSelectedLabId(lab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedLabId === lab.id
                  ? 'bg-gradient-to-r from-pink-800 to-pink-700 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-700 hover:bg-pink-50 hover:text-pink-900 border border-slate-200'
              }`}
            >
              {lab.code}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Lab Context Banner */}
      <div className="bg-gradient-to-r from-pink-900 via-pink-800 to-pink-700 text-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
        <div>
          <div className="text-[10px] text-pink-200 font-bold uppercase tracking-wider">Active Laboratory Syllabus</div>
          <h2 className="text-lg font-bold text-white mt-0.5">
            {selectedLab?.name} ({selectedLab?.code})
          </h2>
          <div className="text-xs text-pink-100 mt-0.5">
            12 Scheduled Hands-On Experiments • Room {selectedLab?.room_number} • Semester {selectedLab?.semester || 3}
          </div>
        </div>
        <div className="text-right text-xs">
          <span className="bg-white/20 text-white border border-white/30 font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
            12/12 Experiments Defined
          </span>
        </div>
      </div>

      {/* Experiments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {experiments.map((exp) => (
          <div
            key={exp.id}
            className="bg-white rounded-2xl border border-pink-100 shadow-sm p-5 flex flex-col justify-between hover:border-pink-300 hover:shadow-md transition-all space-y-3"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-pink-900 bg-pink-50 px-2 py-0.5 rounded border border-pink-200">
                  Experiment #{exp.experiment_number}
                </span>

                {canEdit && (
                  <button
                    onClick={() => setEditingExp(exp)}
                    className="p-1.5 text-slate-400 hover:text-pink-700 hover:bg-pink-50 rounded-lg transition-colors"
                    title="Edit Experiment"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <h3 className="font-bold text-slate-900 text-sm leading-snug">{exp.title}</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{exp.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>Hands-on & Viva</span>
              </span>
              <span className="font-mono text-pink-800 font-semibold">Syllabus Active</span>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Experiment Modal */}
      {editingExp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-pink-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Edit Experiment #{editingExp.experiment_number}
                </h3>
                <p className="text-xs text-slate-500">{selectedLab?.name}</p>
              </div>
              <button onClick={() => setEditingExp(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveExp} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Experiment Title</label>
                <input
                  type="text"
                  required
                  value={editingExp.title}
                  onChange={(e) => setEditingExp({ ...editingExp, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-pink-600 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description & Methodology</label>
                <textarea
                  required
                  rows={3}
                  value={editingExp.description}
                  onChange={(e) => setEditingExp({ ...editingExp, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-pink-600 outline-none font-medium"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingExp(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 bg-gradient-to-r from-pink-800 to-pink-700 hover:from-pink-900 hover:to-pink-800 text-white rounded-lg font-bold shadow shadow-pink-900/20"
                >
                  Save Experiment Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

