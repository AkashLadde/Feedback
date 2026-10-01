import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, getApiBaseUrl, setApiBaseUrl } from '../services/api';
import confetti from 'canvas-confetti';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  GraduationCap,
  ShieldAlert,
  CheckCircle2,
  UserPlus,
  LogIn,
  Phone,
  User as UserIcon,
  Sparkles,
  Link2,
  Server,
  Settings,
  RefreshCw,
  MapPin,
  Clock
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

  // Login States
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Student Registration States (1st, 3rd, 5th, 7th Semesters)
  const [regName, setRegName] = useState('');
  const [regUsn, setRegUsn] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regSemester, setRegSemester] = useState<number>(1);
  const [regBatch, setRegBatch] = useState('2026-2030 (Batch 2026)');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regDepartment] = useState('CSE in IoT & Cyber Security including Block Chain Technology');

  const handleSemesterChangeInReg = (sem: number) => {
    setRegSemester(sem);
    if (sem === 1) setRegBatch('2026-2030 (Batch 2026)');
    else if (sem === 3) setRegBatch('2025-2029 (Batch 2025)');
    else if (sem === 5) setRegBatch('2024-2028 (Batch 2024)');
    else if (sem === 7) setRegBatch('2023-2027 (Batch 2023)');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const cleanId = identifier.trim();
      const isEmail = cleanId.includes('@');
      if (isEmail) {
        await login({ email: cleanId.toLowerCase(), password });
      } else {
        await login({ usn: cleanId.toUpperCase(), password });
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your USN or institutional email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!regName.trim() || !regUsn.trim() || !regEmail.trim() || !regPassword) {
      setError('Please fill in all mandatory fields (Full Name, USN, Email, Password).');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please verify your password entry.');
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
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 }
        });

        localStorage.setItem('labguard_token', res.token);
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message || 'Account registration failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectServer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setTestingServer(true);
    setError(null);
    setSuccessMsg(null);

    const clean = serverUrl.trim().replace(/\/+$/, '').replace(/\/api$/, '');
    if (!clean) {
      setApiBaseUrl('');
      setSuccessMsg('Reverted to default /api endpoint.');
      setTestingServer(false);
      return;
    }

    try {
      const resp = await fetch(`${clean}/api/health`, { method: 'GET' });
      const data = await resp.json();
      if (resp.ok && (data.status === 'HEALTHY' || data.system)) {
        setApiBaseUrl(clean);
        setSuccessMsg('Connected successfully to backend server!');
      } else {
        setApiBaseUrl(clean);
        setSuccessMsg(`Backend URL set to ${clean}`);
      }
    } catch (err: any) {
      setError(`Cannot reach backend at ${clean}. Please verify the service is running.`);
    } finally {
      setTestingServer(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50/40 via-white to-orange-50/40 flex flex-col justify-between">
      {/* Institutional Top Navigation Header */}
      <div className="bg-white border-b border-cyan-100 px-6 py-3.5 flex items-center justify-between shadow-subtle">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-cyan-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 font-black text-sm tracking-wider">
            GND
          </div>
          <div>
            <span className="text-base font-extrabold text-slate-900">Guru Nanak Dev Engineering College Bidar</span>
            <span className="text-xs text-cyan-800 font-semibold hidden md:inline ml-2">
              • Dept. of CSE in IoT & Cyber Security including Block Chain Technology
            </span>
          </div>
        </div>
        <div className="text-xs font-bold text-slate-700 hidden sm:flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-200">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
          <span className="text-orange-900">Academic Year 2026-27</span>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 bg-white rounded-3xl shadow-xl border border-cyan-100 overflow-hidden">
          {/* Left Institutional Information Panel - Cyan & Orange Theme */}
          <div className="md:col-span-5 bg-gradient-to-br from-cyan-500 via-cyan-600 to-orange-500 p-8 text-white flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xs border border-white/30 text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                <span className="w-2 h-2 rounded-full bg-orange-300 animate-pulse"></span>
                <span>Official GNDEC CSE-ICB Portal</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight leading-snug text-white">
                Laboratory Attendance & Feedback Portal
              </h1>
              <p className="text-xs text-cyan-50 leading-relaxed font-medium">
                Official institutional portal for students and administration. Students access their semester timetable, mark verified geofenced laboratory attendance, and submit compulsory feedback during the designated practical session window.
              </p>
            </div>

            <div className="space-y-3 pt-6 border-t border-white/20 text-xs font-semibold">
              <div className="flex items-center gap-2.5 text-white">
                <CheckCircle2 className="w-4 h-4 text-orange-200 shrink-0" />
                <span>Strict Semester Timetable & Lab Isolation</span>
              </div>
              <div className="flex items-center gap-2.5 text-white">
                <CheckCircle2 className="w-4 h-4 text-orange-200 shrink-0" />
                <span>25m Satellite Geofencing Required in Lab</span>
              </div>
              <div className="flex items-center gap-2.5 text-white">
                <CheckCircle2 className="w-4 h-4 text-orange-200 shrink-0" />
                <span>Attendance & Compulsory Feedback Submission</span>
              </div>
              <div className="flex items-center gap-2.5 text-white">
                <CheckCircle2 className="w-4 h-4 text-orange-200 shrink-0" />
                <span>Administrative Verification & Security Audits</span>
              </div>
            </div>

            <div className="text-[11px] text-cyan-100 font-medium pt-4">
              Guru Nanak Dev Engineering College, Mailoor Road, Bidar, Karnataka
            </div>
          </div>

          {/* Right Form Panel: Sign In or Register */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div>
              {/* Backend Server Configuration Toggle (Optional) */}
              <div className="mb-4 bg-cyan-50/40 border border-cyan-100 rounded-2xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Server className="w-3.5 h-3.5 text-cyan-600" />
                    <span>API Endpoint:</span>
                    <span className="font-mono text-[10px] text-cyan-700 bg-white px-2 py-0.5 rounded-lg border border-cyan-200 truncate max-w-[170px] sm:max-w-[240px]">
                      {serverUrl ? serverUrl : 'Local / Relative (/api)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowServerConfig(!showServerConfig)}
                    className="text-xs font-bold text-cyan-600 hover:text-cyan-800 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs"
                  >
                    <Settings className="w-3 h-3" />
                    <span>{showServerConfig ? 'Close' : 'Config URL'}</span>
                  </button>
                </div>

                {showServerConfig && (
                  <div className="mt-2.5 pt-2.5 border-t border-cyan-100 space-y-2 animate-fadeIn">
                    <p className="text-[11px] text-slate-600 leading-tight">
                      Custom backend API URL:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://your-backend.onrender.com"
                        value={serverUrl}
                        onChange={(e) => setServerUrl(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-cyan-500 outline-none bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleConnectServer}
                        disabled={testingServer}
                        className="bg-gradient-to-r from-cyan-500 to-orange-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                      >
                        {testingServer ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                        <span>Connect</span>
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
                      ? 'bg-white text-cyan-800 shadow-sm'
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
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/20'
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
                    <p className="text-xs text-slate-500 mt-0.5">Enter your student USN or institutional email</p>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Student USN or Institutional Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="e.g. 3GN26CI005 (USN) or admin@gndec.ac.in"
                          className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white font-medium text-slate-800"
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
                          className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white font-medium text-slate-800"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-cyan-600 via-cyan-500 to-orange-500 hover:from-cyan-700 hover:to-orange-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 transition-all disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <>
                          <span>Sign In to Portal</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="p-3 bg-cyan-50/70 border border-cyan-200 rounded-xl text-xs text-cyan-900 flex items-center justify-between gap-2 mt-2">
                    <span className="text-[11px] font-medium">New student? Create your account first.</span>
                    <button
                      type="button"
                      onClick={() => setAuthMode('REGISTER')}
                      className="text-cyan-700 font-extrabold hover:underline text-[11px]"
                    >
                      Register Now →
                    </button>
                  </div>
                </div>
              ) : (
                /* ================= STUDENT SELF-REGISTRATION FORM ================= */
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-cyan-600" />
                      <span>Student Account Registration</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Register your authentic GNDEC student credentials (verified by Admin)
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
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-cyan-500 outline-none font-medium"
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
                          placeholder="e.g. 3GN26CI005"
                          value={regUsn}
                          onChange={(e) => setRegUsn(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-cyan-500 outline-none font-mono uppercase font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Semester *</label>
                        <select
                          value={regSemester}
                          onChange={(e) => handleSemesterChangeInReg(parseInt(e.target.value, 10))}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none"
                        >
                          <option value={1}>1st Semester (Batch 2026 - 2030)</option>
                          <option value={3}>3rd Semester (Batch 2025 - 2029)</option>
                          <option value={5}>5th Semester (Batch 2024 - 2028)</option>
                          <option value={7}>7th Semester (Batch 2023 - 2027)</option>
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
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-cyan-500 outline-none font-mono"
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
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-cyan-500 outline-none"
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
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-cyan-500 outline-none font-mono"
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
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-cyan-500 outline-none font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-cyan-600 hover:from-orange-600 hover:to-cyan-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all disabled:opacity-50 mt-4"
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
