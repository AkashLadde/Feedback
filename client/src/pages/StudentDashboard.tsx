import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  GraduationCap,
  MapPin,
  QrCode,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Radio,
  FileText,
  Calendar,
  Layers,
  FlaskConical,
  Sparkles,
  Info
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user, setActiveTab, refreshTrigger } = useAuth();
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [feedbackHistory, setFeedbackHistory] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [labs, setLabs] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('MONDAY');
  const [loading, setLoading] = useState(true);

  const studentSem = user?.semester || 1;

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [attRes, fbRes, sessRes, labsRes, ttRes] = await Promise.all([
          api.getStudentAttendance('me'),
          api.getStudentFeedback('me'),
          api.getActiveSessions(),
          api.getLabs({ semester: studentSem }),
          api.getSemesterTimetable(studentSem)
        ]);

        if (attRes.success) setAttendanceHistory(attRes.records || []);
        if (fbRes.success) setFeedbackHistory(fbRes.feedbacks || []);
        if (sessRes.success && sessRes.sessions?.length > 0) {
          const semSession = sessRes.sessions.find((s: any) => s.semester === studentSem);
          setActiveSession(semSession || null);
        } else {
          setActiveSession(null);
        }
        if (labsRes.success) setLabs(labsRes.labs || []);
        if (ttRes.success) setTimetable(ttRes.entries || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [studentSem, refreshTrigger]);

  const verifiedCount = feedbackHistory.filter(f => f.verification_status === 'VERIFIED').length;
  const underReviewCount = feedbackHistory.filter(f => f.verification_status === 'SUSPICIOUS' || f.verification_status === 'PENDING REVIEW').length;

  const isPendingVerification = user?.status === 'PENDING_VERIFICATION';

  const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const dayEntries = timetable.filter(t => t.day_of_week === selectedDay);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Pending Verification Notice */}
      {isPendingVerification && (
        <div className="bg-amber-50 border-2 border-amber-300 p-5 rounded-2xl shadow-subtle flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <div className="font-extrabold text-sm text-amber-950 flex items-center gap-2">
              <span>Account Pending Administrative Verification</span>
              <span className="bg-amber-200 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Verification in Progress
              </span>
            </div>
            <p>
              Your student account has been registered successfully for <strong>Semester {studentSem}</strong>.
              It is awaiting approval from the Department Administrator or <strong>Dr. Harish Joshi (HOD)</strong>.
              You can explore your laboratory curriculum and time-wise laboratory schedule below.
            </p>
          </div>
        </div>
      )}

      {/* Student Profile Card */}
      <div className="bg-gradient-to-r from-cyan-600 via-cyan-500 to-orange-500 text-white rounded-3xl p-6 shadow-cyan relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white font-black text-2xl shadow-inner">
              {user?.name?.charAt(0) || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight">{user?.name}</h1>
                <span className="bg-white text-cyan-900 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full shadow-xs">
                  USN: {user?.usn || '3GN24CB001'}
                </span>
                {isPendingVerification ? (
                  <span className="bg-amber-300 text-amber-950 font-bold text-[10px] px-2 py-0.5 rounded-full">
                    Pending Verification
                  </span>
                ) : (
                  <span className="bg-emerald-300 text-emerald-950 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Verified Student
                  </span>
                )}
              </div>
              <p className="text-xs text-white/90 font-medium mt-1">
                Semester {studentSem} • Batch {user?.batch || (studentSem === 1 ? '2026-2030 (Batch 2026)' : studentSem === 3 ? '2025-2029 (Batch 2025)' : studentSem === 5 ? '2024-2028 (Batch 2024)' : '2023-2027 (Batch 2023)')}
              </p>
              <p className="text-[11px] text-white/80 font-medium">
                Guru Nanak Dev Engineering College, Bidar • Dept. of CSE (IoT & Cyber Security including Blockchain Technology)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-white/20 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/30 text-right">
              <div className="text-[10px] text-white/90 uppercase font-bold tracking-wider">Head of Department</div>
              <div className="text-white font-black text-sm">
                Dr. Harish Joshi
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Lab Session Action Banner */}
      {activeSession ? (
        <div className="bg-white p-5 rounded-2xl border-2 border-cyan-400 shadow-cyan flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Active Laboratory Session Now:</span>
                <span className="text-xs font-bold text-slate-900">{activeSession.lab_name} ({activeSession.lab_code})</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Experiment {activeSession.experiment_number}: {activeSession.experiment_title} • Room {activeSession.room_number}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('student-attendance')}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Mark Attendance</span>
            </button>
            <button
              onClick={() => setActiveTab('student-feedback')}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Submit Feedback</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* TIME-WISE & SEMESTER-WISE PRACTICAL LABORATORY SCHEDULE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-600" />
              <h2 className="text-base font-extrabold text-slate-900">
                Semester {studentSem} Practical Laboratory Schedule (Time-Wise)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Strictly practical lab sessions organized across morning (09.00 AM - 12.00 PM) & afternoon (02.00 PM - 05.00 PM) time blocks
            </p>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-bold text-cyan-800 bg-cyan-50 px-3 py-1.5 rounded-xl border border-cyan-200">
            <MapPin className="w-3.5 h-3.5 text-cyan-600" />
            <span>25m Room Geofence Enforced</span>
          </div>
        </div>

        {/* Day Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {daysOfWeek.map((day) => {
            const isSelected = selectedDay === day;
            const count = timetable.filter(t => t.day_of_week === day).length;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-md shadow-cyan-500/25 ring-2 ring-cyan-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <span>{day}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected ? 'bg-cyan-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count} Labs
                </span>
              </button>
            );
          })}
        </div>

        {/* Schedule Grid for Selected Day */}
        {dayEntries.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
            No laboratory practicals scheduled on {selectedDay}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {dayEntries.map((entry, idx) => (
              <div
                key={entry.id || idx}
                className="bg-slate-50 hover:bg-cyan-50/40 p-4 rounded-xl border border-slate-200 hover:border-cyan-300 transition-all space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold text-cyan-800 bg-cyan-100/80 px-2 py-0.5 rounded border border-cyan-200">
                    {entry.subject_code}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
                    <Clock className="w-3.5 h-3.5 text-cyan-600" />
                    <span>{entry.time_range}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                    {entry.subject_name}
                  </h3>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{entry.room || 'Practical Laboratory'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="text-slate-600">
                    Instructor: <strong className="text-slate-900">{entry.faculty_name}</strong>
                  </div>
                  <button
                    onClick={() => setActiveTab('student-feedback')}
                    className="text-[11px] font-bold text-cyan-600 hover:text-cyan-800 flex items-center gap-1"
                  >
                    <span>Lab Feedback</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MY SEMESTER PRACTICAL LABORATORIES DIRECTORY */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-orange-600" />
              <h2 className="text-base font-extrabold text-slate-900">
                My Semester {studentSem} Practical Laboratories ({labs.length} Labs)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Official practical curriculum laboratories assigned for Semester {studentSem}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {labs.map((lab) => (
            <div
              key={lab.id}
              className="bg-slate-50 rounded-xl border border-slate-200 p-4 hover:border-orange-300 hover:shadow-sm transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-extrabold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                    {lab.code}
                  </span>
                  <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                    {lab.geofence_radius || 25}m Geofence
                  </span>
                </div>

                <h3 className="text-xs font-extrabold text-slate-900 leading-snug">
                  {lab.name}
                </h3>

                <div className="text-[11px] text-slate-500 space-y-0.5">
                  <div>Room: <strong className="text-slate-700">{lab.room_number}</strong></div>
                  <div>Faculty: <strong className="text-slate-700">{lab.faculty_name || 'Lab In-Charge'}</strong></div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">10 Practical Modules</span>
                <button
                  onClick={() => setActiveTab('student-feedback')}
                  className="font-bold text-orange-600 hover:text-orange-800 flex items-center gap-1"
                >
                  <span>Give Feedback</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Sessions Attended</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{attendanceHistory.length}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">100% Verified Presence</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Feedback Submitted</span>
            <FileText className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{feedbackHistory.length}</div>
          <div className="text-[11px] text-cyan-600 font-medium mt-1">{verifiedCount} Verified Genuine</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Room Geofence</span>
            <MapPin className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-extrabold text-orange-600 mt-2">Active</div>
          <div className="text-[11px] text-slate-500 mt-1">25m Physical Room Boundary</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Audit Flags</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{underReviewCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {underReviewCount === 0 ? 'No suspicious anomalies' : 'Under Review'}
          </div>
        </div>
      </div>

      {/* Recent History Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Log */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Recent Attendance Records</h2>
            <button
              onClick={() => setActiveTab('student-attendance-history')}
              className="text-xs font-semibold text-cyan-600 hover:text-cyan-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {attendanceHistory.length === 0 ? (
              <div className="py-6 text-center text-slate-400">No attendance marked yet.</div>
            ) : (
              attendanceHistory.slice(0, 4).map((att) => (
                <div key={att.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{att.lab_name}</div>
                    <div className="text-slate-500 text-[11px]">Exp {att.experiment_number}: {att.experiment_title}</div>
                  </div>
                  <div className="text-right">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      PRESENT
                    </span>
                    <div className="text-slate-400 text-[10px] mt-0.5">{new Date(att.timestamp).toLocaleDateString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Feedback Log */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Submitted Feedback Status</h2>
            <button
              onClick={() => setActiveTab('student-feedback-history')}
              className="text-xs font-semibold text-orange-600 hover:text-orange-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {feedbackHistory.length === 0 ? (
              <div className="py-6 text-center text-slate-400">No feedback submitted yet.</div>
            ) : (
              feedbackHistory.slice(0, 4).map((fb) => (
                <div key={fb.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{fb.lab_name}</div>
                    <div className="text-slate-500 text-[11px]">
                      Teaching: {fb.teaching_basics} • Viva: {fb.viva}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      fb.verification_status === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : fb.verification_status === 'SUSPICIOUS'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {fb.verification_status}
                    </span>
                    <div className="text-slate-400 text-[10px] mt-0.5">{new Date(fb.submitted_at).toLocaleDateString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

