import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  UserCheck,
  Plus,
  Trash2,
  Edit2,
  Mail,
  Building2,
  Search,
  Key,
  GraduationCap,
  Shield,
  Layers,
  FlaskConical,
  Clock,
  MapPin,
  Filter,
  CheckCircle2,
  Award,
  Sparkles
} from 'lucide-react';

interface AssignedLab {
  id: number;
  name: string;
  code: string;
  semester: number;
  room_number: string;
  status: string;
}

interface TimetableSlot {
  id: number;
  semester: number;
  day_of_week: string;
  time_range: string;
  subject_code: string;
  subject_abbr: string;
  subject_name: string;
  room: string;
}

interface FacultyMember {
  id: number;
  user_id: number;
  name: string;
  email: string;
  employee_id: string;
  designation: string;
  specialization?: string;
  status: string;
  assigned_labs_count: number;
  conducted_sessions_count: number;
  assigned_labs?: AssignedLab[];
  timetable_slots?: TimetableSlot[];
  semesters_handled?: number[];
}

export const FacultyManagementPage: React.FC = () => {
  const { user, refreshTrigger } = useAuth();
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSemFilter, setSelectedSemFilter] = useState<string>('ALL');
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
    const matchesSearch =
      f.name?.toLowerCase().includes(s) ||
      f.email?.toLowerCase().includes(s) ||
      f.employee_id?.toLowerCase().includes(s) ||
      f.designation?.toLowerCase().includes(s) ||
      f.assigned_labs?.some(l => l.name.toLowerCase().includes(s) || l.code.toLowerCase().includes(s));

    if (!matchesSearch) return false;

    if (selectedSemFilter !== 'ALL') {
      const semNum = parseInt(selectedSemFilter, 10);
      return f.assigned_labs?.some(l => l.semester === semNum) || f.semesters_handled?.includes(semNum);
    }

    return true;
  });

  const getSemOrdinal = (sem: number) => {
    if (sem === 1) return '1st Sem';
    if (sem === 3) return '3rd Sem';
    if (sem === 5) return '5th Sem';
    if (sem === 7) return '7th Sem';
    return `${sem}th Sem`;
  };

  // Group labs by semester for a given faculty member
  const groupLabsBySemester = (labs: AssignedLab[] = []) => {
    const grouped: Record<number, AssignedLab[]> = {};
    labs.forEach(lab => {
      if (!grouped[lab.semester]) grouped[lab.semester] = [];
      grouped[lab.semester].push(lab);
    });
    return grouped;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-pink-700" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Teachers & Faculty Directory
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Guru Nanak Dev Engineering College Bidar • Dept. of CSE (IoT & Cyber Security including Blockchain Technology) • Verified Faculty & Semester-Wise Assigned Practical Laboratories
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-pink-800 to-pink-700 hover:from-pink-900 hover:to-pink-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-pink-900/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Teacher</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        {/* Semester Filter Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mr-1">
            <Filter className="w-3.5 h-3.5 text-pink-700" />
            <span>Filter by Lab Semester:</span>
          </div>
          {[
            { label: 'All Semesters', value: 'ALL' },
            { label: '1st Sem Labs', value: '1' },
            { label: '3rd Sem Labs', value: '3' },
            { label: '5th Sem Labs', value: '5' },
            { label: '7th Sem Labs', value: '7' }
          ].map((tab) => {
            const isSelected = selectedSemFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setSelectedSemFilter(tab.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-pink-800 to-pink-700 text-white shadow-md shadow-pink-900/20 ring-2 ring-pink-200'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search teacher name, designation, or handled lab..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-pink-600 outline-none"
          />
        </div>
      </div>

      {/* Teachers & Handled Labs Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-8 h-8 border-3 border-pink-700 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <span className="text-xs font-semibold">Loading teachers directory and assigned laboratories...</span>
        </div>
      ) : filteredFaculty.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
          <UserCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">No Teachers Found</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {search
              ? 'No teachers match your search query.'
              : selectedSemFilter !== 'ALL'
              ? `No teachers currently assigned to laboratories for Semester ${selectedSemFilter}.`
              : 'Click "Add New Teacher" to register faculty members and configure their practical lab assignments.'}
          </p>
          {isAdmin && !search && selectedSemFilter === 'ALL' && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-pink-800 to-pink-700 hover:from-pink-900 hover:to-pink-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Register First Teacher</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredFaculty.map((f) => {
            const groupedLabs = groupLabsBySemester(f.assigned_labs || []);
            const semKeys = Object.keys(groupedLabs)
              .map(Number)
              .sort((a, b) => a - b);

            const isHOD = f.designation?.toLowerCase().includes('head of department') || f.name?.toLowerCase().includes('harish joshi');

            return (
              <div
                key={f.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-card hover:border-pink-300 transition-all p-6 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  {/* Top Profile Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-13 h-13 rounded-2xl ${
                          isHOD
                            ? 'bg-gradient-to-br from-pink-900 to-pink-700 text-white'
                            : 'bg-gradient-to-br from-pink-800 to-pink-700 text-white'
                        } font-black flex items-center justify-center text-lg shadow-md`}
                      >
                        {f.name?.charAt(0) || 'T'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                            {f.name}
                          </h2>
                          {isHOD && (
                            <span className="bg-pink-100 text-pink-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-pink-200 flex items-center gap-1">
                              <Award className="w-3 h-3 text-pink-700" />
                              HOD
                            </span>
                          )}
                        </div>
                        {/* Designation */}
                        <div className="text-xs font-bold text-pink-800 flex items-center gap-1.5 mt-0.5">
                          <Shield className="w-3.5 h-3.5 text-pink-700 shrink-0" />
                          <span>{f.designation}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {f.employee_id}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{f.email}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setEditFaculty({ ...f, new_password: '' })}
                          className="p-2 text-slate-400 hover:text-pink-700 hover:bg-pink-50 rounded-xl transition-colors"
                          title="Edit Teacher"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFaculty(f.id, f.name)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Remove Teacher"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Specialization Badge */}
                  {f.specialization && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                      <span>Domain Specialization:</span>
                      <strong className="text-slate-800">{f.specialization}</strong>
                    </div>
                  )}

                  {/* Respected Handled Practical Laboratories (Semester-Wise) */}
                  <div className="pt-2 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <FlaskConical className="w-4 h-4 text-pink-700" />
                        <span>Respected Handled Practical Laboratories</span>
                      </div>
                      <span className="text-[10px] font-bold text-pink-800 bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-full">
                        {f.assigned_labs?.length || 0} Total Lab{f.assigned_labs?.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    {semKeys.length === 0 ? (
                      <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400 italic">
                        No practical laboratories assigned currently.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {semKeys.map((sem) => {
                          const semLabs = groupedLabs[sem];
                          return (
                            <div
                              key={sem}
                              className="bg-slate-50/90 rounded-2xl p-3 border border-slate-200 space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-extrabold text-pink-900 bg-pink-100/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <Layers className="w-3 h-3 text-pink-700" />
                                  <span>{getSemOrdinal(sem)} Practical Labs</span>
                                </span>
                                <span className="text-[10px] text-slate-500 font-semibold">
                                  {semLabs.length} Course{semLabs.length === 1 ? '' : 's'}
                                </span>
                              </div>

                              <div className="space-y-1.5 pt-1">
                                {semLabs.map((lab) => (
                                  <div
                                    key={lab.id}
                                    className="bg-white rounded-xl p-2.5 border border-slate-200/90 shadow-xs flex items-center justify-between gap-2"
                                  >
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-mono font-bold text-pink-800 bg-pink-50 border border-pink-200 px-1.5 py-0.5 rounded text-[10px]">
                                          {lab.code}
                                        </span>
                                        <span className="font-bold text-slate-900 text-xs truncate">
                                          {lab.name}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="shrink-0 flex items-center gap-1 text-[10px] text-slate-500 font-medium bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                                      <MapPin className="w-3 h-3 text-slate-400" />
                                      <span className="truncate max-w-[120px]">{lab.room_number}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Card Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Status: <strong className="text-emerald-700">{f.status || 'ACTIVE'}</strong></span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500">
                    Sessions Conducted: <strong className="text-slate-800">{f.conducted_sessions_count || 0}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Teacher Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-pink-700" />
                <h3 className="font-extrabold text-slate-900 text-base">Register New Faculty Member</h3>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateFaculty} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Teacher Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. Mahesh Kanjikar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-pink-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    placeholder="GNDEC-ICB-014"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono uppercase focus:ring-2 focus:ring-pink-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Academic Designation</label>
                  <select
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium bg-white focus:ring-2 focus:ring-pink-600 outline-none"
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
                <label className="block font-bold text-slate-700 mb-1">Institutional Email (Login ID)</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. mahesh.kanjikar@gndec.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-pink-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Domain Specialization</label>
                <input
                  type="text"
                  placeholder="e.g. Object Oriented Programming with Java"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-pink-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Password</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-pink-600 outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">Teacher will use this password to sign in to GNDEC LabGuard.</p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gradient-to-r from-pink-800 to-pink-700 hover:from-pink-900 hover:to-pink-800 text-white rounded-xl font-bold shadow-md shadow-pink-900/20 transition-all"
                >
                  {submitting ? 'Registering...' : 'Register Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {editFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-pink-700" />
                <h3 className="font-extrabold text-slate-900 text-base">Edit Teacher Profile & Designation</h3>
              </div>
              <button onClick={() => setEditFaculty(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleUpdateFaculty} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFaculty.name}
                  onChange={(e) => setEditFaculty({ ...editFaculty, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-pink-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Academic Designation</label>
                <select
                  value={editFaculty.designation}
                  onChange={(e) => setEditFaculty({ ...editFaculty, designation: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium bg-white focus:ring-2 focus:ring-pink-600 outline-none"
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
                <label className="block font-bold text-slate-700 mb-1">Domain Specialization</label>
                <input
                  type="text"
                  value={editFaculty.specialization || ''}
                  onChange={(e) => setEditFaculty({ ...editFaculty, specialization: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-pink-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reset Password (leave empty to keep current)</label>
                <input
                  type="text"
                  placeholder="New password (optional)"
                  value={editFaculty.new_password || ''}
                  onChange={(e) => setEditFaculty({ ...editFaculty, new_password: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-pink-600 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditFaculty(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gradient-to-r from-pink-800 to-pink-700 hover:from-pink-900 hover:to-pink-800 text-white rounded-xl font-bold shadow-md shadow-pink-900/20 transition-all"
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


