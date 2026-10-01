import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  UserCheck,
  Plus,
  Trash2,
  Edit2,
  Mail,
  BadgeAlert,
  Building2,
  Search,
  Key,
  GraduationCap,
  Shield,
  Layers
} from 'lucide-react';

export const FacultyManagementPage: React.FC = () => {
  const { user, refreshTrigger } = useAuth();
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editFaculty, setEditFaculty] = useState<any | null>(null);

  // Form states for Add Teacher
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [specialization, setSpecialization] = useState('IoT and Cybersecurity');
  const [password, setPassword] = useState('Faculty@123');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const res = await api.getFaculty();
      if (res.success) {
        setFaculty(res.faculty || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch faculty:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, [refreshTrigger]);

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);
      const res = await api.createFaculty({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        employee_id: employeeId.trim().toUpperCase(),
        designation,
        specialization,
        password
      });

      if (res.success) {
        setCreateModalOpen(false);
        setName('');
        setEmail('');
        setEmployeeId('');
        setPassword('Faculty@123');
        await fetchFaculty();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register faculty member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFaculty) return;
    try {
      setSubmitting(true);
      const res = await api.updateFaculty(editFaculty.id, {
        name: editFaculty.name,
        designation: editFaculty.designation,
        specialization: editFaculty.specialization,
        password: editFaculty.new_password || undefined
      });

      if (res.success) {
        setEditFaculty(null);
        await fetchFaculty();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update faculty member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFaculty = async (id: number, teacherName: string) => {
    if (!confirm(`Are you sure you want to remove teacher ${teacherName}? All login credentials will be revoked.`)) return;
    try {
      const res = await api.deleteFaculty(id);
      if (res.success) {
        await fetchFaculty();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete faculty member');
    }
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HOD';

  const filteredFaculty = faculty.filter((f) => {
    const s = search.toLowerCase();
    return (
      f.name?.toLowerCase().includes(s) ||
      f.email?.toLowerCase().includes(s) ||
      f.employee_id?.toLowerCase().includes(s) ||
      f.designation?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-cyan-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-cyan-600" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Teachers & Faculty Registry
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Department of IoT and Cybersecurity Including Blockchain Technology • Register teachers, manage designations & lab assignments
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-orange-500 hover:from-cyan-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-cyan-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Teacher</span>
          </button>
        )}
      </div>

      {/* Search Bar & Summary */}
      <div className="bg-white p-4 rounded-2xl border border-cyan-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by teacher name, email, employee ID, or designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-cyan-500 outline-none"
          />
        </div>

        <div className="text-xs font-semibold text-slate-600 bg-cyan-50/50 px-3 py-1.5 rounded-xl border border-cyan-100">
          Total Registered Teachers: <strong className="text-cyan-900">{filteredFaculty.length}</strong>
        </div>
      </div>

      {/* Teachers Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-cyan-100 shadow-sm">
          <div className="w-8 h-8 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <span>Loading teachers directory...</span>
        </div>
      ) : filteredFaculty.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-cyan-100 shadow-sm text-center space-y-4">
          <UserCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">No Teachers Found</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {search ? 'No teachers match your search query.' : 'Click "Add New Teacher" to register faculty members and assign them to laboratory sessions.'}
          </p>
          {isAdmin && !search && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-orange-500 hover:from-cyan-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Register First Teacher</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFaculty.map((f) => (
            <div
              key={f.id}
              className="bg-white rounded-2xl border border-cyan-100 shadow-sm p-5 flex flex-col justify-between hover:border-cyan-300 hover:shadow-md transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-orange-500 text-white font-extrabold flex items-center justify-center text-base shadow-sm">
                      {f.name?.charAt(0) || 'T'}
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-900 group-hover:text-cyan-600 transition-colors">
                        {f.name}
                      </h2>
                      <span className="text-[10px] font-mono font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 inline-block mt-0.5">
                        {f.employee_id}
                      </span>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditFaculty({ ...f, new_password: '' })}
                        className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                        title="Edit Teacher"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteFaculty(f.id, f.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove Teacher"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-xs text-slate-600 space-y-1.5 pt-1">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-cyan-600" />
                    <span>{f.designation}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono">{f.email}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Specialization: <strong className="text-slate-700">{f.specialization || 'IoT & Cybersecurity'}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="bg-cyan-50/50 p-2 rounded-xl border border-cyan-100 text-center">
                    <div className="text-[10px] text-slate-500">Assigned Labs</div>
                    <div className="text-sm font-extrabold text-cyan-700 mt-0.5">
                      {f.assigned_labs_count || 0}
                    </div>
                  </div>
                  <div className="bg-orange-50/50 p-2 rounded-xl border border-orange-100 text-center">
                    <div className="text-[10px] text-slate-500">Live Sessions</div>
                    <div className="text-sm font-extrabold text-orange-700 mt-0.5">
                      {f.conducted_sessions_count || 0}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-[11px] text-slate-400">
                <span>Account Status:</span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  {f.status || 'ACTIVE'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Teacher Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-cyan-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Register New Faculty Member</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateFaculty} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. Arvind Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    placeholder="FAC-IOT-106"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono uppercase focus:ring-2 focus:ring-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                  <select
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium bg-white focus:ring-2 focus:ring-cyan-500 outline-none"
                  >
                    <option value="Associate Professor & Head of Department">Associate Professor & Head of Department</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor">Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Lab Instructor">Lab Instructor</option>
                    <option value="Adjunct Faculty">Adjunct Faculty</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Institutional Email (Login ID)</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. teacher.name@gndec.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Domain Specialization</label>
                <input
                  type="text"
                  placeholder="e.g. Embedded Security & Hardware Cryptography"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Password</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-cyan-500 outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">Teacher will use their email and this password to log in.</p>
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
                  className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-orange-500 hover:from-cyan-600 hover:to-orange-600 text-white rounded-lg font-bold shadow"
                >
                  {submitting ? 'Registering...' : 'Register Teacher & Assign Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {editFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-cyan-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Edit Faculty Profile & Login Password</h3>
              <button onClick={() => setEditFaculty(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleUpdateFaculty} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFaculty.name}
                  onChange={(e) => setEditFaculty({ ...editFaculty, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                <select
                  value={editFaculty.designation}
                  onChange={(e) => setEditFaculty({ ...editFaculty, designation: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium bg-white focus:ring-2 focus:ring-cyan-500 outline-none"
                >
                  <option value="Associate Professor & Head of Department">Associate Professor & Head of Department</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Professor">Professor</option>
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Lab Instructor">Lab Instructor</option>
                  <option value="Adjunct Faculty">Adjunct Faculty</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Specialization</label>
                <input
                  type="text"
                  value={editFaculty.specialization || ''}
                  onChange={(e) => setEditFaculty({ ...editFaculty, specialization: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reset Password (leave empty to keep current)</label>
                <input
                  type="text"
                  placeholder="New password (optional)"
                  value={editFaculty.new_password || ''}
                  onChange={(e) => setEditFaculty({ ...editFaculty, new_password: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditFaculty(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-orange-500 hover:from-cyan-600 hover:to-orange-600 text-white rounded-lg font-bold shadow"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
