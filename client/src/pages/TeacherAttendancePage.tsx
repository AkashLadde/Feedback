import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import {
  UserCheck,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Search,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  QrCode,
  ShieldCheck,
  Check,
  X,
  History,
  AlertCircle
} from 'lucide-react';

export const TeacherAttendancePage: React.FC = () => {
  const { user } = useAuth();

  const [semesters] = useState<number[]>([3, 5, 7]);
  const [selectedSem, setSelectedSem] = useState<number>(user?.semester || 7);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState<string>('09.00 AM - 12.00 PM');

  const [labs, setLabs] = useState<any[]>([]);
  const [selectedLabId, setSelectedLabId] = useState<number | null>(null);

  const [students, setStudents] = useState<any[]>([]);
  const [attendanceState, setAttendanceState] = useState<Record<number, { status: 'PRESENT' | 'ABSENT' | 'LATE'; remarks: string }>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Past sessions
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<'TAKE' | 'HISTORY'>('TAKE');

  // Load labs when selected semester changes
  useEffect(() => {
    async function loadLabs() {
      try {
        setLoading(true);
        const res = await api.getLabs({ semester: selectedSem });
        if (res.success && res.labs) {
          setLabs(res.labs);
          // Try to select a lab assigned to this teacher if any, or first lab
          const myLab = res.labs.find((l: any) => l.faculty_name?.toLowerCase().includes(user?.name?.toLowerCase() || ''));
          setSelectedLabId(myLab ? myLab.id : res.labs.length > 0 ? res.labs[0].id : null);
        }
      } catch (err) {
        console.error('Error loading labs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLabs();
  }, [selectedSem, user]);

  // Load student roster when sem, lab, or date changes
  useEffect(() => {
    async function loadRoster() {
      if (!selectedLabId) return;
      try {
        setLoading(true);
        const res = await api.getRoster({
          semester: selectedSem,
          laboratory_id: selectedLabId,
          date: selectedDate
        });

        if (res.success && res.students) {
          setStudents(res.students);

          // Populate initial attendance state
          const newAttState: Record<number, { status: 'PRESENT' | 'ABSENT' | 'LATE'; remarks: string }> = {};
          for (const s of res.students) {
            newAttState[s.student_id] = {
              status: s.verification_status ? (s.verification_status as any) : 'PRESENT',
              remarks: s.remarks || ''
            };
          }
          setAttendanceState(newAttState);
        }
      } catch (err) {
        console.error('Error loading roster:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRoster();
  }, [selectedSem, selectedLabId, selectedDate]);

  // Load past attendance sessions taken by this faculty
  useEffect(() => {
    async function loadPastSessions() {
      try {
        const res = await api.getTeacherAttendanceSessions();
        if (res.success && res.sessions) {
          setPastSessions(res.sessions);
        }
      } catch (err) {
        console.error('Error loading teacher sessions:', err);
      }
    }
    loadPastSessions();
  }, [saving]);

  const handleStatusChange = (studentId: number, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleRemarksChange = (studentId: number, remarks: string) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks
      }
    }));
  };

  const handleMarkAll = (status: 'PRESENT' | 'ABSENT') => {
    setAttendanceState(prev => {
      const updated = { ...prev };
      for (const s of students) {
        updated[s.student_id] = {
          ...updated[s.student_id],
          status
        };
      }
      return updated;
    });
  };

  const handleSaveAttendance = async () => {
    if (!selectedLabId) {
      alert('Please select a subject / laboratory first.');
      return;
    }

    try {
      setSaving(true);
      setStatusMessage(null);

      const payload = {
        laboratory_id: selectedLabId,
        semester: selectedSem,
        date: selectedDate,
        time_slot: selectedSlot,
        attendance: students.map(s => ({
          student_id: s.student_id,
          status: attendanceState[s.student_id]?.status || 'PRESENT',
          remarks: attendanceState[s.student_id]?.remarks || undefined
        }))
      };

      const res = await api.takeAttendance(payload);
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `✅ Attendance saved successfully! (${res.summary?.present || 0} Present, ${res.summary?.absent || 0} Absent, ${res.summary?.percentage || 100}%)`
        });

        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });

        setTimeout(() => setStatusMessage(null), 5000);
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to submit attendance.'
      });
    } finally {
      setSaving(false);
    }
  };

  // Metrics
  const totalStudents = students.length;
  const presentCount = Object.values(attendanceState).filter(a => a.status === 'PRESENT').length;
  const absentCount = Object.values(attendanceState).filter(a => a.status === 'ABSENT').length;
  const lateCount = Object.values(attendanceState).filter(a => a.status === 'LATE').length;
  const attendancePercent = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 100;

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.usn?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedLab = labs.find(l => l.id === selectedLabId);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-pink-900 via-pink-800 to-pink-700 rounded-3xl p-6 sm:p-8 text-white shadow-md shadow-pink-900/20 flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-bold px-3 py-1 rounded-full">
            <UserCheck className="w-3.5 h-3.5 text-white" />
            <span>Guru Nanak Dev Engineering College Bidar • CSE-ICB</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Teacher Attendance Portal
          </h1>
          <p className="text-xs sm:text-sm text-white/90 max-w-2xl leading-relaxed font-medium">
            Take roll-call attendance for 3rd, 5th, and 7th semester lectures and laboratories. 
            Student feedback is recorded anonymously and kept strictly confidential.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('TAKE')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeView === 'TAKE'
                ? 'bg-white text-pink-900 shadow-lg shadow-black/10 ring-2 ring-white/50'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Take Attendance</span>
          </button>
          <button
            onClick={() => setActiveView('HISTORY')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeView === 'HISTORY'
                ? 'bg-white text-pink-900 shadow-lg shadow-black/10 ring-2 ring-white/50'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <History className="w-4 h-4" />
            <span>My Attendance History</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
            : 'bg-rose-50 text-rose-800 border-rose-300'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {activeView === 'TAKE' ? (
        <>
          {/* Controls Bar: Semester, Subject, Section, Date, Slot */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Semester Picker */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-pink-700" />
                  <span>Semester</span>
                </label>
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                  {semesters.map(sem => (
                    <button
                      key={sem}
                      type="button"
                      onClick={() => setSelectedSem(sem)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedSem === sem
                          ? 'bg-pink-700 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Sem {sem}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject / Course Picker */}
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-pink-700" />
                  <span>Subject / Laboratory ({labs.length})</span>
                </label>
                <select
                  value={selectedLabId || ''}
                  onChange={(e) => setSelectedLabId(Number(e.target.value))}
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-pink-600 font-medium text-slate-800"
                >
                  {labs.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.code} - {l.name} ({l.room_number})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-pink-700" />
                  <span>Date</span>
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-pink-600 font-medium text-slate-800"
                />
              </div>

              {/* Time Slot */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-pink-700" />
                  <span>Time Slot</span>
                </label>
                <select
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-pink-600 font-medium text-slate-800"
                >
                  <option value="11.10 AM - 01.00 PM">11.10 AM - 01.00 PM (Midday Practical Session - 5th Sem Tue/Wed/Sat)</option>
                  <option value="03.00 PM - 05.00 PM">03.00 PM - 05.00 PM (Afternoon Practical Session - 3rd/5th Sem Mon/Tue/Wed)</option>
                  <option value="02.00 PM - 04.00 PM">02.00 PM - 04.00 PM (Afternoon Practical Session - 3rd Sem Thu/Fri, 5th Sem Fri)</option>
                  <option value="09.00 AM - 10.50 AM">09.00 AM - 10.50 AM (Morning Practical Session - 3rd Sem Sat)</option>
                  <option value="09.00 AM - 12.00 PM">09.00 AM - 12.00 PM (Standard Morning Practical Session)</option>
                  <option value="02.00 PM - 05.00 PM">02.00 PM - 05.00 PM (Standard Afternoon Practical Session)</option>
                </select>
              </div>
            </div>

            {/* Selected Subject Info Header */}
            {selectedLab && (
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{selectedLab.name}</span>
                  <span className="bg-pink-100 text-pink-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {selectedLab.code}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span>Room: {selectedLab.room_number}</span>
                  <span className="text-slate-400">•</span>
                  <span>Faculty: {selectedLab.faculty_name}</span>
                </div>

                <div className="text-[11px] text-slate-500">
                  Semester <strong>{selectedSem}</strong> • Batch: <strong>{selectedSem === 3 ? '2024-2028' : selectedSem === 5 ? '2023-2027' : '2022-2026'}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Quick Metrics & Batch Action Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle flex flex-wrap items-center justify-between gap-4">
            {/* Quick Metrics */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Enrolled:</span>
                <span className="text-base font-extrabold text-slate-900">{totalStudents}</span>
              </div>
              <div className="h-4 w-px bg-slate-200"></div>
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold">{presentCount} Present</span>
              </div>
              <div className="h-4 w-px bg-slate-200"></div>
              <div className="flex items-center gap-2 text-rose-700">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-bold">{absentCount} Absent</span>
              </div>
              <div className="h-4 w-px bg-slate-200"></div>
              <div className="flex items-center gap-2 text-pink-800 font-extrabold text-xs">
                <span>{attendancePercent}% Attendance Rate</span>
              </div>
            </div>

            {/* Quick Mark Buttons & Save Button */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleMarkAll('PRESENT')}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark All Present</span>
              </button>

              <button
                type="button"
                onClick={() => handleMarkAll('ABSENT')}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Mark All Absent</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={saving}
                className="px-5 py-2 bg-gradient-to-r from-pink-800 to-pink-700 hover:from-pink-900 hover:to-pink-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-pink-900/20 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save & Submit Attendance</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search student by name or USN (e.g. 3GN24CB...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-600 bg-white"
            />
          </div>

          {/* Students Roster Grid */}
          {loading ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              <div className="w-8 h-8 border-3 border-pink-700 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <span className="text-xs font-bold">Loading Semester {selectedSem} Student Roster...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-bold">No students found matching current filters.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
              <div className="divide-y divide-slate-100">
                {filteredStudents.map((s, idx) => {
                  const att = attendanceState[s.student_id] || { status: 'PRESENT', remarks: '' };
                  const isPresent = att.status === 'PRESENT';
                  const isAbsent = att.status === 'ABSENT';
                  const isLate = att.status === 'LATE';

                  return (
                    <div
                      key={s.student_id}
                      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                        isAbsent ? 'bg-rose-50/40' : isPresent ? 'hover:bg-slate-50/70' : 'bg-amber-50/40'
                      }`}
                    >
                      {/* Student Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono font-bold text-slate-400 w-6">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-800 to-pink-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                          {s.name?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate">{s.name}</span>
                            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {s.usn}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                            Semester {s.semester} • {s.email}
                          </div>
                        </div>
                      </div>

                      {/* Status Buttons & Remarks */}
                      <div className="flex items-center gap-2.5 self-end sm:self-center">
                        <input
                          type="text"
                          placeholder="Add remark (optional)"
                          value={att.remarks}
                          onChange={(e) => handleRemarksChange(s.student_id, e.target.value)}
                          className="text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-pink-600 bg-white w-32 sm:w-44 text-slate-700"
                        />

                        {/* Status Toggle Buttons */}
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(s.student_id, 'PRESENT')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                              isPresent
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Present</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(s.student_id, 'ABSENT')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                              isAbsent
                                ? 'bg-rose-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                            }`}
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Absent</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(s.student_id, 'LATE')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                              isLate
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>Late</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Showing {filteredStudents.length} of {totalStudents} enrolled students
                </span>
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-pink-800 to-pink-700 hover:from-pink-900 hover:to-pink-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-pink-900/20 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving Records...' : 'Save & Submit Attendance'}</span>
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* History View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">My Attendance Sessions Log</h2>
              <p className="text-xs text-slate-500">Historical records of classroom and laboratory attendance taken by you</p>
            </div>
            <span className="text-xs font-bold bg-pink-100 text-pink-900 px-3 py-1 rounded-full">
              {pastSessions.length} Recorded Sessions
            </span>
          </div>

          {pastSessions.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-bold">No past attendance records found for this teacher account.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pastSessions.map(sess => (
                <div key={sess.id} className="py-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{sess.lab_name}</span>
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">
                        {sess.lab_code}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-xs text-slate-500">Semester {sess.semester}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                      <span>Date: <strong>{sess.date}</strong></span>
                      <span>Time: <strong>{sess.start_time}</strong></span>
                      <span>Room: <strong>{sess.room_number}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-lg">
                      {sess.present_count || 0} Present
                    </span>
                    <span className="bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold px-3 py-1 rounded-lg">
                      {sess.absent_count || 0} Absent
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      Code: {sess.session_code?.split('-').slice(-2).join('-')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
