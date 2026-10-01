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
  ExternalLink
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
  const [starting, setStarting] = useState(false);

  const fetchActiveSessions = async () => {
    try {
      setLoading(true);
      const res = await api.getActiveSessions();
      if (res.success && res.sessions) {
        setSessions(res.sessions);
        if (res.sessions.length > 0 && !selectedSessionId) {
          setSelectedSessionId(res.sessions[0].id);
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
    // Load labs for the modal
    api.getLabs().then(res => {
      if (res.success) setLabs(res.labs);
    });
  }, [refreshTrigger]);

  useEffect(() => {
    if (selectedSessionId) {
      fetchLiveMetrics();
      const interval = setInterval(fetchLiveMetrics, 6000);
      return () => clearInterval(interval);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    if (newLabId) {
      api.getExperiments(newLabId).then(res => {
        if (res.success && res.experiments) {
          setExperiments(res.experiments);
          if (res.experiments.length > 0) {
            setNewExpId(res.experiments[0].id);
          }
        }
      });
    }
  }, [newLabId]);

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setStarting(true);
      const res = await api.startSession({
        laboratory_id: newLabId,
        experiment_id: newExpId,
        semester: 7,
        date: new Date().toISOString().split('T')[0]
      });
      if (res.success) {
        setCreateModalOpen(false);
        await fetchActiveSessions();
        setSelectedSessionId(res.sessionId);
      }
    } catch (err: any) {
      alert('Failed to start session: ' + err.message);
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
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Live Laboratory Sessions & Dynamic QR Control
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
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-orange-500 hover:from-cyan-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-cyan-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Lab Session</span>
            </button>
          </div>
        )}
      </div>

      {/* Active Session Cards Selector */}
      {sessions.length > 0 ? (
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSessionId(s.id)}
              className={`p-4 rounded-2xl border text-left min-w-[280px] shrink-0 transition-all ${
                selectedSessionId === s.id
                  ? 'bg-cyan-50/80 border-cyan-400 ring-2 ring-cyan-300 shadow-sm'
                  : 'bg-white hover:bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900">{s.lab_name}</span>
                <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full border border-orange-200 animate-pulse">
                  ACTIVE
                </span>
              </div>
              <div className="text-xs text-cyan-700 font-medium">Exp {s.experiment_number}: {s.experiment_title}</div>
              <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
                <span>Room {s.room_number} • Sem {s.semester || 7}</span>
                <span className="font-mono text-slate-500">{s.session_code.split('-').slice(-2).join('-')}</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl border border-cyan-100 shadow-sm text-center text-slate-500 space-y-3">
          <Radio className="w-10 h-10 mx-auto text-slate-300" />
          <div className="font-bold text-slate-800">No Currently Active Lab Sessions</div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click "Start New Lab Session" to activate dynamic QR feedback collection and geofence verification for a laboratory.
          </p>
        </div>
      )}

      {/* Live Session Active Workspace */}
      {liveData && liveData.session && (
        <div className="space-y-6">
          {/* Main Control Panel */}
          <div className="bg-white rounded-2xl border border-cyan-100 shadow-sm p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    {liveData.session.lab_name} ({liveData.session.lab_code})
                  </h2>
                  <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded">
                    Room {liveData.session.room_number}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  <strong>Experiment {liveData.session.experiment_number}:</strong> {liveData.session.experiment_title} • Semester {liveData.session.semester || 7} • Instructor: {liveData.session.faculty_name}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setProjectorModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 via-cyan-500 to-orange-500 hover:from-cyan-700 hover:to-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-cyan transition-all"
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
                      className="px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                      title="Force open attendance and feedback window for students right now"
                    >
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span>Unlock 10-Min Portal Now</span>
                    </button>

                    <button
                      onClick={() => handleEndSession(liveData.session.id)}
                      className="px-3 py-2 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <StopCircle className="w-4 h-4" />
                      <span>End Session</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Live Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-cyan-50/70 border border-cyan-200 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-800 mb-1">
                  <Users className="w-4 h-4 text-cyan-600" />
                  <span>Students Present</span>
                </div>
                <div className="text-2xl font-extrabold text-cyan-950">
                  {liveData.liveMetrics.presentCount} <span className="text-xs font-normal text-cyan-600">/ {liveData.liveMetrics.totalStudentsCount}</span>
                </div>
                <div className="text-[11px] text-cyan-700 mt-1">Geofence Inside Verified</div>
              </div>

              <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-orange-800 mb-1">
                  <MessageSquare className="w-4 h-4 text-orange-600" />
                  <span>Feedback Logged</span>
                </div>
                <div className="text-2xl font-extrabold text-orange-950">
                  {liveData.liveMetrics.feedbackSubmittedCount} <span className="text-xs font-normal text-orange-600">/ {liveData.liveMetrics.presentCount}</span>
                </div>
                <div className="text-[11px] text-orange-700 mt-1">{liveData.liveMetrics.pendingFeedbackCount} Pending</div>
              </div>

              <div className="p-4 bg-white border border-cyan-100 shadow-sm rounded-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Geofence Boundary</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900">
                  25m Radius
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Enforced Around Lab Coordinates</div>
              </div>

              <div className={`p-4 rounded-xl border ${
                liveData.liveMetrics.totalVerificationIssues > 0
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-white border-cyan-100 shadow-sm'
              }`}>
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Verification Mismatches</span>
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
            <div className="p-4 bg-cyan-50/40 rounded-xl border border-cyan-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {liveData.activeQR?.qrDataUrl ? (
                  <img src={liveData.activeQR.qrDataUrl} alt="Live QR" className="w-20 h-20 rounded-lg border border-cyan-200 shadow-sm" />
                ) : (
                  <div className="w-20 h-20 bg-slate-200 rounded-lg flex items-center justify-center">QR</div>
                )}
                <div>
                  <div className="text-xs font-bold text-slate-800">Dynamic HMAC QR Code Active</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Expires in: <span className="font-mono font-bold text-cyan-700">{liveData.activeQR?.expiresInSeconds}s</span> (Auto-regenerating)
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1 truncate max-w-md">
                    Session Code: {liveData.session.session_code}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setProjectorModalOpen(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-orange-500 hover:from-cyan-600 hover:to-orange-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  Project QR on Screen
                </button>
              </div>
            </div>

            {/* Tables: Recent Attendance vs Recent Feedback */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {/* Attendance Table */}
              <div className="border border-cyan-100 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-cyan-50/50 px-4 py-3 border-b border-cyan-100 flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-cyan-600" />
                    <span>Present in Laboratory ({liveData.recentAttendance?.length || 0})</span>
                  </span>
                  <span className="text-[10px] bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded font-mono">Geofenced</span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {liveData.recentAttendance?.map((att: any) => (
                    <div key={att.id} className="p-3 flex items-center justify-between hover:bg-cyan-50/30">
                      <div>
                        <div className="font-bold text-slate-900">{att.student_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{att.usn}</div>
                      </div>
                      <div className="text-right text-[11px]">
                        <div className="text-emerald-700 font-semibold">{att.distance_to_lab}m from center</div>
                        <div className="text-slate-400">{new Date(att.timestamp).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback Submissions Table */}
              <div className="border border-orange-100 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-orange-50/50 px-4 py-3 border-b border-orange-100 flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-orange-600" />
                    <span>Feedback Received ({liveData.recentFeedback?.length || 0})</span>
                  </span>
                  <span className="text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded font-mono">Verified</span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {liveData.recentFeedback?.map((fb: any) => (
                    <div key={fb.id} className="p-3 flex items-center justify-between hover:bg-orange-50/30">
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
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {fb.verification_status}
                        </span>
                        <div className="text-slate-400 mt-0.5">{new Date(fb.submitted_at).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  ))}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-cyan-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Start Laboratory Session</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleStartSession} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Laboratory</label>
                <select
                  value={newLabId}
                  onChange={(e) => setNewLabId(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-cyan-500 outline-none bg-white"
                >
                  {labs.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.code}) - Room {l.room_number}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Experiment (1–12)</label>
                <select
                  value={newExpId}
                  onChange={(e) => setNewExpId(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-cyan-500 outline-none bg-white"
                >
                  {experiments.map(e => (
                    <option key={e.id} value={e.id}>Exp {e.experiment_number}: {e.title}</option>
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

              <div className="p-3 bg-cyan-50/70 rounded-xl border border-cyan-200 text-cyan-800 text-[11px] leading-relaxed">
                Starting this session will initialize attendance check-ins and generate the dynamic HMAC QR code token.
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={starting}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-orange-500 hover:from-cyan-600 hover:to-orange-600 text-white rounded-xl font-bold flex items-center gap-1.5 shadow"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Activate Session</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
