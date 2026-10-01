import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Radio,
  Building2,
  Calendar,
  FileSpreadsheet,
  History,
  CheckCircle2,
  FileText,
  Layers,
  UserCheck,
  GraduationCap,
  ShieldCheck,
  Lock,
  Sparkles
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, activeTab, setActiveTab } = useAuth();

  if (!user) return null;

  const isStudent = user.role === 'STUDENT';
  const isFaculty = user.role === 'FACULTY';
  const isAdmin = user.role === 'ADMIN' || user.role === 'HOD';

  // Admin / HOD navigation items
  const adminNav = [
    { id: 'dashboard', label: 'Department Dashboard', icon: LayoutDashboard, subtitle: 'Overview & Analytics' },
    { id: 'timetable', label: 'Class Timetables', icon: Calendar, subtitle: '3rd, 5th, 7th Sem', highlight: true },
    { id: 'admin-attendance', label: 'Attendance Records', icon: CheckCircle2, subtitle: 'Session Logs & Zero Dupes' },
    { id: 'admin-feedback', label: 'Student Feedback', icon: FileText, subtitle: 'Ratings & Evaluations' },
    { id: 'faculty', label: 'Teachers / Faculty', icon: UserCheck, subtitle: 'Faculty Directory' },
    { id: 'students', label: 'Student Profiles', icon: GraduationCap, subtitle: '3rd, 5th, 7th Cohorts' },
    { id: 'laboratories', label: 'Subjects & Labs', icon: Building2, subtitle: 'Curriculum & 25m Geofences' },
    { id: 'semesters', label: 'Academic Semesters', icon: Layers, subtitle: '3rd, 5th, 7th Sem' },
    { id: 'live-sessions', label: 'Live Lab Sessions', icon: Radio, subtitle: 'Dynamic 1-Min QR' },
    { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet, subtitle: 'CSV Data Downloads' },
    { id: 'audit-logs', label: 'Audit Logs', icon: History, subtitle: 'Security Activity Stream' }
  ];

  // Teachers ONLY take attendance & view timetable
  const facultyNav = [
    { id: 'teacher-attendance', label: 'Take Attendance', icon: UserCheck, subtitle: 'Roll-Call & Session Marking', highlight: true },
    { id: 'timetable', label: 'Class Timetable', icon: Calendar, subtitle: '3rd, 5th, 7th Sem Schedule' }
  ];

  // Students submit feedback, view attendance & timetable
  const studentNav = [
    { id: 'student-dashboard', label: 'Student Portal', icon: LayoutDashboard, subtitle: 'Overview' },
    { id: 'student-attendance', label: 'GPS Check-In', icon: CheckCircle2, subtitle: 'High Accuracy Lab Lock', highlight: true },
    { id: 'student-feedback', label: 'Submit Feedback', icon: FileText, subtitle: 'Rate Teaching & Lab Work', highlight: true },
    { id: 'student-feedback-history', label: 'My Feedback History', icon: History, subtitle: 'Submission Records' },
    { id: 'student-attendance-history', label: 'My Attendance Log', icon: CheckCircle2, subtitle: 'Class Attendance Records' },
    { id: 'timetable', label: 'Class Timetable', icon: Calendar, subtitle: '3rd, 5th, 7th Sem Schedule' }
  ];

  const navItems = isStudent ? studentNav : isFaculty ? facultyNav : adminNav;

  return (
    <aside className="w-64 bg-white border-r border-cyan-100 min-h-[calc(100vh-100px)] flex flex-col justify-between p-4 shadow-subtle shrink-0">
      <div className="space-y-5">
        <div>
          <div className="px-3 mb-2 text-[10px] font-black uppercase tracking-wider text-cyan-700 flex items-center justify-between">
            <span>{isStudent ? 'STUDENT SERVICES' : isFaculty ? 'TEACHER PORTAL' : 'DEPARTMENT OVERSIGHT'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white font-bold shadow-md shadow-cyan-500/20'
                      : item.highlight
                      ? 'text-orange-800 bg-orange-50/90 hover:bg-orange-100/80 border border-orange-200/80 font-bold'
                      : 'text-slate-700 hover:bg-cyan-50/60 hover:text-cyan-800 font-semibold'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.highlight ? 'text-orange-600' : 'text-cyan-600'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs truncate">{item.label}</div>
                    <div className={`text-[10px] truncate ${isActive ? 'text-cyan-100' : item.highlight ? 'text-orange-600/80' : 'text-slate-400'}`}>
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
          <div className="p-3 bg-gradient-to-br from-orange-50 to-white rounded-2xl border border-orange-200 text-xs space-y-1 text-orange-950">
            <div className="flex items-center gap-1.5 font-bold text-orange-800">
              <Lock className="w-3.5 h-3.5 text-orange-600" />
              <span>Teacher Role Policy</span>
            </div>
            <p className="text-[11px] text-orange-900/80 leading-relaxed">
              Teacher access is dedicated exclusively to recording attendance and viewing class schedules. Student feedback ratings are strictly anonymous.
            </p>
          </div>
        )}

        {isStudent && (
          <div className="p-3 bg-gradient-to-br from-cyan-50 to-white rounded-2xl border border-cyan-200 text-xs space-y-1 text-cyan-950">
            <div className="flex items-center gap-1.5 font-bold text-cyan-800">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
              <span>Verified Geolocation</span>
            </div>
            <p className="text-[11px] text-cyan-900/80 leading-relaxed">
              Attendance and feedback are verified using high-precision GPS geofencing inside your active lab room.
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-cyan-100/70 text-[11px] text-slate-500 space-y-1">
        <div className="flex justify-between">
          <span>Institution</span>
          <span className="font-bold text-slate-800">GNDEC Bidar</span>
        </div>
        <div className="flex justify-between">
          <span>Department</span>
          <span className="font-bold text-cyan-700">CSE-ICB</span>
        </div>
        <div className="flex justify-between">
          <span>Academic Year</span>
          <span className="font-mono text-orange-600 font-bold">2026-2027</span>
        </div>
      </div>
    </aside>
  );
};
