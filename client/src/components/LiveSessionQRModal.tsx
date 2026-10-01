import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { X, RefreshCw, Radio, Users, MessageSquare, AlertTriangle, ShieldCheck, CheckCircle } from 'lucide-react';

interface Props {
  sessionId: number;
  onClose: () => void;
}

export const LiveSessionQRModal: React.FC<Props> = ({ sessionId, onClose }) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<number>(60);
  const [regenerating, setRegenerating] = useState(false);

  const fetchLive = async () => {
    try {
      const res = await api.getLiveSession(sessionId);
      if (res.success) {
        setData(res);
        setCountdown(res.activeQR?.expiresInSeconds || 60);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 5000);
    return () => clearInterval(interval);
  }, [sessionId]);

  // Countdown timer (60s dynamic expiration)
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchLive(); // auto refresh when expired
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRegenerateQR = async () => {
    try {
      setRegenerating(true);
      await api.generateQR({ session_id: sessionId, duration_seconds: 60 });
      await fetchLive();
    } catch (err: any) {
      alert('Failed to regenerate QR: ' + err.message);
    } finally {
      setRegenerating(false);
    }
  };

  if (!sessionId) return null;

  const session = data?.session;
  const metrics = data?.liveMetrics;
  const qr = data?.activeQR;

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl flex flex-col border border-cyan-100">
        {/* Projector Header */}
        <div className="bg-gradient-to-r from-cyan-600 via-cyan-500 to-orange-500 text-white px-8 py-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <span className="flex h-3.5 w-3.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-white"></span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight">
                  {session?.lab_name || 'VAPT LAB'} ({session?.lab_code || 'CYB-701'})
                </h1>
                <span className="bg-orange-500 text-white text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-white/20">
                  LIVE SESSION
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                Experiment {session?.experiment_number}: {session?.experiment_title} • Semester {session?.semester || 7} • Room {session?.room_number}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right pr-4 border-r border-white/30 text-xs">
              <div className="text-white/80">Date & Session Code</div>
              <div className="font-mono text-white font-bold">{session?.session_code}</div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Projector Body */}
        {loading || !data ? (
          <div className="p-16 text-center text-slate-500">
            <div className="w-10 h-10 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <span>Loading live projector feed...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Live dynamic QR code with countdown */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center p-6 bg-cyan-50/40 rounded-2xl border-2 border-cyan-100 text-center">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Dynamic 1-Minute Feedback QR Code
              </div>

              {/* Large Dynamic QR Code Container */}
              <div className="relative p-4 bg-white rounded-2xl shadow-lg border-2 border-cyan-200">
                {qr?.qrDataUrl ? (
                  <img
                    src={qr.qrDataUrl}
                    alt="Dynamic Feedback QR Code"
                    className="w-64 h-64 mx-auto rounded-lg"
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center bg-slate-100 rounded-lg text-slate-400">
                    Generating QR...
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-gradient-to-r from-cyan-600 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                  SHA-256 HMAC Signed
                </div>
              </div>

              {/* Countdown Bar */}
              <div className="w-full max-w-xs mt-4">
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-slate-600">Dynamic Expiration (1 Min):</span>
                  <span className={`font-mono text-sm ${countdown <= 10 ? 'text-red-600 animate-pulse font-extrabold' : 'text-cyan-700'}`}>
                    {formatCountdown(countdown)}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      countdown <= 10 ? 'bg-red-500' : 'bg-gradient-to-r from-cyan-500 to-orange-500'
                    }`}
                    style={{ width: `${(countdown / 60) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Regenerate Button */}
              <button
                onClick={handleRegenerateQR}
                disabled={regenerating}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-cyan-500 to-orange-500 hover:from-cyan-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
                <span>Rotate Dynamic QR Token</span>
              </button>

              <p className="text-[11px] text-slate-400 mt-2">
                Expires in 60s. Strictly single-use, non-reusable & non-reshareable.
              </p>
            </div>

            {/* Right Column: Live Session Statistics & Diagnostics */}
            <div className="lg:col-span-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Attendance */}
                <div className="bg-cyan-50/70 border border-cyan-200 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-xs font-semibold text-cyan-800 mb-1">
                    <Users className="w-4 h-4 text-cyan-600" />
                    <span>Live Attendance</span>
                  </div>
                  <div className="text-3xl font-extrabold text-cyan-950">
                    {metrics.presentCount} <span className="text-base font-normal text-cyan-600">/ {metrics.totalStudentsCount}</span>
                  </div>
                  <div className="text-[11px] text-cyan-600 mt-1 font-medium">
                    {Math.round((metrics.presentCount / metrics.totalStudentsCount) * 100)}% Students Present
                  </div>
                </div>

                {/* Feedback */}
                <div className="bg-orange-50/70 border border-orange-200 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-xs font-semibold text-orange-800 mb-1">
                    <MessageSquare className="w-4 h-4 text-orange-600" />
                    <span>Feedback Submitted</span>
                  </div>
                  <div className="text-3xl font-extrabold text-orange-950">
                    {metrics.feedbackSubmittedCount} <span className="text-base font-normal text-orange-600">/ {metrics.presentCount}</span>
                  </div>
                  <div className="text-[11px] text-orange-600 mt-1 font-medium">
                    {metrics.pendingFeedbackCount} Pending Submissions
                  </div>
                </div>

                {/* Geofence Status */}
                <div className="bg-white border border-cyan-100 shadow-sm p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Lab Room Perimeter</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    25 meters
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Room {session?.room_number} Only
                  </div>
                </div>

                {/* Verification Issues */}
                <div className={`p-4 rounded-2xl border ${
                  metrics.totalVerificationIssues > 0
                    ? 'bg-amber-50/80 border-amber-300'
                    : 'bg-white border-cyan-100 shadow-sm'
                }`}>
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Verification Alerts</span>
                  </div>
                  <div className={`text-2xl font-bold ${metrics.totalVerificationIssues > 0 ? 'text-amber-900' : 'text-slate-900'}`}>
                    {metrics.totalVerificationIssues}
                  </div>
                  <div className="text-[11px] text-amber-700 font-medium mt-1">
                    {metrics.suspiciousCount} Suspicious • {metrics.invalidCount} Invalid
                  </div>
                </div>
              </div>

              {/* Security Advisory Card */}
              <div className="p-4 bg-gradient-to-r from-cyan-600 via-cyan-500 to-orange-500 text-white rounded-2xl shadow-md text-xs space-y-2">
                <div className="font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span>LabGuard Anti-Proxy Protocol</span>
                </div>
                <p className="text-white/90 text-[11px] leading-relaxed">
                  Only students physically checked in inside the laboratory 25m room geofence with valid attendance can submit feedback.
                  Each dynamic QR token expires in 1 minute and is permanently consumed on submit to prevent reuse or resharing.
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>Faculty: <strong>{session?.faculty_name}</strong></span>
                <span className="font-mono text-slate-500">Academic Year 2026-2027</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
