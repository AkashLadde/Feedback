import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { LiveClock } from '../components/LiveClock';
import {
  Users,
  Building2,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Star,
  BookOpen,
  UserCheck,
  Clock,
  FlaskConical,
  MessageSquare,
  Sparkles,
  Layers,
  MapPin,
  HelpCircle,
  Filter,
  Calendar,
  CalendarDays
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, setActiveTab, refreshTrigger } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [timetableEntries, setTimetableEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSem, setSelectedSem] = useState<string>('ALL');

  const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const dayNamesFull = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const currentDayOfWeek = dayNamesFull[new Date().getDay()];
  const defaultDay = daysOfWeek.includes(currentDayOfWeek) ? currentDayOfWeek : 'MONDAY';
  const [selectedDay, setSelectedDay] = useState<string>(defaultDay);

  const semesterOptions = [
    { value: 'ALL', label: 'All Semesters' },
    { value: '3', label: '3rd Sem (Batch 2025)' },
    { value: '5', label: '5th Sem (Batch 2024)' },
    { value: '7', label: '7th Sem (Batch 2023)' }
  ];

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [res, ttRes] = await Promise.all([
          api.getDepartmentAnalytics({ semester: selectedSem }),
          api.getTimetables({ semester: selectedSem !== 'ALL' ? selectedSem : undefined })
        ]);
        if (res.success) {
          setData(res);
        }
        if (ttRes.success && ttRes.allEntries) {
          setTimetableEntries(ttRes.allEntries);
        }
      } catch (err) {
        console.error('Failed to load department analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedSem, refreshTrigger]);

  const metrics = data?.metrics || {
    totalStudents: 0,
    totalLaboratories: 0,
    activeSessions: 0,
    totalAttendance: 0,
    totalFeedback: 0,
    pendingAlerts: 0,
    labQuality: { avgRating: '5.0', handsOnRate: 100, vivaRate: 100, basicsTaughtRate: 100 },
    verification: { verified: 0, suspicious: 0, mismatch: 0, invalid: 0, pendingReview: 0, totalIssues: 0 }
  };

  const labs = data?.labs || [];
  const facultyConduct = data?.facultyConduct || [];
  const recentFeedbacks = data?.recentFeedbacks || [];

  // Filter timetable for selected day
  const filteredTimetable = timetableEntries.filter((t: any) => {
    const semMatch = selectedSem === 'ALL' || t.semester === Number(selectedSem);
    const dayMatch = selectedDay === 'ALL' || t.day_of_week === selectedDay;
    return semMatch && dayMatch;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Welcome & Department Banner */}
      <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-pink-100 text-pink-800 rounded-xl">
              <FlaskConical className="w-5 h-5 text-pink-700" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Department Academic & Laboratory Dashboard
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Guru Nanak Dev Engineering College Bidar • Dept. of CSE in IoT & Cyber Security including Block Chain Technology
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <LiveClock variant="header" />
          <button
            onClick={() => setActiveTab('students')}
            className="px-3.5 py-2.5 bg-gradient-to-r from-pink-800 to-rose-600 hover:from-pink-900 hover:to-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-pink-800/20"
          >
            <UserCheck className="w-3.5 h-3.5 text-pink-200" />
            <span>Verify & Manage Students</span>
          </button>

          <button
            onClick={() => setActiveTab('admin-feedback')}
            className="px-3.5 py-2.5 bg-pink-50 hover:bg-pink-100 text-pink-900 border border-pink-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5 text-pink-700" />
            <span>Student Feedback Stream</span>
          </button>

          <button
            onClick={() => setActiveTab('timetable')}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-200"
          >
            <Calendar className="w-3.5 h-3.5 text-pink-700" />
            <span>Lab Timetables</span>
          </button>
        </div>
      </div>

      {/* Semester Filter Tabs Bar */}
      <div className="bg-white p-4 rounded-2xl border border-pink-100 shadow-subtle flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Filter className="w-4 h-4 text-pink-700" />
          <span>Semester Filter:</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {semesterOptions.map((opt) => {
            const isSelected = selectedSem === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setSelectedSem(opt.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 ${
                  isSelected
                    ? 'bg-gradient-to-r from-pink-800 to-rose-600 text-white shadow-md shadow-pink-800/20 ring-2 ring-pink-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Enrolled Students</span>
            <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{metrics.totalStudents}</div>
          <div className="text-[11px] text-pink-800 font-medium mt-1">
            {selectedSem === 'ALL' ? 'All Academic Semesters' : `Semester ${selectedSem} Registered Cohort`}
          </div>
        </div>

        {/* Total Laboratories */}
        <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Curriculum Practical Labs</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{metrics.totalLaboratories}</div>
          <div className="text-[11px] text-rose-800 font-medium mt-1">
            {selectedSem === 'ALL' ? 'Official GNDEC Practical Labs' : `Assigned for Semester ${selectedSem}`}
          </div>
        </div>

        {/* Total Attendance Logs */}
        <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Laboratory Attendance Logs</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-2">{metrics.totalAttendance}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            100% Physical Room Geofence Enforced
          </div>
        </div>

        {/* Total Feedback Submissions */}
        <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Student Feedback Submissions</span>
            <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-700 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-pink-900 mt-2">{metrics.totalFeedback}</div>
          <div className="text-[11px] text-pink-700 font-medium mt-1">
            {metrics.verification?.verified || metrics.totalFeedback} Verified Genuine Submissions
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📅 DEPARTMENT PRACTICAL LABORATORY SCHEDULE (REAL-TIME CALENDAR & DAY-WISE) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-pink-100 shadow-subtle p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-pink-100">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-pink-700" />
              <h2 className="text-base font-extrabold text-slate-900">
                Department Practical Laboratory Schedule (Day-Wise)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live curriculum practical laboratory schedule with official time slots, assigned faculty, and room locations
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-pink-50 text-pink-900 border border-pink-200 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-pink-700" />
              <span>System Day: <strong>{currentDayOfWeek}</strong></span>
            </span>

            <button
              onClick={() => setActiveTab('timetable')}
              className="text-xs font-bold text-pink-800 hover:text-pink-950 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 transition-all"
            >
              <span>Full Timetable Grid</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Day Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {['ALL', ...daysOfWeek].map((day) => {
            const isSelected = selectedDay === day;
            const isToday = currentDayOfWeek === day;
            const count = day === 'ALL'
              ? timetableEntries.filter(t => selectedSem === 'ALL' || t.semester === Number(selectedSem)).length
              : timetableEntries.filter(t => (selectedSem === 'ALL' || t.semester === Number(selectedSem)) && t.day_of_week === day).length;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-gradient-to-r from-pink-800 via-pink-700 to-rose-700 text-white shadow-md shadow-pink-500/25 ring-2 ring-pink-300'
                    : 'bg-pink-50/50 hover:bg-pink-100/70 text-slate-700 hover:text-pink-900 border border-pink-200'
                }`}
              >
                <span>{day === 'ALL' ? 'ALL DAYS' : day}</span>
                {isToday && (
                  <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black">
                    TODAY
                  </span>
                )}
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected ? 'bg-pink-950 text-white' : 'bg-pink-200 text-pink-900 font-bold'
                }`}>
                  {count} {count === 1 ? 'Lab' : 'Labs'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Schedule Cards Grid */}
        {filteredTimetable.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-pink-50/20 rounded-xl border border-pink-100">
            No laboratory practicals scheduled on {selectedDay} for {selectedSem === 'ALL' ? 'any semester' : `Semester ${selectedSem}`}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {filteredTimetable.map((entry: any, idx: number) => (
              <div
                key={entry.id || idx}
                className="p-4 rounded-xl border border-slate-200 hover:border-pink-300 bg-slate-50 hover:bg-pink-50/30 transition-all space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-pink-900 bg-pink-100 border border-pink-200 px-2 py-0.5 rounded">
                        {entry.subject_code}
                      </span>
                      <span className="text-[10px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                        Sem {entry.semester}
                      </span>
                      {entry.batch && (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                          {entry.batch}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                      {entry.day_of_week}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-xs text-slate-900 line-clamp-1">
                      {entry.subject_name}
                    </h3>
                    <p className="text-[11px] text-pink-700 font-semibold mt-0.5">
                      {entry.subject_abbr}
                    </p>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <Clock className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                      <span>{entry.time_range}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">Faculty: <strong className="text-slate-800">{entry.faculty_name || entry.faculty_abbr}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{entry.room}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LABORATORY-WISE & TEACHER-WISE FEEDBACK TABLE (SEMESTER-WISE) */}
      <div className="bg-white rounded-2xl border border-pink-100 shadow-subtle overflow-hidden space-y-0">
        <div className="p-5 border-b border-pink-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-pink-50/40">
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-pink-700" />
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
                {selectedSem === 'ALL'
                  ? 'All Practical Laboratories & Teacher Feedback Breakdown (Semester-Wise)'
                  : `Semester ${selectedSem} Practical Laboratories & Faculty Evaluation`}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Curriculum practical labs, assigned teachers, verified student attendance, and teaching evaluation scores
            </p>
          </div>

          <button
            onClick={() => setActiveTab('laboratories')}
            className="text-xs font-bold text-pink-800 hover:text-pink-950 flex items-center gap-1"
          >
            <span>Manage All Labs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading laboratory details...</div>
        ) : labs.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No laboratories found for {selectedSem === 'ALL' ? 'the selected filter' : `Semester ${selectedSem}`}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-pink-50/60 border-b border-pink-100 text-pink-950 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Subject Code & Laboratory</th>
                  <th className="py-3 px-3">Semester</th>
                  <th className="py-3 px-3">Faculty / Teacher In-Charge</th>
                  <th className="py-3 px-3">Room</th>
                  <th className="py-3 px-3 text-center">Attendance</th>
                  <th className="py-3 px-3 text-center">Feedbacks</th>
                  <th className="py-3 px-3 text-center">Avg Rating</th>
                  <th className="py-3 px-3 text-center">Hands-On %</th>
                  <th className="py-3 px-3 text-center">Viva %</th>
                  <th className="py-3 px-3 text-center">Basics %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {labs.map((lab: any) => (
                  <tr key={lab.id} className="hover:bg-pink-50/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900">{lab.name}</div>
                      <div className="text-[10px] font-mono text-pink-800 font-bold">{lab.code}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-sans font-bold text-[10px] bg-pink-100 text-pink-900 px-2 py-0.5 rounded border border-pink-200">
                        Sem {lab.semester}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-800">
                      <div className="font-bold">{lab.faculty_name || 'Lab In-Charge'}</div>
                      <div className="text-[10px] text-slate-400">{lab.faculty_designation || 'Faculty'}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">{lab.room_number || 'Lab Room'}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">{lab.attendance_count || 0}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">{lab.feedback_count || 0}</td>
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1 font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{lab.avgRating || '5.0'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {lab.handsOnPct}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {lab.vivaPct}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-700">
                      {lab.basicsTaughtPct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TEACHER LAB CONDUCT & ACCOUNTABILITY MONITOR */}
      <div className="bg-white rounded-2xl border border-pink-100 shadow-subtle overflow-hidden">
        <div className="p-5 border-b border-pink-100 flex flex-wrap items-center justify-between gap-3 bg-pink-50/30">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-pink-700" />
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
                Teacher Lab Conduct & Faculty Evaluation Summary
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Accountability breakdown of practical teaching, individual desk guidance, viva conduction, and feedback metrics
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="bg-white px-3 py-1.5 rounded-xl border border-pink-200 text-slate-700 font-bold shadow-xs">
              Avg Quality Rating: <strong className="text-pink-700">{metrics.labQuality?.avgRating || '5.0'} / 5.0</strong>
            </span>
          </div>
        </div>

        {facultyConduct.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No faculty conduct logs recorded for {selectedSem === 'ALL' ? 'the selected filter' : `Semester ${selectedSem}`}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-pink-50/60 border-b border-pink-100 text-pink-950 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-3">Designation</th>
                  <th className="py-3 px-3">Assigned Lab & Sem</th>
                  <th className="py-3 px-3 text-center">Feedbacks</th>
                  <th className="py-3 px-3 text-center">Avg Rating</th>
                  <th className="py-3 px-3 text-center">Hands-On Experience</th>
                  <th className="py-3 px-3 text-center">Viva Voce Compliance</th>
                  <th className="py-3 px-3 text-center">Basics Taught</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {facultyConduct.map((fac: any, idx: number) => (
                  <tr key={`${fac.faculty_id}-${idx}`} className="hover:bg-pink-50/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{fac.faculty_name}</td>
                    <td className="py-3 px-3 text-slate-600">{fac.designation}</td>
                    <td className="py-3 px-3">
                      {fac.assigned_lab_name ? (
                        <div>
                          <span className="font-semibold text-slate-900">{fac.assigned_lab_name}</span>
                          <span className="ml-1 text-[10px] text-pink-800 font-mono font-bold">
                            (Sem {fac.assigned_semester})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Department Faculty</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">{fac.feedback_count || 0}</td>
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{fac.avg_rating || '5.0'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {fac.hands_on_pct || 100}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {fac.viva_pct || 100}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-700">
                      {fac.basics_taught_pct || 100}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RECENT GENUINE STUDENT FEEDBACK SUBMISSIONS STREAM */}
      <div className="bg-white rounded-2xl border border-pink-100 shadow-subtle p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-pink-700" />
              <h2 className="text-base font-extrabold text-slate-900">
                {selectedSem === 'ALL'
                  ? 'Real-Time Student Feedback Submissions'
                  : `Semester ${selectedSem} Student Feedback Submissions`}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live submissions recorded from authenticated students during active laboratory practical windows
            </p>
          </div>

          <button
            onClick={() => setActiveTab('admin-feedback')}
            className="text-xs font-bold text-pink-800 hover:text-pink-950 flex items-center gap-1"
          >
            <span>View Full Feedback Registry</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentFeedbacks.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
            No feedback records submitted yet for {selectedSem === 'ALL' ? 'the selected filter' : `Semester ${selectedSem}`}.
            When students complete practical sessions and submit compulsory feedback, entries appear here in real time.
          </div>
        ) : (
          <div className="space-y-3">
            {recentFeedbacks.map((fb: any) => (
              <div
                key={fb.id}
                className="bg-slate-50 hover:bg-pink-50/40 p-4 rounded-xl border border-slate-200 hover:border-pink-300 transition-all space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-xs">{fb.lab_name}</span>
                    <span className="font-mono text-[10px] font-bold text-pink-900 bg-pink-100 px-2 py-0.5 rounded">
                      {fb.lab_code}
                    </span>
                    <span className="text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      Sem {fb.semester}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs font-extrabold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{fb.overall_rating || 5} Stars</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      fb.verification_status === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : fb.verification_status === 'SUSPICIOUS'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {fb.verification_status || 'VERIFIED'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px] text-slate-600 pt-1">
                  <div>Instructor: <strong className="text-slate-800">{fb.faculty_name}</strong></div>
                  <div>Student: <strong className="text-slate-800">{fb.student_name}</strong> {fb.student_usn ? `(${fb.student_usn})` : ''}</div>
                  <div>Hands-on: <span className="text-emerald-700 font-semibold">{fb.hands_on}</span></div>
                  <div>Viva: <span className="text-rose-700 font-semibold">{fb.viva_taken}</span></div>
                </div>

                {fb.comments && (
                  <div className="text-[11px] text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 italic">
                    "{fb.comments}"
                  </div>
                )}

                <div className="text-[10px] text-slate-400 text-right">
                  Submitted at: {new Date(fb.submitted_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

