import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Radio,
  Building2,
  BookOpen,
  Calendar,
  FileSpreadsheet,
  History,
  QrCode,
  MapPin,
  CheckCircle2,
  FileText,
  Layers,
  UserCheck,
  GraduationCap,
  ShieldCheck,
  Lock
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, activeTab, setActiveTab } = useAuth();

  if (!user) return null;

  const isStudent = user.role === 'STUDENT';
  const isFaculty = user.role === 'FACULTY';
  const isAdmin = user.role === 'ADMIN';

  // Admin sees all details
  const adminNav = [
    { id: 'dashboard', label: 'Department Dashboard', icon: LayoutDashboard, subtitle: 'Overview & Analytics' },
    { id: 'timetable', label: 'Class Timetables', icon: Calendar, subtitle: '3rd, 5th, 7th Sem', highlight: true },
    { id: 'admin-attendance', label: 'Attendance Records', icon: CheckCircle2, subtitle: 'Teacher Attendance Logs' },
    { id: 'admin-feedback', label: 'Student Feedback', icon: FileText, subtitle: 'Ratings & Evaluations' },
    { id: 'faculty', label: 'Teachers / Faculty', icon: UserCheck, subtitle: 'Faculty Directory' },
    { id: 'students', label: 'Student Profiles', icon: GraduationCap, subtitle: '3rd, 5th, 7th Cohorts' },
    { id: 'laboratories', label: 'Subjects & Labs', icon: Building2, subtitle: 'Curriculum & Geofences' },
    { id: 'semesters', label: 'Academic Semesters', icon: Layers, subtitle: '3rd, 5th, 7th Sem' },
    { id: 'live-sessions', label: 'Live Lab Sessions', icon: Radio, subtitle: 'Dynamic QR Projector' },
    { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet, subtitle: 'CSV Data Downloads' },
    { id: 'audit-logs', label: 'Audit Logs', icon: History, subtitle: 'System Activity Logs' }
  ];

  // Teachers ONLY take attendance & view timetable
  const facultyNav = [
    { id: 'teacher-attendance', label: 'Take Attendance', icon: UserCheck, subtitle: 'Roll-Call & Session Attendance', highlight: true },
    { id: 'timetable', label: 'Class Timetable', icon: Calendar, subtitle: '3rd, 5th, 7th Sem Schedule' }
  ];

  // Students submit feedback, view attendance & timetable
  const studentNav = [
    { id: 'student-dashboard', label: 'Student Portal', icon: LayoutDashboard, subtitle: 'Overview' },
    { id: 'student-feedback', label: 'Submit Feedback', icon: FileText, subtitle: 'Rate Teaching & Labs', highlight: true },
    { id: 'student-feedback-history', label: 'My Feedback History', icon: History, subtitle: 'Submission Records' },
    { id: 'student-attendance-history', label: 'My Attendance Log', icon: CheckCircle2, subtitle: 'Class Attendance Records' },
    { id: 'timetable', label: 'Class Timetable', icon: Calendar, subtitle: '3rd, 5th, 7th Sem Schedule' }
  ];

  const navItems = isStudent ? studentNav : isFaculty ? facultyNav : adminNav;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-100px)] flex flex-col justify-between p-4 shadow-subtle shrink-0">
      <div className="space-y-6">
        <div>
          <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            {isStudent ? 'STUDENT SERVICES' : isFaculty ? 'TEACHER PORTAL' : 'ADMINISTRATIVE OVERSIGHT'}
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20'
                      : item.highlight
                      ? 'text-blue-700 bg-blue-50/80 hover:bg-blue-100/70 border border-blue-200/50 font-medium'
                      : 'text-slate-700 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : item.highlight ? 'text-blue-600' : 'text-slate-500'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs truncate">{item.label}</div>
                    <div className={`text-[10px] truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                      {item.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Informational Role Policy Banner */}
        {isFaculty && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1 text-amber-900">
            <div className="flex items-center gap-1.5 font-bold">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Teacher Role Policy</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Teacher access is dedicated exclusively to recording attendance and viewing class schedules. Student feedback ratings are recorded anonymously.
            </p>
          </div>
        )}

        {isStudent && (
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1 text-emerald-900">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Confidential Feedback</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Your feedback is anonymous and directly reviewed by department administration.
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
        <div className="flex justify-between">
          <span>Institution</span>
          <span className="font-bold text-slate-700">GNDEC Bidar</span>
        </div>
        <div className="flex justify-between">
          <span>Department</span>
          <span className="font-semibold text-blue-700">CSE-ICB</span>
        </div>
        <div className="flex justify-between">
          <span>Academic Year</span>
          <span className="font-mono text-slate-600">2026-2027</span>
        </div>
      </div>
    </aside>
  );
};
