import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { LiveSessionPage } from './pages/LiveSessionPage';
import { LaboratoriesManagementPage } from './pages/LaboratoriesManagementPage';
import { SemestersManagementPage } from './pages/SemestersManagementPage';
import { FacultyManagementPage } from './pages/FacultyManagementPage';
import { StudentManagementPage } from './pages/StudentManagementPage';
import { ExperimentsManagementPage } from './pages/ExperimentsManagementPage';
import { VerificationAuditPage } from './pages/VerificationAuditPage';
import { AlertsPage } from './pages/AlertsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';

import { StudentDashboard } from './pages/StudentDashboard';
import { StudentAttendancePage } from './pages/StudentAttendancePage';
import { StudentFeedbackPage } from './pages/StudentFeedbackPage';
import { StudentAttendanceHistoryPage } from './pages/StudentAttendanceHistoryPage';
import { StudentFeedbackHistoryPage } from './pages/StudentFeedbackHistoryPage';

import { TeacherAttendancePage } from './pages/TeacherAttendancePage';
import { TimetablePage } from './pages/TimetablePage';
import { AdminAttendancePage } from './pages/AdminAttendancePage';
import { AdminFeedbackPage } from './pages/AdminFeedbackPage';

const AppContent: React.FC = () => {
  const { user, loading, activeTab, setActiveTab } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-xs font-bold text-slate-700 tracking-wide">
            Initializing GNDEC Academic Platform...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderPage = () => {
    // 1. Student Role Enforcement
    if (user.role === 'STUDENT') {
      switch (activeTab) {
        case 'student-feedback':
          return <StudentFeedbackPage />;
        case 'student-attendance':
          return <StudentAttendancePage />;
        case 'student-feedback-history':
          return <StudentFeedbackHistoryPage />;
        case 'student-attendance-history':
          return <StudentAttendanceHistoryPage />;
        case 'timetable':
          return <TimetablePage />;
        case 'student-dashboard':
        default:
          return <StudentDashboard />;
      }
    }

    // 2. Faculty / Teacher Role Enforcement (Strict isolation from Admin portal)
    if (user.role === 'FACULTY') {
      switch (activeTab) {
        case 'timetable':
          return <TimetablePage />;
        case 'teacher-attendance':
        default:
          return <TeacherAttendancePage />;
      }
    }

    // 3. Admin Role Oversight
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'timetable':
        return <TimetablePage />;
      case 'admin-attendance':
        return <AdminAttendancePage />;
      case 'admin-feedback':
        return <AdminFeedbackPage />;
      case 'live-sessions':
        return <LiveSessionPage />;
      case 'verification':
        return <VerificationAuditPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'semesters':
        return <SemestersManagementPage />;
      case 'laboratories':
        return <LaboratoriesManagementPage />;
      case 'faculty':
        return <FacultyManagementPage />;
      case 'students':
        return <StudentManagementPage />;
      case 'experiments':
        return <ExperimentsManagementPage />;
      case 'audit-logs':
        return <AuditLogsPage />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 pb-16 lg:pb-0">
      {/* Main Navbar */}
      <Navbar />

      {/* Workspace with Sidebar & Main Body */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-3 sm:p-6 md:p-8 overflow-y-auto min-w-0">
          {renderPage()}
        </main>
      </div>

      {/* Mobile Smartphone Bottom Quick Navigation Bar */}
      {user && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-cyan-100 px-2 py-1.5 z-40 flex items-center justify-around shadow-lg">
          {user.role === 'STUDENT' ? (
            <>
              <button
                onClick={() => setActiveTab('student-dashboard')}
                className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
                  activeTab === 'student-dashboard' ? 'text-cyan-700 font-extrabold' : 'text-slate-500'
                }`}
              >
                <span className="text-base">🏛️</span>
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab('student-attendance')}
                className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
                  activeTab === 'student-attendance' ? 'text-orange-600 font-extrabold' : 'text-slate-500'
                }`}
              >
                <span className="text-base">📍</span>
                <span>Mark Lab</span>
              </button>
              <button
                onClick={() => setActiveTab('timetable')}
                className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
                  activeTab === 'timetable' ? 'text-cyan-700 font-extrabold' : 'text-slate-500'
                }`}
              >
                <span className="text-base">📅</span>
                <span>Timetable</span>
              </button>
            </>
          ) : user.role === 'FACULTY' ? (
            <>
              <button
                onClick={() => setActiveTab('teacher-attendance')}
                className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
                  activeTab === 'teacher-attendance' ? 'text-orange-600 font-extrabold' : 'text-slate-500'
                }`}
              >
                <span className="text-base">📋</span>
                <span>Roll Call</span>
              </button>
              <button
                onClick={() => setActiveTab('timetable')}
                className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
                  activeTab === 'timetable' ? 'text-cyan-700 font-extrabold' : 'text-slate-500'
                }`}
              >
                <span className="text-base">📅</span>
                <span>Schedule</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
                  activeTab === 'dashboard' ? 'text-cyan-700 font-extrabold' : 'text-slate-500'
                }`}
              >
                <span className="text-base">📊</span>
                <span>Analytics</span>
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
                  activeTab === 'students' ? 'text-orange-600 font-extrabold' : 'text-slate-500'
                }`}
              >
                <span className="text-base">🎓</span>
                <span>Students</span>
              </button>
              <button
                onClick={() => setActiveTab('admin-feedback')}
                className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
                  activeTab === 'admin-feedback' ? 'text-cyan-700 font-extrabold' : 'text-slate-500'
                }`}
              >
                <span className="text-base">💬</span>
                <span>Feedback</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
