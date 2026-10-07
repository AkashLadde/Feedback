import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { LiveSessionQRModal } from '../components/LiveSessionQRModal';
import {
  Radio,
  Plus,
  Play,
  StopCircle,
  QrCode,
  Users,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  Clock,
  MapPin,
  CheckCircle,
  ExternalLink,
  Sparkles,
  Zap,
  Building2,
  Layers,
  GraduationCap
} from 'lucide-react';

export const LiveSessionPage: React.FC = () => {
  const { user, refreshTrigger } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [liveData, setLiveData] = useState<any | null>(null);
  const [projectorModalOpen, setProjectorModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // New session form state
  const [labs, setLabs] = useState<any[]>([]);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [newLabId, setNewLabId] = useState<number>(1);
  const [newExpId, setNewExpId] = useState<number>(1);
  const [newSemester, setNewSemester] = useState<number>(5);
  const [starting, setStarting] = useState(false);

  const fetchActiveSessions = async () => {
    try {
      setLoading(true);
      const res = await api.getActiveSessions();
      if (res.success && res.sessions) {
        setSessions(res.sessions);
        if (res.sessions.length > 0) {
          // If no session selected or current selection is not in list, select first
          if (!selectedSessionId || !res.sessions.some((s: any) => s.id === selectedSessionId)) {
            setSelectedSessionId(res.sessions[0].id);
          }
        } else {
          setSelectedSessionId(null);
          setLiveData(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveMetrics = async () => {
    if (!selectedSessionId) return;
    try {
      const res = await api.getLiveSession(selectedSessionId);
      if (res.success) {
        setLiveData(res);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchActiveSessions();
    api.getLabs().then(res => {
      if (res.success && res.labs) {
        setLabs(res.labs);
        if (res.labs.length > 0) {
          const defaultLab = res.labs.find((l: any) => l.code === 'BIC515C') || res.labs[0];
          setNewLabId(defaultLab.id);
          setNewSemester(defaultLab.semester || 5);
        }
      }
    });
  }, [refreshTrigger]);

  useEffect(() => {
    if (selectedSessionId) {
      fetchLiveMetrics();
      const interval = setInterval(fetchLiveMetrics, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    if (newLabId) {
      const selectedLab = labs.find((l: any) => l.id === newLabId);
      if (selectedLab) {
        setNewSemester(selectedLab.semester || 5);
      }
      api.getExperiments(newLabId).then(res => {
        if (res.success && res.experiments) {
          setExperiments(res.experiments);
          if (res.experiments.length > 0) {
            setNewExpId(res.experiments[0].id);
          }
        }
      });
    }
  }, [newLabId, labs]);

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setStarting(true);
      const selectedLab = labs.find((l: any) => l.id === newLabId);
      const res = await api.startSession({
        laboratory_id: newLabId,
        experiment_id: newExpId,
        semester: newSemester || selectedLab?.semester || 5,
        date: new Date().toISOString().split('T')[0]
      });
      if (res.success) {
        setCreateModalOpen(false);
        await fetchActiveSessions();
        if (res.sessionId) {
          setSelectedSessionId(res.sessionId);
        }
      }
    } catch (err: any) {
      alert('Failed to start session: ' + err.message);
    } finally {
      setStarting(false);
    }
  };

  const handleQuickLaunch = async (labCode: string, expNumber: number = 1) => {
    try {
      setStarting(true);
      const targetLab = labs.find((l: any) => l.code === labCode);
      if (!targetLab) {
        alert(`Laboratory ${labCode} not found in database.`);
        return;
      }
      const expRes = await api.getExperiments(targetLab.id);
      const expId = expRes.experiments && expRes.experiments.length > 0 ? expRes.experiments[0].id : 1;
      
      const res = await api.startSession({
        laboratory_id: targetLab.id,
        experiment_id: expId,
        semester: targetLab.semester || 5,
        date: new Date().toISOString().split('T')[0]
      });
      if (res.success) {
        await fetchActiveSessions();
        if (res.sessionId) {
          setSelectedSessionId(res.sessionId);
        }
      }
    } catch (err: any) {
      alert('Quick launch error: ' + err.message);
    } finally {
      setStarting(false);
    }
  };

  const handleEndSession = async (id: number) => {
    if (!confirm('Conclude and end this laboratory session? Dynamic QR will be invalidated.')) return;
    try {
      await api.endSession(id);
      await fetchActiveSessions();
      setLiveData(null);
    } catch (err: any) {
      alert('Failed to end session: ' + err.message);
    }
  };

  const isStaff = user?.role === 'ADMIN' || user?.role === 'FACULTY' || user?.role === 'HOD';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-pink-100 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-pink-600 animate-ping"></span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Live Laboratory Sessions & Dynamic QR Control</span>
              <span className="bg-pink-100 text-pink-800 text-xs px-2.5 py-0.5 rounded-full border border-pink-200 font-bold">
                {sessions.length} Live Now
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time classroom session management, geofenced presence verification, and dynamic feedback token projection
          </p>
        </div>

        {isStaff && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-pink-800 via-pink-700 to-rose-600 hover:from-pink-900 hover:to-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-pink-800/20 transition-all hover:scale-102"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Lab Session</span>
            </button>
          </div>
        )}
      </div>

      {/* Quick Launch Bar for Admin */}
      {isStaff && (
        <div className="bg-gradient-to-r from-pink-950 via-pink-900 to-rose-950 text-white p-4 rounded-2xl shadow-md border border-pink-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-800/60 rounded-xl border border-pink-700 text-pink-300">
              <Zap className="w-5 h-5 text-pink-300 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-pink-100">1-Click Live Lab Session Launchers</div>
              <div className="text-[11px] text-pink-300">Instantly activate live sessions for today's scheduled practicals</div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleQuickLaunch('BIC515C')}
              disabled={starting}
              className="px-3.5 py-2 bg-pink-800/80 hover:bg-pink-700 text-pink-100 hover:text-white rounded-xl text-xs font-bold border border-pink-600 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-300" />
              <span>5th Sem: FSD Lab (BIC515C)</span>
            </button>

            <button
              onClick={() => handleQuickLaunch('1BCS302(P)')}
              disabled={starting}
              className="px-3.5 py-2 bg-pink-800/80 hover:bg-pink-700 text-pink-100 hover:text-white rounded-xl text-xs font-bold border border-pink-600 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-300" />
              <span>3rd Sem: Java Lab (1BCS302(P))</span>
            </button>

            <button
              onClick={() => handleQuickLaunch('22CSL71')}
              disabled={starting}
              className="px-3.5 py-2 bg-pink-800/80 hover:bg-pink-700 text-pink-100 hover:text-white rounded-xl text-xs font-bold border border-pink-600 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-300" />
              <span>7th Sem: VAPT Lab (22CSL71)</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Session Cards Selector */}
      {sessions.length > 0 ? (
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-2 px-1">
            <Radio className="w-4 h-4 text-pink-700" />
            <span>Select Active Laboratory to View Real-time Metrics & Project QR:</span>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {sessions.map((s) => {
              const isSelected = selectedSessionId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSessionId(s.id)}
                  className={`p-4 rounded-2xl border text-left min-w-[300px] shrink-0 transition-all ${
                    isSelected
                      ? 'bg-pink-50/90 border-pink-500 ring-2 ring-pink-400 shadow-md scale-101'
                      : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-extrabold text-slate-900">{s.lab_name}</span>
                    <span className="text-[10px] font-bold bg-pink-100 text-pink-800 px-2 py-0.5 rounded-full border border-pink-200 animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-600"></span>
                      ACTIVE
                    </span>
                  </div>
                  <div className="text-xs text-pink-800 font-semibold truncate">
                    Exp {s.experiment_number}: {s.experiment_title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                    <span className="font-semibold text-slate-700">
                      Sem {s.semester || 5} • Room {s.room_number || '307'}
                    </span>
                    <span className="font-mono text-pink-700 font-bold bg-pink-100/60 px-1.5 py-0.5 rounded">
                      {s.lab_code}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white p-10 rounded-2xl border border-pink-100 shadow-sm text-center text-slate-500 space-y-4">
          <div className="w-16 h-16 rounded-full bg-pink-50 border border-pink-200 flex items-center justify-center mx-auto text-pink-600">
            <Radio className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="text-base font-extrabold text-slate-900">No Currently Active Lab Sessions</div>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Click any of the 1-Click buttons above or "Start New Lab Session" to launch live geofenced feedback collection for a laboratory.
            </p>
          </div>
          {isStaff && (
            <div className="pt-2">
              <button
                onClick={() => handleQuickLaunch('BIC515C')}
                className="px-5 py-2.5 bg-gradient-to-r from-pink-800 to-pink-600 hover:from-pink-900 hover:to-pink-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-pink-800/20"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Launch 5th Sem FSD Lab (BIC515C) Now</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Live Session Active Workspace */}
      {liveData && liveData.session && (
        <div className="space-y-6">
          {/* Main Control Panel */}
          <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {liveData.session.lab_name} ({liveData.session.lab_code})
                  </h2>
                  <span className="bg-pink-100 text-pink-800 font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-pink-200">
                    Semester {liveData.session.semester || 5}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Room {liveData.session.room_number}
                  </span>
                  {liveData.session.location && (
                    <span className="bg-slate-100 text-slate-700 font-semibold text-[10px] px-2.5 py-0.5 rounded-full border border-slate-200">
                      🏢 {liveData.session.location}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  <strong>Experiment {liveData.session.experiment_number}:</strong> {liveData.session.experiment_title} • Instructor: <strong className="text-slate-800">{liveData.session.faculty_name}</strong>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setProjectorModalOpen(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-pink-800 via-pink-700 to-rose-600 hover:from-pink-900 hover:to-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-pink-800/20 transition-all hover:scale-102"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Launch Big Screen Projector</span>
                </button>

                {isStaff && (
                  <>
                    <button
                      onClick={async () => {
                        try {
                          await api.unlockAttendanceWindow(liveData.session.id);
                          alert('Attendance & Compulsory Feedback portal has been forcefully unlocked for this session.');
                        } catch (e: any) {
                          alert(e.message || 'Failed to unlock window.');
                        }
                      }}
                      className="px-3.5 py-2.5 bg-pink-50 hover:bg-pink-100 text-pink-900 border border-pink-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                      title="Force open attendance and feedback window for students right now"
                    >
                      <Clock className="w-4 h-4 text-pink-700" />
                      <span>Unlock 10-Min Portal</span>
                    </button>

                    <button
                      onClick={() => handleEndSession(liveData.session.id)}
                      className="px-3.5 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <StopCircle className="w-4 h-4 text-rose-600" />
                      <span>End Session</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Live Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-pink-50/70 border border-pink-200 rounded-2xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-pink-900 mb-1">
                  <Users className="w-4 h-4 text-pink-700" />
                  <span>Students Present</span>
                </div>
                <div className="text-2xl font-extrabold text-pink-950">
                  {liveData.liveMetrics.presentCount} <span className="text-xs font-normal text-pink-700">/ {liveData.liveMetrics.totalStudentsCount}</span>
                </div>
                <div className="text-[11px] text-pink-700 mt-1 font-medium">Geofence Inside Verified (25m)</div>
              </div>

              <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-900 mb-1">
                  <MessageSquare className="w-4 h-4 text-rose-700" />
                  <span>Feedback Logged</span>
                </div>
                <div className="text-2xl font-extrabold text-rose-950">
                  {liveData.liveMetrics.feedbackSubmittedCount} <span className="text-xs font-normal text-rose-700">/ {liveData.liveMetrics.presentCount}</span>
                </div>
                <div className="text-[11px] text-rose-700 mt-1 font-medium">{liveData.liveMetrics.pendingFeedbackCount} Pending Submissions</div>
              </div>

              <div className="p-4 bg-white border border-pink-100 shadow-sm rounded-2xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Geofence Boundary</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900">
                  25m Radius
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Room {liveData.session.room_number} Locked</div>
              </div>

              <div className={`p-4 rounded-2xl border ${
                liveData.liveMetrics.totalVerificationIssues > 0
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-white border-pink-100 shadow-sm'
              }`}>
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Verification Flags</span>
                </div>
                <div className="text-2xl font-extrabold text-amber-950">
                  {liveData.liveMetrics.totalVerificationIssues}
                </div>
                <div className="text-[11px] text-amber-700 mt-1">
                  {liveData.liveMetrics.suspiciousCount} Suspicious • {liveData.liveMetrics.invalidCount} Invalid
                </div>
              </div>
            </div>

            {/* Dynamic QR Preview & Status */}
            <div className="p-5 bg-gradient-to-r from-pink-50/70 via-rose-50/50 to-pink-50/70 rounded-2xl border border-pink-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {liveData.activeQR?.qrDataUrl ? (
                  <img src={liveData.activeQR.qrDataUrl} alt="Live QR" className="w-20 h-20 rounded-xl border-2 border-pink-300 shadow-sm bg-white p-1" />
                ) : (
                  <div className="w-20 h-20 bg-pink-100 rounded-xl flex items-center justify-center text-pink-700 font-bold">QR</div>
                )}
                <div>
                  <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <span>Dynamic HMAC-Signed Feedback QR Code</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">Active</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Token Expiration: <span className="font-mono font-bold text-pink-800">{liveData.activeQR?.expiresInSeconds}s</span> (Auto-refreshing every 60s)
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1 truncate max-w-md">
                    Session Code: {liveData.session.session_code}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setProjectorModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-pink-800 to-pink-600 hover:from-pink-900 hover:to-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Project Fullscreen QR</span>
                </button>
              </div>
            </div>

            {/* Tables: Recent Attendance vs Recent Feedback */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {/* Attendance Table */}
              <div className="border border-pink-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-pink-50/70 px-4 py-3 border-b border-pink-100 flex items-center justify-between text-xs font-bold text-pink-950">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-pink-700" />
                    <span>Present in Laboratory ({liveData.recentAttendance?.length || 0})</span>
                  </span>
                  <span className="text-[10px] bg-pink-100 text-pink-800 px-2 py-0.5 rounded-full font-mono font-bold">25m Geofenced</span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {liveData.recentAttendance?.length > 0 ? (
                    liveData.recentAttendance.map((att: any) => (
                      <div key={att.id} className="p-3 flex items-center justify-between hover:bg-pink-50/30">
                        <div>
                          <div className="font-bold text-slate-900">{att.student_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{att.usn}</div>
                        </div>
                        <div className="text-right text-[11px]">
                          <div className="text-emerald-700 font-semibold">{att.distance_to_lab}m from center</div>
                          <div className="text-slate-400">{new Date(att.timestamp).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      No student check-ins logged yet for this live session.
                    </div>
                  )}
                </div>
              </div>

              {/* Feedback Submissions Table */}
              <div className="border border-rose-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-rose-50/70 px-4 py-3 border-b border-rose-100 flex items-center justify-between text-xs font-bold text-rose-950">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-rose-700" />
                    <span>Feedback Received ({liveData.recentFeedback?.length || 0})</span>
                  </span>
                  <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-mono font-bold">Verified</span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {liveData.recentFeedback?.length > 0 ? (
                    liveData.recentFeedback.map((fb: any) => (
                      <div key={fb.id} className="p-3 flex items-center justify-between hover:bg-rose-50/30">
                        <div>
                          <div className="font-bold text-slate-900">{fb.student_name}</div>
                          <div className="text-[11px] text-slate-500">
                            {fb.teaching_basics} • Understanding: {fb.understanding}
                          </div>
                        </div>
                        <div className="text-right text-[11px]">
                          <span className={`inline-block px-2 py-0.5 rounded font-bold ${
                            fb.verification_status === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : fb.verification_status === 'SUSPICIOUS'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {fb.verification_status}
                          </span>
                          <div className="text-slate-400 mt-0.5">{new Date(fb.submitted_at).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      No feedback submitted yet. Feedback unlocks in the final 10-minute lab window.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projector Modal */}
      {projectorModalOpen && selectedSessionId && (
        <LiveSessionQRModal
          sessionId={selectedSessionId}
          onClose={() => setProjectorModalOpen(false)}
        />
      )}

      {/* Start Session Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-pink-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-pink-100 text-pink-800 rounded-xl">
                  <Play className="w-4 h-4 fill-pink-800" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">Start Laboratory Session</h3>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
            </div>

            <form onSubmit={handleStartSession} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Laboratory</label>
                <select
                  value={newLabId}
                  onChange={(e) => setNewLabId(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-pink-500 outline-none bg-white font-medium"
                >
                  {labs.map(l => (
                    <option key={l.id} value={l.id}>
                      Sem {l.semester || 5} • {l.name} ({l.code}) - Room {l.room_number}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Semester</label>
                  <select
                    value={newSemester}
                    onChange={(e) => setNewSemester(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-pink-500 outline-none bg-white font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Geofence Radius</label>
                  <input
                    type="text"
                    disabled
                    value="25 meters (Room Locked)"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Experiment (1–12)</label>
                <select
                  value={newExpId}
                  onChange={(e) => setNewExpId(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-pink-500 outline-none bg-white font-medium"
                >
                  {experiments.map(e => (
                    <option key={e.id} value={e.id}>Exp {e.experiment_number}: {e.title}</option>
                  ))}
                </select>
              </div>

              <div className="p-3.5 bg-pink-50 rounded-xl border border-pink-200 text-pink-900 text-[11px] leading-relaxed">
                Starting this session will activate student dashboard presence check-ins and start the dynamic HMAC QR code token rotation.
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={starting}
                  className="px-5 py-2.5 bg-gradient-to-r from-pink-800 via-pink-700 to-rose-600 hover:from-pink-900 hover:to-rose-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-pink-800/20"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{starting ? 'Activating...' : 'Activate Lab Session'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

