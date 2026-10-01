import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
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
  MapPin,
  Clock,
  Quote,
  KeyRound,
  Cpu,
  Terminal,
  Radio,
  Info,
  ChevronRight,
  ChevronLeft,
  X,
  ShieldCheck
} from 'lucide-react';

const CYBER_QUOTES = [
  {
    quote: "Security is not a product, but a process.",
    author: "Bruce Schneier",
    topic: "Cryptographic Systems & Protocol Engineering"
  },
  {
    quote: "In blockchain and cryptography, trust is mathematically verified, not assumed.",
    author: "Satoshi Nakamoto",
    topic: "Decentralized Ledger & Consensus Architecture"
  },
  {
    quote: "The strength of a cybersecurity system is defined by its strictest perimeter verification.",
    author: "GNDEC CSE-ICB Axiom",
    topic: "Dept. of IoT & Cyber Security including Blockchain"
  },
  {
    quote: "Zero Trust Architecture: Never trust without verification, always validate physical presence.",
    author: "NIST Security Principles",
    topic: "25m Geofence & Dynamic Token Verification"
  },
  {
    quote: "Privacy is the inherent human right; cybersecurity is the defense of that right.",
    author: "Whitfield Diffie",
    topic: "Co-Inventor of Public-Key Cryptography"
  }
];

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login States
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Student Registration States (1st to 8th Semesters)
  const [regName, setRegName] = useState('');
  const [regUsn, setRegUsn] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regSemester, setRegSemester] = useState<number>(1);
  const [regBatch, setRegBatch] = useState('2026-2030 (Batch 2026)');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regDepartment] = useState('CSE in IoT & Cyber Security including Block Chain Technology');

  // Signup Instructions Modal State
  const [showSignupModal, setShowSignupModal] = useState(false);

  // Dynamic Quote Rotation State
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % CYBER_QUOTES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleSemesterChangeInReg = (sem: number) => {
    setRegSemester(sem);
    if (sem === 1 || sem === 2) setRegBatch('2026-2030 (Batch 2026)');
    else if (sem === 3 || sem === 4) setRegBatch('2025-2029 (Batch 2025)');
    else if (sem === 5 || sem === 6) setRegBatch('2024-2028 (Batch 2024)');
    else if (sem === 7 || sem === 8) setRegBatch('2023-2027 (Batch 2023)');
    else setRegBatch('2026-2030 (Batch 2026)');
  };

  const handleOpenRegister = () => {
    setAuthMode('REGISTER');
    setError(null);
    setShowSignupModal(true);
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

      if (res.success) {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 }
        });

        setSuccessMsg(res.message || 'Account registered successfully! Your account is pending verification by the Administrator. You can sign in once verified.');
        setIdentifier(regUsn.trim().toUpperCase() || regEmail.trim().toLowerCase());
        setPassword('');
        setRegPassword('');
        setRegConfirmPassword('');
        setAuthMode('LOGIN');
      }
    } catch (err: any) {
      setError(err.message || 'Account registration failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const activeQuote = CYBER_QUOTES[quoteIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50/40 via-white to-orange-50/40 flex flex-col justify-between">
      {/* Institutional Top Navigation Header */}
      <div className="bg-white border-b border-cyan-100 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-subtle">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-cyan-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 font-black text-sm tracking-wider">
            GND
          </div>
          <div>
            <span className="text-sm sm:text-base font-extrabold text-slate-900">Guru Nanak Dev Engineering College Bidar</span>
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
      <div className="flex-1 flex items-center justify-center p-3 sm:p-6 lg:p-8">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 bg-white rounded-3xl shadow-xl border border-cyan-100 overflow-hidden">
          
          {/* Left Panel: Dynamic Cybersecurity Theme & Rotating Quotes */}
          <div className="md:col-span-5 bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 p-6 sm:p-8 text-white flex flex-col justify-between relative overflow-hidden">
            {/* Animated Cyber Matrix Background Elements */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <div className="absolute -right-16 -top-16 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
            <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-orange-500/15 rounded-full blur-3xl pointer-events-none"></div>

            {/* Top Brand & Status */}
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold px-3 py-1 rounded-full shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  <span>GNDEC CSE-ICB Security Grid</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-orange-300/90 font-mono font-bold">
                  <Radio className="w-3 h-3 text-orange-400 animate-ping" />
                  <span>25m Geofence</span>
                </div>
              </div>

              {/* Cybersecurity Visual Animation Box */}
              <div className="p-4 rounded-2xl bg-white/5 border border-cyan-500/20 backdrop-blur-md relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-orange-500 flex items-center justify-center text-white shadow-md">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-black tracking-wider text-cyan-200 uppercase">LabGuard Engine</div>
                      <div className="text-[10px] text-slate-400 font-mono">SHA-256 Dynamic Token</div>
                    </div>
                  </div>
                  <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                  <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/50">
                    <div className="text-cyan-400 font-bold">GPS</div>
                    <div className="text-slate-400 text-[9px]">±8m High Acc</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/50">
                    <div className="text-orange-400 font-bold">1-Min</div>
                    <div className="text-slate-400 text-[9px]">QR Rotation</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/50">
                    <div className="text-emerald-400 font-bold">Anti-Proxy</div>
                    <div className="text-slate-400 text-[9px]">Zero Dupes</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle: Dynamic Rotating Quotes */}
            <div className="relative z-10 my-6 bg-slate-800/40 p-5 rounded-2xl border border-cyan-500/20 backdrop-blur-sm transition-all duration-500">
              <Quote className="w-6 h-6 text-cyan-400/50 mb-2" />
              <p className="text-xs sm:text-sm font-medium text-cyan-50 leading-relaxed italic min-h-[55px]">
                "{activeQuote.quote}"
              </p>
              <div className="mt-3 pt-2.5 border-t border-cyan-500/20 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-orange-300">{activeQuote.author}</div>
                  <div className="text-[10px] text-slate-400">{activeQuote.topic}</div>
                </div>
                {/* Manual Quote Controls */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setQuoteIndex((prev) => (prev - 1 + CYBER_QUOTES.length) % CYBER_QUOTES.length)}
                    className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    title="Previous Quote"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuoteIndex((prev) => (prev + 1) % CYBER_QUOTES.length)}
                    className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    title="Next Quote"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Quote Indicators */}
              <div className="flex justify-center gap-1 mt-3">
                {CYBER_QUOTES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setQuoteIndex(i)}
                    className={`h-1 rounded-full transition-all ${
                      i === quoteIndex ? 'w-5 bg-cyan-400' : 'w-1.5 bg-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Bottom Footer Details */}
            <div className="relative z-10 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>GNDEC Bidar • CSE-ICB</span>
              <span className="font-mono text-cyan-400 font-semibold">Sem 1 - 8</span>
            </div>
          </div>

          {/* Right Form Panel: Sign In or Register */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div>
              {/* Primary Toggle: Sign In vs Create Student Account */}
              <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('LOGIN');
                    setError(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
                    authMode === 'LOGIN'
                      ? 'bg-white text-cyan-800 shadow-sm ring-1 ring-cyan-100'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenRegister}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
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
                          placeholder="e.g. 3GN26IC001 (USN) or institutional email"
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
                      onClick={handleOpenRegister}
                      className="text-cyan-700 font-extrabold hover:underline text-[11px]"
                    >
                      Register Now →
                    </button>
                  </div>
                </div>
              ) : (
                /* ================= STUDENT SELF-REGISTRATION FORM ================= */
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-cyan-600" />
                        <span>Student Account Registration</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Register your authentic GNDEC student credentials (verified by Admin)
                      </p>
                    </div>

                    {/* Button to re-open instructions modal */}
                    <button
                      type="button"
                      onClick={() => setShowSignupModal(true)}
                      className="text-[11px] text-orange-600 hover:text-orange-800 font-bold flex items-center gap-1 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>Instructions</span>
                    </button>
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
                          placeholder="e.g. 3GN26IC001"
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
                          <option value={2}>2nd Semester (Batch 2026 - 2030)</option>
                          <option value={3}>3rd Semester (Batch 2025 - 2029)</option>
                          <option value={4}>4th Semester (Batch 2025 - 2029)</option>
                          <option value={5}>5th Semester (Batch 2024 - 2028)</option>
                          <option value={6}>6th Semester (Batch 2024 - 2028)</option>
                          <option value={7}>7th Semester (Batch 2023 - 2027)</option>
                          <option value={8}>8th Semester (Batch 2023 - 2027)</option>
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
                          <span>Submit Registration (Pending Admin Approval)</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-1">
                      Note: Your account must be approved & verified by the Administrator before you can sign in.
                    </p>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= STUDENT SIGNUP INSTRUCTIONS POPUP MODAL ================= */}
      {showSignupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-orange-200 space-y-4 animate-slideUp relative">
            <button
              onClick={() => setShowSignupModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-orange-100">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Student Registration & Lab Instructions</h3>
                <p className="text-xs text-orange-700 font-semibold">GNDEC Dept. of CSE (IoT & Cyber Security)</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-3 bg-cyan-50/60 rounded-xl border border-cyan-100 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                <div>
                  <strong className="text-slate-900 block font-bold">Genuine University USN & Full Name</strong>
                  Enter your official university USN (e.g. <span className="font-mono font-bold text-cyan-800">3GN26IC001</span>) and full name matching your GNDEC college ID card.
                </div>
              </div>

              <div className="p-3 bg-orange-50/60 rounded-xl border border-orange-100 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                <div>
                  <strong className="text-slate-900 block font-bold">Correct Semester Enrollment</strong>
                  Select your exact active Semester (1st to 8th Semester) so your practical curriculum and laboratory timetables are strictly mapped.
                </div>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                <div>
                  <strong className="text-slate-900 block font-bold">Administrative Verification Required</strong>
                  Your registered account will be placed in pending status until approved & verified by the Department Administrator / HOD.
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">4</span>
                <div>
                  <strong className="text-slate-900 block font-bold">Physical Lab Geofence & 10-Min Window</strong>
                  Attendance and compulsory feedback can only be submitted inside the physical laboratory room (25m radius) during the last 10 minutes of scheduled lab time.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSignupModal(false)}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-orange-500 to-cyan-600 hover:from-orange-600 hover:to-cyan-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>I Understand & Continue Registration</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Institutional Footer */}
      <footer className="text-center py-4 text-xs text-slate-500 border-t border-slate-200 bg-white">
        Guru Nanak Dev Engineering College Bidar • Department of CSE in IoT & Cyber Security including Block Chain Technology
      </footer>
    </div>
  );
};
