import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Bell, LogOut, Radio, User as UserIcon, Key } from 'lucide-react';
import { api } from '../services/api';

export const Navbar: React.FC = () => {
  const { user, logout, setActiveTab, refreshTrigger, triggerRefresh } = useAuth();
  const [alertCount, setAlertCount] = useState<number>(0);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPassword, setEditPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditEmail(user.email);
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setProfileMsg(null);
      const res = await api.updateProfile({
        name: editName,
        email: editEmail,
        password: editPassword || undefined
      });
      if (res.success) {
        setProfileMsg({ type: 'success', text: 'Real credentials updated successfully!' });
        triggerRefresh();
        setTimeout(() => {
          setProfileModalOpen(false);
          setProfileMsg(null);
          setEditPassword('');
        }, 1500);
      }
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update credentials.' });
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    async function fetchAlerts() {
      if (!user || user.role === 'STUDENT') return;
      try {
        const res = await api.getAlerts({ status: 'UNRESOLVED', limit: 100 });
        if (res.success && res.counts) {
          setAlertCount(res.counts.unresolved || 0);
        }
      } catch (err) {
        // quiet error
      }
    }
    fetchAlerts();
    const timer = setInterval(fetchAlerts, 15000);
    return () => clearInterval(timer);
  }, [user, refreshTrigger]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-purple-200">Admin</span>;
      case 'FACULTY':
        return <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-blue-200">Teacher</span>;
      case 'STUDENT':
        return <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">Student</span>;
      default:
        return null;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-subtle">
      {/* Top Department Banner */}
      <div className="bg-slate-100/90 border-b border-slate-200 px-6 py-1.5 flex items-center justify-between text-[11px] text-slate-600 font-medium">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          <span className="font-bold text-slate-800">Guru Nanak Dev Engineering College Bidar</span>
          <span className="text-slate-300">|</span>
          <span className="text-blue-700 font-semibold">Department of CSE in IoT & Cyber Security including Block Chain Technology</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-500 font-medium">Semesters 3, 5, 7</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500">Academic Year 2026-2027</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="px-6 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold text-sm">
            GND
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-slate-900">LabGuard</span>
              <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                GNDEC CSE-ICB
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Attendance & Student Feedback Verification Platform</p>
          </div>
        </div>

        {/* Right side controls */}
        {user ? (
          <div className="flex items-center gap-4">
            {/* Alert Bell for Admin */}
            {user.role === 'ADMIN' && (
              <button
                onClick={() => setActiveTab('alerts')}
                className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="System Alerts"
              >
                <Bell className="w-5 h-5" />
                {alertCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                    {alertCount}
                  </span>
                )}
              </button>
            )}

            {/* User Pill */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-600">
                <UserIcon className="w-5 h-5" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800 leading-none">{user.name}</span>
                  {getRoleBadge(user.role)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-none">
                  {user.usn ? `USN: ${user.usn}` : user.email}
                </div>
              </div>

              {/* Profile / Credentials Edit Button */}
              <button
                onClick={() => setProfileModalOpen(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title="Change Name, Email, or Password"
              >
                <Key className="w-4 h-4" />
              </button>

              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-1"
                title="Sign out of LabGuard"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Edit Profile & Real Credentials Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Account Credentials & Profile</h3>
                  <p className="text-[11px] text-slate-500">Configure your real email and login password</p>
                </div>
              </div>
              <button onClick={() => setProfileModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {profileMsg && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Institutional Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">This will be your real login username.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Password (leave empty to keep current)</label>
                <input
                  type="password"
                  placeholder="Enter new strong password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow"
                >
                  {savingProfile ? 'Saving...' : 'Save Real Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
