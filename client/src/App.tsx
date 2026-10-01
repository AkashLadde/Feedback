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
  const { user, loading, activeTab } = useAuth();

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
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Main Navbar */}
      <Navbar />

      {/* Workspace with Sidebar & Main Body */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
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
