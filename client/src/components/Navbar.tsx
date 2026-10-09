import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, LogOut, User as UserIcon, Key, Menu, X } from 'lucide-react';
import { api } from '../services/api';
import { LiveClock } from './LiveClock';

export const Navbar: React.FC = () => {
  const { user, logout, setActiveTab, refreshTrigger, triggerRefresh, mobileMenuOpen, setMobileMenuOpen } = useAuth();
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
      case 'HOD':
        return <span className="bg-orange-100 text-orange-900 text-[11px] font-bold px-2 py-0.5 rounded-full border border-orange-300">Head of Dept / Admin</span>;
      case 'FACULTY':
        return <span className="bg-pink-50 text-pink-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-pink-200">Faculty</span>;
      case 'STUDENT':
        return <span className="bg-cyan-50 text-cyan-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-cyan-200">Student</span>;
      default:
        return null;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-subtle">
      {/* Top Department Banner: Balanced Multi-Accent Header with Real-Time Clock */}
      <div className="bg-gradient-to-r from-slate-950 via-pink-950 to-slate-900 border-b border-slate-900 px-3 sm:px-6 py-1.5 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-200 font-medium">
        <div className="flex items-center gap-1.5 sm:gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0"></span>
          <span className="font-extrabold text-white tracking-wide truncate">Guru Nanak Dev Engineering College Bidar</span>
          <span className="text-cyan-400 hidden md:inline">|</span>
          <span className="text-pink-200 font-semibold hidden md:inline">Dept. of CSE (IoT & Cyber Security including Blockchain)</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <LiveClock variant="banner" className="hidden sm:flex" />
          <span className="bg-orange-500/20 border border-orange-400/40 text-orange-300 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold">2026-2027</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between bg-white">
        {/* Brand & Mobile Menu Button */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {user && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-cyan-700 hover:bg-cyan-50 border border-slate-200 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-pink-600" /> : <Menu className="w-5 h-5 text-cyan-700" />}
            </button>
          )}

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-pink-700 to-orange-500 flex items-center justify-center text-white shadow-md shadow-pink-500/25 font-black text-xs sm:text-sm tracking-wider shrink-0">
            GND
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 leading-none">
                Lab<span className="text-cyan-600">Guard</span>
              </span>
              <span className="bg-orange-100 text-orange-800 border border-orange-300 text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wider">
                CSE-ICB
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate max-w-[200px] sm:max-w-none">Attendance & Feedback Platform</p>
          </div>
        </div>

        {/* Right side controls & Real-Time Date/Time */}
        {user ? (
          <div className="flex items-center gap-2 sm:gap-4">
            <LiveClock variant="header" className="hidden xl:flex" />

            {/* Alert Bell for Admin / HOD */}
            {(user.role === 'ADMIN' || user.role === 'HOD') && (
              <button
                onClick={() => setActiveTab('alerts')}
                className="relative p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-orange-600 hover:bg-orange-50 transition-colors border border-transparent hover:border-orange-200"
                title="System Alerts"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
                {alertCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[9px] sm:text-[10px] font-black w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                    {alertCount}
                  </span>
                )}
              </button>
            )}

            {/* User Pill */}
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-100 to-pink-100 border border-cyan-200 flex items-center justify-center text-cyan-900 font-bold shrink-0">
                <UserIcon className="w-4 h-4 text-cyan-700" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 leading-none">{user.name}</span>
                  {getRoleBadge(user.role)}
                </div>
                <div className="text-[11px] text-cyan-800 font-medium mt-0.5 leading-none font-mono">
                  {user.usn ? `USN: ${user.usn}` : user.email}
                </div>
              </div>

              {/* Profile / Credentials Edit Button */}
              <button
                onClick={() => setProfileModalOpen(true)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-cyan-700 hover:bg-cyan-50 transition-colors"
                title="Change Credentials"
              >
                <Key className="w-4 h-4" />
              </button>

              <button
                onClick={logout}
                className="p-1.5 rounded-xl text-slate-400 hover:text-pink-600 hover:bg-pink-50 transition-colors ml-0.5 sm:ml-1"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Edit Profile & Real Credentials Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-pink-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-pink-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-700 flex items-center justify-center border border-pink-200 font-bold">
                  <Key className="w-4 h-4 text-pink-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Account Credentials & Profile</h3>
                  <p className="text-[11px] text-slate-500">Configure your personal email and login password</p>
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

            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Institutional Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-pink-500 outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">This will be your login username.</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">New Password (leave empty to keep current)</label>
                <input
                  type="password"
                  placeholder="Enter new strong password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-4 py-2 bg-gradient-to-r from-pink-800 via-pink-700 to-rose-600 hover:from-pink-900 hover:to-rose-700 text-white rounded-xl font-bold shadow-pink transition-all"
                >
                  {savingProfile ? 'Saving...' : 'Save Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
