import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, getApiBaseUrl, setApiBaseUrl } from '../services/api';
import confetti from 'canvas-confetti';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  UserCheck,
  Laptop,
  GraduationCap,
  ShieldAlert,
  CheckCircle2,
  BookOpen,
  Calendar,
  Layers,
  UserPlus,
  LogIn,
  Phone,
  User as UserIcon,
  Sparkles,
  Link2,
  Server,
  Settings,
  RefreshCw
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Backend API URL Configuration
  const initialBaseUrl = getApiBaseUrl();
  const [serverUrl, setServerUrl] = useState(initialBaseUrl);
  const [showServerConfig, setShowServerConfig] = useState(
    typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') && !initialBaseUrl
  );
  const [testingServer, setTestingServer] = useState(false);
  const [serverStatus, setServerStatus] = useState<'UNTESTED' | 'ONLINE' | 'ERROR'>('UNTESTED');

  // Login States
  const [roleTab, setRoleTab] = useState<'ADMIN' | 'TEACHER' | 'STUDENT'>('STUDENT');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Student Registration States
  const [regName, setRegName] = useState('');
  const [regUsn, setRegUsn] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regSemester, setRegSemester] = useState<number>(3);
  const [regBatch, setRegBatch] = useState('2024-2028');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regDepartment] = useState('CSE in IoT & Cyber Security including Block Chain Technology');

  const handleRoleTabChange = (role: 'ADMIN' | 'TEACHER' | 'STUDENT') => {
    setRoleTab(role);
    setError(null);
    setIdentifier('');
    setPassword('');
  };

  const handleSemesterChangeInReg = (sem: number) => {
    setRegSemester(sem);
    if (sem === 3) setRegBatch('2024-2028');
    else if (sem === 5) setRegBatch('2023-2027');
    else if (sem === 7) setRegBatch('2022-2026');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (roleTab === 'STUDENT') {
        const isEmail = identifier.includes('@');
        await login({
          usn: isEmail ? undefined : identifier.trim().toUpperCase(),
          email: isEmail ? identifier.trim() : undefined,
          password
        });
      } else {
        await login({ email: identifier.trim(), password });
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your USN, email, or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!regName.trim() || !regUsn.trim() || !regEmail.trim() || !regPassword) {
      setError('Please fill in all required fields (Name, USN, Email, Password).');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.registerStudent({
        name: regName.trim(),
        usn: regUsn.trim().toUpperCase(),
        email: regEmail.trim().toLowerCase(),
        semester: regSemester,
        batch: regBatch,
        department: regDepartment,
        phone: regPhone.trim() || undefined,
        password: regPassword
      });

      if (res.success && res.token) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });

        // Automatically log in with newly created token
        localStorage.setItem('labguard_token', res.token);
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message || 'Account registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectServer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setTestingServer(true);
    setError(null);
    setSuccessMsg(null);
    setServerStatus('UNTESTED');

    const clean = serverUrl.trim().replace(/\/+$/, '').replace(/\/api$/, '');
    if (!clean) {
      setApiBaseUrl('');
      setServerStatus('ONLINE');
      setSuccessMsg('Reverted to default /api endpoint.');
      setTestingServer(false);
      return;
    }

    try {
      const resp = await fetch(`${clean}/api/health`, { method: 'GET' });
      const data = await resp.json();
      if (resp.ok && (data.status === 'HEALTHY' || data.system)) {
        setApiBaseUrl(clean);
        setServerStatus('ONLINE');
        setSuccessMsg(`Connected successfully to backend server!`);
      } else {
        setApiBaseUrl(clean);
        setServerStatus('ONLINE');
        setSuccessMsg(`Backend URL set to ${clean}`);
      }
    } catch (err: any) {
      setServerStatus('ERROR');
      setError(`Cannot reach backend at ${clean}. Please verify the Render service is running and copy the URL.`);
    } finally {
      setTestingServer(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Institutional Top Navigation Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-subtle">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-700 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-extrabold text-sm">
            GND
          </div>
          <div>
            <span className="text-base font-extrabold text-slate-900">Guru Nanak Dev Engineering College Bidar</span>
            <span className="text-xs text-blue-700 font-semibold hidden md:inline ml-2">
              • Dept. of CSE in IoT & Cyber Security including Block Chain Technology
            </span>
          </div>
        </div>
        <div className="text-xs font-bold text-slate-600 hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Academic Year 2026-27</span>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Left Institutional Information Panel */}
          <div className="md:col-span-5 bg-gradient-to-br from-blue-800 via-indigo-900 to-slate-950 p-8 text-white flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-blue-500/30 backdrop-blur-sm border border-blue-400/40 text-blue-200 text-xs font-semibold px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Official GNDEC CSE-ICB Portal</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight leading-snug">
                Attendance & Student Feedback System
              </h1>
              <p className="text-xs text-blue-200 leading-relaxed">
                Dedicated academic platform for 3rd, 5th, and 7th Semester. Each student creates their genuine account to access timetables, mark laboratory attendance, and submit confidential teacher feedback.
              </p>
            </div>

            <div className="space-y-3 pt-6 border-t border-blue-500/30 text-xs">
              <div className="flex items-center gap-2.5 text-blue-100">
                <CheckCircle2 className="w-4 h-4 text-cyan-300 shrink-0" />
                <span>1st Step: Each student registers their own account</span>
              </div>
              <div className="flex items-center gap-2.5 text-blue-100">
                <CheckCircle2 className="w-4 h-4 text-cyan-300 shrink-0" />
                <span>Sign in using your USN or Institutional Email</span>
              </div>
              <div className="flex items-center gap-2.5 text-blue-100">
                <CheckCircle2 className="w-4 h-4 text-cyan-300 shrink-0" />
                <span>3rd, 5th & 7th Semester Schedules & Laboratories</span>
              </div>
              <div className="flex items-center gap-2.5 text-blue-100">
                <CheckCircle2 className="w-4 h-4 text-cyan-300 shrink-0" />
                <span>100% Genuine Data — No pre-fed dummy records</span>
              </div>
            </div>

            <div className="text-[11px] text-blue-300 pt-4">
              Guru Nanak Dev Engineering College, Mailoor Road, Bidar, Karnataka
            </div>
          </div>

          {/* Right Form Panel: Sign In or Register */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div>
              {/* Backend API Server Connectivity Bar */}
              <div className="mb-4 bg-slate-50 border border-slate-200 rounded-2xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Server className="w-3.5 h-3.5 text-blue-600" />
                    <span>Backend API:</span>
                    <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 truncate max-w-[170px] sm:max-w-[240px]">
                      {serverUrl ? serverUrl : 'Local / Relative (/api)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowServerConfig(!showServerConfig)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs"
                  >
                    <Settings className="w-3 h-3" />
                    <span>{showServerConfig ? 'Close' : 'Set Backend URL'}</span>
                  </button>
                </div>

                {showServerConfig && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-200 space-y-2 animate-fadeIn">
                    <p className="text-[11px] text-slate-600 leading-tight">
                      Paste your live Render Backend URL (e.g. <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-800">https://gndec-cse-feedback.onrender.com</code>) to connect the Vercel frontend:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://your-app.onrender.com"
                        value={serverUrl}
                        onChange={(e) => setServerUrl(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleConnectServer}
                        disabled={testingServer}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                      >
                        {testingServer ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Link2 className="w-3.5 h-3.5" />
                        )}
                        <span>Save & Connect</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Primary Toggle: Sign In vs Create Student Account */}
              <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('LOGIN');
                    setError(null);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
                    authMode === 'LOGIN'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('REGISTER');
                    setError(null);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
                    authMode === 'REGISTER'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Student Account</span>
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {authMode === 'LOGIN' ? (
                /* ================= SIGN IN FORM ================= */
                <div className="space-y-4">
                  <div className="mb-2">
                    <h2 className="text-xl font-extrabold text-slate-900">Sign In to Your Account</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Choose your role to access your portal</p>
                  </div>

                  {/* 3 Strict Roles */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 mb-4">
                    <button
                      type="button"
                      onClick={() => handleRoleTabChange('STUDENT')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        roleTab === 'STUDENT'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Student</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRoleTabChange('TEACHER')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        roleTab === 'TEACHER'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Teacher</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRoleTabChange('ADMIN')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        roleTab === 'ADMIN'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Laptop className="w-3.5 h-3.5" />
                      <span>Admin</span>
                    </button>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {roleTab === 'STUDENT'
                          ? 'Student USN (e.g. 3GN24CB001) or Email'
                          : roleTab === 'TEACHER'
                          ? 'Teacher Institutional Email'
                          : 'Administrator Email'}
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder={
                            roleTab === 'STUDENT'
                              ? 'e.g. 3GN24CB001 or student@gndec.ac.in'
                              : roleTab === 'TEACHER'
                              ? 'e.g. aarti.pawar@gndec.ac.in'
                              : 'admin@gndec.ac.in'
                          }
                          className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-800"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <>
                          <span>
                            Sign In as {roleTab === 'ADMIN' ? 'Administrator' : roleTab === 'TEACHER' ? 'Teacher' : 'Student'}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Student Register Callout if on student tab */}
                  {roleTab === 'STUDENT' && (
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between gap-2 mt-2">
                      <span className="text-[11px] font-medium">New student? Create your account first.</span>
                      <button
                        type="button"
                        onClick={() => setAuthMode('REGISTER')}
                        className="text-blue-700 font-extrabold hover:underline text-[11px]"
                      >
                        Register Now →
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* ================= STUDENT SELF-REGISTRATION FORM ================= */
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                      <span>Student Account Registration</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Fill your authentic GNDEC details to create your personal account
                    </p>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
                    {/* Full Name */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Ramesh Patil"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                        />
                      </div>
                    </div>

                    {/* USN & Semester */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Student USN *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 3GN24CB015"
                          value={regUsn}
                          onChange={(e) => setRegUsn(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-mono uppercase font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Semester *</label>
                        <select
                          value={regSemester}
                          onChange={(e) => handleSemesterChangeInReg(parseInt(e.target.value, 10))}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white text-slate-800"
                        >
                          <option value={3}>3rd Semester (2024-2028)</option>
                          <option value={5}>5th Semester (2023-2027)</option>
                          <option value={7}>7th Semester (2022-2026)</option>
                        </select>
                      </div>
                    </div>

                    {/* Email & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="email"
                            required
                            placeholder="ramesh.patil@gndec.ac.in"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Phone Number (Optional)</label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            placeholder="+91-9448012345"
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Passwords */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Password *</label>
                        <input
                          type="password"
                          required
                          placeholder="Min 6 chars"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Confirm Password *</label>
                        <input
                          type="password"
                          required
                          placeholder="Repeat password"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 mt-4"
                    >
                      {loading ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Register & Open Student Dashboard</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Institutional Footer */}
      <footer className="text-center py-4 text-xs text-slate-500 border-t border-slate-200 bg-white">
        Guru Nanak Dev Engineering College Bidar • Department of CSE in IoT & Cyber Security including Block Chain Technology
      </footer>
    </div>
  );
};
