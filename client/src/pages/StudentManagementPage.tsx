import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  GraduationCap,
  Plus,
  Trash2,
  Edit2,
  Mail,
  Phone,
  Search,
  Filter,
  CheckCircle2,
  Layers,
  Calendar,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export const StudentManagementPage: React.FC = () => {
  const { user, refreshTrigger } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<any | null>(null);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [bulkVerifying, setBulkVerifying] = useState(false);

  // Form states for Add Student
  const [name, setName] = useState('');
  const [usn, setUsn] = useState('');
  const [email, setEmail] = useState('');
  const [semester, setSemester] = useState('3');
  const [batch, setBatch] = useState('2024-2028');
  const [phone, setPhone] = useState('+91-9876543210');
  const [password, setPassword] = useState('Student@123');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.getStudents({
        semester: selectedSemester,
        status: selectedStatus,
        search
      });
      if (res.success) {
        setStudents(res.students || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedSemester, selectedStatus, search, refreshTrigger]);

  const handleVerifyStudent = async (studentId: number, studentUsn: string) => {
    try {
      setVerifyingId(studentId);
      const res = await api.verifyStudent(studentId);
      if (res.success) {
        await fetchStudents();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to verify student');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleVerifyAllPending = async () => {
    if (!confirm('Are you sure you want to verify and activate all pending student accounts?')) return;
    try {
      setBulkVerifying(true);
      const res = await api.verifyAllStudents();
      if (res.success) {
        alert(res.message || 'All pending student accounts have been verified.');
        await fetchStudents();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to bulk verify students');
    } finally {
      setBulkVerifying(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);
      const res = await api.createStudent({
        name: name.trim(),
        usn: usn.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
        semester: parseInt(semester, 10),
        batch,
        phone,
        password
      });

      if (res.success) {
        setCreateModalOpen(false);
        setName('');
        setUsn('');
        setEmail('');
        setPassword('Student@123');
        await fetchStudents();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register student profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;
    try {
      setSubmitting(true);
      const res = await api.updateStudent(editStudent.id, {
        name: editStudent.name,
        semester: parseInt(editStudent.semester, 10),
        batch: editStudent.batch,
        phone: editStudent.phone,
        password: editStudent.new_password || undefined
      });

      if (res.success) {
        setEditStudent(null);
        await fetchStudents();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update student profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async (id: number, studentName: string, studentUsn: string) => {
    if (!confirm(`Are you sure you want to remove student ${studentName} (${studentUsn})?`)) return;
    try {
      const res = await api.deleteStudent(id);
      if (res.success) {
        await fetchStudents();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to remove student');
    }
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HOD';

  const pendingCount = students.filter(s => s.status === 'PENDING_VERIFICATION').length;

  const semesterOptions = [
    { value: 'ALL', label: 'All Semesters' },
    { value: '3', label: '3rd Sem' },
    { value: '5', label: '5th Sem' },
    { value: '7', label: '7th Sem' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-cyan-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-cyan-600" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Student Accounts & Verification Registry
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Department of CSE in IoT & Cyber Security including Block Chain Technology • Student self-registration approval & cohort verification
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && pendingCount > 0 && (
            <button
              onClick={handleVerifyAllPending}
              disabled={bulkVerifying}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{bulkVerifying ? 'Verifying All...' : `Verify All (${pendingCount}) Pending`}</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => {
                setSemester(selectedSemester !== 'ALL' ? selectedSemester : '3');
                setCreateModalOpen(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-orange-500 hover:from-cyan-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-cyan-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Student Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-cyan-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-slate-100">
          {/* Semester Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Layers className="w-4 h-4 text-cyan-600" />
              <span>Semester:</span>
            </span>
            <div className="flex items-center gap-1.5">
              {semesterOptions.map((opt) => {
                const isSelected = selectedSemester === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedSemester(opt.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-500 to-orange-500 text-white shadow-sm ring-2 ring-cyan-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Filter className="w-4 h-4 text-slate-500" />
              <span>Status:</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSelectedStatus('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedStatus === 'ALL'
                    ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Accounts
              </button>
              <button
                onClick={() => setSelectedStatus('PENDING_VERIFICATION')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedStatus === 'PENDING_VERIFICATION'
                    ? 'bg-orange-500 text-white ring-2 ring-orange-300'
                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                }`}
              >
                <span>Pending Verification</span>
                {pendingCount > 0 && (
                  <span className="bg-orange-600 text-white px-1.5 py-0.2 rounded-full text-[10px]">
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setSelectedStatus('ACTIVE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedStatus === 'ACTIVE'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                Active & Verified
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="pt-1 flex items-center justify-between gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by USN (e.g. 3GN...), Name, or Institutional Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{students.length}</strong> accounts
          </div>
        </div>
      </div>

      {/* Students Table / Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-cyan-100 shadow-sm">
          <div className="w-8 h-8 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <span>Loading student accounts...</span>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-cyan-100 shadow-sm text-center space-y-4">
          <GraduationCap className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">
            No Student Accounts Found
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {search
              ? 'No student matches your search term.'
              : selectedStatus === 'PENDING_VERIFICATION'
              ? 'There are currently no students awaiting account verification.'
              : 'Students can register themselves on the registration portal. Once registered, Admin / HOD can verify their accounts here.'}
          </p>
          {isAdmin && (
            <button
              onClick={() => {
                setSemester(selectedSemester !== 'ALL' ? selectedSemester : '3');
                setCreateModalOpen(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-orange-500 hover:from-cyan-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Create Student Account</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-cyan-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cyan-50/50 border-b border-cyan-100 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">USN & Student Name</th>
                  <th className="py-3.5 px-4">Semester & Batch</th>
                  <th className="py-3.5 px-4">Institutional Email</th>
                  <th className="py-3.5 px-4 text-center">Lab Attendance</th>
                  <th className="py-3.5 px-4 text-center">Feedback</th>
                  <th className="py-3.5 px-4 text-center">Account Status</th>
                  {isAdmin && <th className="py-3.5 px-4 text-right">Verification & Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => {
                  const isPending = st.status === 'PENDING_VERIFICATION';
                  return (
                    <tr key={st.id} className={`transition-colors group ${isPending ? 'bg-orange-50/20 hover:bg-orange-50/50' : 'hover:bg-cyan-50/30'}`}>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center text-xs ${
                            isPending ? 'bg-orange-100 text-orange-700' : 'bg-cyan-100 text-cyan-700'
                          }`}>
                            {st.name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">
                              {st.name}
                            </div>
                            <div className="font-mono text-[11px] font-bold text-cyan-700">
                              {st.usn}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          Semester {st.semester}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">Batch: {st.batch || '2024-2028'}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-600 font-mono text-[11px] flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{st.email}</span>
                        </div>
                        {st.phone && (
                          <div className="text-slate-500 font-mono text-[10px] flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{st.phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[11px] border border-emerald-200">
                          {st.attendance_count || 0} Labs
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 bg-cyan-50 text-cyan-700 rounded-full font-bold text-[11px] border border-cyan-200">
                          {st.feedback_count || 0} Submissions
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            PENDING VERIFICATION
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ACTIVE & VERIFIED
                          </span>
                        )}
                      </td>

                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending && (
                              <button
                                onClick={() => handleVerifyStudent(st.id, st.usn)}
                                disabled={verifyingId === st.id}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all"
                                title="Verify and Activate Account"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>{verifyingId === st.id ? 'Verifying...' : 'Verify'}</span>
                              </button>
                            )}
                            <button
                              onClick={() => setEditStudent({ ...st, new_password: '' })}
                              className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                              title="Edit Student Profile"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(st.id, st.name, st.usn)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Remove Student"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add New Student Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-cyan-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Add New Student Profile</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">USN (University Roll No)</label>
                  <input
                    type="text"
                    required
                    placeholder="1RV24CY012"
                    value={usn}
                    onChange={(e) => setUsn(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono uppercase focus:ring-2 focus:ring-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>
                        Semester {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Batch Year</label>
                <input
                  type="text"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  placeholder="2024-2028"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Institutional / College Email</label>
                <input
                  type="email"
                  required
                  placeholder="ramesh.kumar@student.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="+91-9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-cyan-500 outline-none"
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
                <p className="text-[10px] text-slate-400 mt-1">Student can log in using their USN or Email with this password.</p>
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
                  {submitting ? 'Registering...' : 'Register Student Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-cyan-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Edit Student Profile</h3>
                <p className="text-xs text-slate-500">{editStudent.name} ({editStudent.usn})</p>
              </div>
              <button onClick={() => setEditStudent(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleUpdateStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editStudent.name}
                  onChange={(e) => setEditStudent({ ...editStudent, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Semester</label>
                <select
                  value={editStudent.semester}
                  onChange={(e) => setEditStudent({ ...editStudent, semester: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      Semester {n}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Batch Year</label>
                <input
                  type="text"
                  value={editStudent.batch || ''}
                  onChange={(e) => setEditStudent({ ...editStudent, batch: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editStudent.phone || ''}
                  onChange={(e) => setEditStudent({ ...editStudent, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reset Password (leave empty to keep current)</label>
                <input
                  type="text"
                  placeholder="New password (optional)"
                  value={editStudent.new_password || ''}
                  onChange={(e) => setEditStudent({ ...editStudent, new_password: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditStudent(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-orange-500 hover:from-cyan-600 hover:to-orange-600 text-white rounded-lg font-bold shadow"
                >
                  {submitting ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
