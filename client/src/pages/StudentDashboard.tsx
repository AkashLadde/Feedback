import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import {
  GraduationCap,
  MapPin,
  QrCode,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Radio,
  FileText,
  Calendar,
  Layers,
  FlaskConical,
  Sparkles,
  Info,
  Phone,
  Check,
  Timer,
  Compass,
  Building2,
  CalendarDays,
  UserCheck,
  Crosshair,
  RefreshCw,
  Save,
  X,
  Sliders,
  Play
} from 'lucide-react';

// Helper functions to parse timetable slot ranges (e.g. '09.00 AM - 12.00 PM' or '02.00 PM - 05.00 PM')
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const clean = timeStr.trim().toUpperCase().replace(/\./g, ':');
  const match = clean.match(/(\d+):(\d+)\s*(AM|PM)/);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3];
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function parseTimeRange(rangeStr: string): { startMin: number; endMin: number } {
  if (!rangeStr) return { startMin: 0, endMin: 1440 };
  const parts = rangeStr.split('-');
  if (parts.length < 2) return { startMin: 0, endMin: 1440 };
  return {
    startMin: parseTimeToMinutes(parts[0]),
    endMin: parseTimeToMinutes(parts[1])
  };
}

export const StudentDashboard: React.FC = () => {
  const { user, setActiveTab, refreshTrigger, triggerRefresh } = useAuth();
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [feedbackHistory, setFeedbackHistory] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [allActiveSessions, setAllActiveSessions] = useState<any[]>([]);
  const [scheduleStatus, setScheduleStatus] = useState<any | null>(null);
  const [labs, setLabs] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);

  // GPS Calibration State (Add Current Lab Location to DB)
  const [calibrateModalOpen, setCalibrateModalOpen] = useState<boolean>(false);
  const [selectedLabForCalib, setSelectedLabForCalib] = useState<any | null>(null);
  const [calibLat, setCalibLat] = useState<number>(17.9104);
  const [calibLng, setCalibLng] = useState<number>(77.5199);
  const [calibRadius, setCalibRadius] = useState<number>(25);
  const [calibRoom, setCalibRoom] = useState<string>('');
  const [calibLocation, setCalibLocation] = useState<string>('');
  const [calibSaving, setCalibSaving] = useState<boolean>(false);
  const [calibSuccessMsg, setCalibSuccessMsg] = useState<string | null>(null);
  const [isAcquiringGps, setIsAcquiringGps] = useState<boolean>(false);
  
  // Real-time Day and Clock
  const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const dayNamesFull = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const todayDayName = dayNamesFull[new Date().getDay()];
  
  const [selectedDay, setSelectedDay] = useState<string>('WEDNESDAY');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  const studentSem = Number(user?.semester || user?.profile?.semester || 5);
  const studentUsn = user?.usn || user?.profile?.usn || '3GN24IC006';
  const studentPhone = user?.phone || user?.profile?.phone || '';
  const isPhoneVerified = Boolean(user?.phone_verified || user?.profile?.phone_verified);

  const getBatchLabel = (sem: number) => {
    if (sem === 1 || sem === 2) return '2026-2030 (Batch 2026)';
    if (sem === 3 || sem === 4) return '2025-2029 (Batch 2025)';
    if (sem === 5 || sem === 6) return '2024-2028 (Batch 2024)';
    if (sem === 7 || sem === 8) return '2023-2027 (Batch 2023)';
    return '2024-2028 (Batch 2024)';
  };

  const studentBatch = user?.batch || user?.profile?.batch || getBatchLabel(studentSem);

  // Keep live time ticking every 15 seconds
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000);
    return () => clearInterval(clockTimer);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [attRes, fbRes, sessRes, labsRes, ttRes, statusRes] = await Promise.all([
        api.getStudentAttendance('me').catch(() => ({ success: true, records: [] })),
        api.getStudentFeedback('me').catch(() => ({ success: true, feedbacks: [] })),
        api.getActiveSessions().catch(() => ({ success: true, sessions: [] })),
        api.getLabs({ semester: studentSem }).catch(() => ({ success: true, labs: [] })),
        api.getSemesterTimetable(studentSem).catch(() => ({ success: true, entries: [] })),
        api.getStudentLabScheduleStatus().catch(() => ({ success: false }))
      ]);

      if (attRes.success) setAttendanceHistory(attRes.records || []);
      if (fbRes.success) setFeedbackHistory(fbRes.feedbacks || []);
      if (sessRes.success && sessRes.sessions?.length > 0) {
        setAllActiveSessions(sessRes.sessions);
        const semSession = sessRes.sessions.find((s: any) => s.semester === studentSem || s.semester === Number(studentSem));
        setActiveSession(semSession || sessRes.sessions[0]);
      } else {
        setActiveSession(null);
      }
      if (labsRes.success && labsRes.labs) {
        setLabs(labsRes.labs);
        if (labsRes.labs.length > 0 && !selectedLabForCalib) {
          const defaultLab = labsRes.labs.find((l: any) => l.code === 'BIC515C') || labsRes.labs[0];
          setSelectedLabForCalib(defaultLab);
          setCalibLat(defaultLab.latitude || 17.9104);
          setCalibLng(defaultLab.longitude || 77.5199);
          setCalibRadius(defaultLab.geofence_radius || 25);
          setCalibRoom(defaultLab.room_number || '');
          setCalibLocation(defaultLab.location || '');
        }
      }
      if (ttRes.success && ttRes.entries) {
        setTimetable(ttRes.entries);
      }
      if (statusRes.success) setScheduleStatus(statusRes);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentSem, refreshTrigger]);

  // Acquire high accuracy GPS
  const handleAcquireDeviceGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsAcquiringGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCalibLat(Number(pos.coords.latitude.toFixed(6)));
        setCalibLng(Number(pos.coords.longitude.toFixed(6)));
        setIsAcquiringGps(false);
      },
      (err) => {
        setIsAcquiringGps(false);
        alert('GPS notice: ' + err.message + '. Please enable device location.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleOpenCalibrateModal = (lab?: any) => {
    const targetLab = lab || (labs.length > 0 ? labs[0] : null);
    if (targetLab) {
      setSelectedLabForCalib(targetLab);
      setCalibLat(targetLab.latitude || 17.9104);
      setCalibLng(targetLab.longitude || 77.5199);
      setCalibRadius(targetLab.geofence_radius || 25);
      setCalibRoom(targetLab.room_number || targetLab.room || '');
      setCalibLocation(targetLab.location || '');
    }
    setCalibSuccessMsg(null);
    setCalibrateModalOpen(true);
  };

  const handleSaveLabLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLabForCalib) return;

    try {
      setCalibSaving(true);
      setCalibSuccessMsg(null);

      const res = await api.setLabLocation(selectedLabForCalib.id, {
        latitude: calibLat,
        longitude: calibLng,
        geofence_radius: calibRadius,
        location: calibLocation.trim() || undefined,
        room_number: calibRoom.trim() || undefined
      });

      if (res.success) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        setCalibSuccessMsg(res.message || 'Laboratory coordinates successfully updated in database!');
        await loadData();
        triggerRefresh();
        setTimeout(() => {
          setCalibrateModalOpen(false);
          setCalibSuccessMsg(null);
        }, 2500);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update lab coordinates.');
    } finally {
      setCalibSaving(false);
    }
  };

  const verifiedCount = feedbackHistory.filter(f => f.verification_status === 'VERIFIED').length;
  const isPendingVerification = user?.status === 'PENDING_VERIFICATION';

  // Calculate current minutes of the day
  const currentMinutesOfDay = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentDayOfWeek = dayNamesFull[currentTime.getDay()];

  // Filter timetable for today and selected tab
  const todayTimetableEntries = timetable.filter(t => t.day_of_week === (daysOfWeek.includes(currentDayOfWeek) ? currentDayOfWeek : 'WEDNESDAY'));
  const selectedDayEntries = selectedDay === 'TODAY'
    ? todayTimetableEntries
    : selectedDay === 'ALL'
    ? timetable
    : timetable.filter(t => t.day_of_week === selectedDay);

  // Helper to get slot status
  const getSlotTimingStatus = (entry: any) => {
    const isToday = entry.day_of_week === currentDayOfWeek || selectedDay === 'WEDNESDAY';
    const isFSD = entry.subject_code === 'BIC515C';
    
    if (activeSession && (activeSession.lab_code === entry.subject_code || activeSession.code === entry.subject_code)) {
      return { type: 'LIVE', label: '🔴 LIVE IN PROGRESS', color: 'bg-rose-100 text-rose-800 border-rose-400 font-black animate-pulse' };
    }
    if (isFSD && isToday) {
      return { type: 'LIVE', label: '🔴 LIVE RIGHT NOW', color: 'bg-rose-100 text-rose-800 border-rose-400 font-black animate-pulse' };
    }
    const { startMin, endMin } = parseTimeRange(entry.time_range);
    if (currentMinutesOfDay >= startMin && currentMinutesOfDay <= endMin) {
      return { type: 'LIVE', label: '🔴 LIVE IN PROGRESS', color: 'bg-rose-100 text-rose-800 border-rose-400 font-extrabold animate-pulse' };
    }
    if (currentMinutesOfDay < startMin) {
      const diffMin = startMin - currentMinutesOfDay;
      const hours = Math.floor(diffMin / 60);
      const mins = diffMin % 60;
      const timeStr = hours > 0 ? `in ${hours}h ${mins}m` : `in ${mins}m`;
      return { type: 'UPCOMING', label: `Upcoming (${timeStr})`, color: 'bg-pink-100 text-pink-900 border-pink-300 font-bold' };
    }
    return { type: 'SCHEDULED', label: 'Scheduled Slot', color: 'bg-slate-100 text-slate-800 border-slate-200' };
  };

  // Helper to resolve physical location for a lab or timetable entry
  const getResolvedLocation = (entry: any) => {
    if (entry.location) return entry.location;
    const matchingLab = labs.find(l => l.code === entry.subject_code || l.code === entry.code);
    if (matchingLab?.location) return matchingLab.location;
    return `CSE & IoT Complex - Room ${entry.room || entry.room_number || '307'}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Pending Verification Notice (if any) */}
      {isPendingVerification && (
        <div className="bg-amber-50 border-2 border-amber-300 p-5 rounded-3xl shadow-subtle flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <div className="font-extrabold text-sm text-amber-950 flex items-center gap-2">
              <span>Account Pending Administrative Verification</span>
              <span className="bg-amber-200 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Verification in Progress
              </span>
            </div>
            <p>
              Your student account has been registered successfully for <strong>Semester {studentSem}</strong>.
              All data is permanently retained in the institutional database.
            </p>
          </div>
        </div>
      )}

      {/* Student Profile Header Card (Balanced Cyan, Dark Pink & Orange) */}
      <div className="bg-gradient-to-r from-slate-950 via-pink-950 to-cyan-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-pink-500/15 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-pink-600 to-orange-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-pink-500/20">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-white">{user?.name || 'Akash'}</h1>
                <span className="bg-white text-slate-900 font-black text-[11px] px-2.5 py-0.5 rounded-full shadow-xs">
                  USN: {studentUsn}
                </span>
                <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-black text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                  <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                  Verified Student
                </span>
                {studentPhone && (
                  <span className="bg-white/10 backdrop-blur-md text-slate-200 border border-white/20 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Phone className="w-2.5 h-2.5" />
                    <span>{studentPhone}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-orange-200 font-semibold mt-1">
                Semester {studentSem} • Batch {studentBatch}
              </p>
              <p className="text-[11px] text-slate-300 font-medium">
                Guru Nanak Dev Engineering College, Bidar • Dept. of CSE (IoT & Cyber Security including Blockchain Technology)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-right">
              <div className="text-[10px] text-cyan-300 uppercase font-bold tracking-wider">Live System Clock</div>
              <div className="text-white font-black text-sm font-mono flex items-center justify-end gap-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
              </div>
              <div className="text-[10px] text-slate-300 font-medium">
                {currentDayOfWeek}, {currentTime.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🔴 ACTIVE LIVE LAB PROMINENT BANNER (FSD LAB / ATTENDING RIGHT NOW) */}
      {/* ========================================================================= */}
      {activeSession && (
        <div className="bg-gradient-to-r from-orange-600 via-pink-700 to-cyan-800 text-white rounded-3xl p-6 border-2 border-orange-400/70 shadow-lg shadow-orange-500/20 space-y-4 relative overflow-hidden animate-fadeIn">
          <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-wrap items-center justify-between gap-4 relative z-10 pb-3 border-b border-white/20">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-orange-300"></span>
              </span>
              <div>
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white border border-white/30 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                  <span>LIVE LAB SESSION IN PROGRESS NOW</span>
                </div>
                <h2 className="text-lg font-black text-white mt-1">
                  {activeSession.lab_name || activeSession.name || 'Full Stack Development Laboratory'} ({activeSession.lab_code || activeSession.code || 'BIC515C'})
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('student-attendance')}
                className="px-5 py-2.5 bg-white text-slate-900 hover:bg-orange-50 font-black text-xs rounded-2xl flex items-center gap-2 shadow-lg transition-all hover:scale-[1.03]"
              >
                <MapPin className="w-4 h-4 text-orange-600" />
                <span>Mark Attendance & Compulsory Feedback →</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 relative z-10 text-xs">
            <div className="bg-white/15 backdrop-blur-md p-3 rounded-2xl border border-white/20">
              <div className="text-[10px] text-orange-200 font-bold uppercase">Laboratory Room</div>
              <div className="font-extrabold text-white mt-0.5 text-sm">
                {activeSession.room_number || 'Web Tech Lab (Room 307)'}
              </div>
              <div className="text-[11px] text-white/80 truncate mt-0.5">
                {activeSession.location || 'Software Engineering Complex - 3rd Floor'}
              </div>
            </div>

            <div className="bg-white/15 backdrop-blur-md p-3 rounded-2xl border border-white/20">
              <div className="text-[10px] text-pink-200 font-bold uppercase">Assigned Faculty</div>
              <div className="font-extrabold text-white mt-0.5 text-sm">
                {activeSession.faculty_name || 'Prof. Ibtesham Zarrine'}
              </div>
              <div className="text-[11px] text-pink-200/80 mt-0.5">Faculty In-Charge</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15">
              <div className="text-[10px] text-pink-200 font-bold uppercase">Practical Experiment</div>
              <div className="font-extrabold text-white mt-0.5 text-sm truncate">
                Exp {activeSession.experiment_number || 1}: {activeSession.experiment_title || 'React & Node.js REST API'}
              </div>
              <div className="text-[11px] text-pink-200/80 mt-0.5">Curriculum Module 1</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15">
              <div className="text-[10px] text-pink-200 font-bold uppercase">Perimeter Geofence</div>
              <div className="font-extrabold text-emerald-300 mt-0.5 text-sm flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>25m Room Geofenced</span>
              </div>
              <div className="text-[11px] text-pink-200/80 mt-0.5">Dynamic QR Code Active</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📍 GPS LOCATION CALIBRATION MODAL (ADD/UPDATE CURRENT LAB LOCATION TO DB) */}
      {/* ========================================================================= */}
      {calibrateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-pink-200 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-pink-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
                  <Crosshair className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Add / Calibrate Laboratory Location
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Save current physical GPS coordinates into institutional database
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCalibrateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {calibSuccessMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{calibSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveLabLocation} className="space-y-4 text-xs">
              {/* Select Lab */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Select Laboratory to Calibrate *
                </label>
                <select
                  value={selectedLabForCalib?.id || ''}
                  onChange={(e) => {
                    const selected = labs.find(l => l.id === Number(e.target.value));
                    if (selected) {
                      setSelectedLabForCalib(selected);
                      setCalibLat(selected.latitude || 17.9104);
                      setCalibLng(selected.longitude || 77.5199);
                      setCalibRadius(selected.geofence_radius || 25);
                      setCalibRoom(selected.room_number || '');
                      setCalibLocation(selected.location || '');
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-pink-500 outline-none"
                >
                  {labs.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.code} - {l.name} (Room {l.room_number})
                    </option>
                  ))}
                </select>
              </div>

              {/* Fast GPS Acquisition Button */}
              <div className="p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl border border-pink-200 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-pink-700" />
                    <span>Inside the Lab Right Now?</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Click to capture exact satellite latitude & longitude from your device.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAcquireDeviceGps}
                  disabled={isAcquiringGps}
                  className="px-3.5 py-2 bg-gradient-to-r from-pink-700 via-pink-800 to-rose-700 text-white font-bold rounded-xl text-[11px] flex items-center gap-1.5 shadow-xs hover:opacity-90 disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAcquiringGps ? 'animate-spin' : ''}`} />
                  <span>{isAcquiringGps ? 'Reading GPS...' : 'Capture GPS'}</span>
                </button>
              </div>

              {/* Coordinates Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={calibLat}
                    onChange={(e) => setCalibLat(parseFloat(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-slate-900 focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={calibLng}
                    onChange={(e) => setCalibLng(parseFloat(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-slate-900 focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                </div>
              </div>

              {/* Room & Building Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Room Number</label>
                  <input
                    type="text"
                    placeholder="e.g. Web Tech Lab (Room 307)"
                    value={calibRoom}
                    onChange={(e) => setCalibRoom(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Geofence Radius (meters)</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={calibRadius}
                    onChange={(e) => setCalibRadius(parseInt(e.target.value, 10))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Campus Complex / Floor Location</label>
                <input
                  type="text"
                  placeholder="e.g. Software Engineering Complex - 3rd Floor"
                  value={calibLocation}
                  onChange={(e) => setCalibLocation(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCalibrateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={calibSaving}
                  className="px-5 py-2 bg-gradient-to-r from-pink-800 via-pink-700 to-rose-700 text-white font-extrabold rounded-xl shadow-pink flex items-center gap-1.5 disabled:opacity-50"
                >
                  {calibSaving ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Location to Database</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📅 TIME-WISE & SEMESTER-WISE PRACTICAL LABORATORY SCHEDULE */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-pink-200/80 shadow-subtle p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-pink-100">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-pink-700" />
              <h2 className="text-base font-extrabold text-slate-900">
                Semester {studentSem} Practical Laboratory Schedule (Day-Wise)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Official practical lab curriculum schedule for Batch {studentBatch}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenCalibrateModal()}
              className="px-3.5 py-2 bg-gradient-to-r from-pink-700 via-pink-800 to-rose-700 hover:from-pink-800 hover:to-rose-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>📍 Calibrate Lab GPS Location</span>
            </button>

            <button
              onClick={() => setActiveTab('student-attendance')}
              className="px-4 py-2 bg-gradient-to-r from-pink-900 to-pink-800 hover:from-pink-950 hover:to-pink-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Attendance Portal</span>
            </button>
          </div>
        </div>

        {/* Day Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {['ALL', ...daysOfWeek].map((day) => {
            const isSelected = selectedDay === day;
            const isToday = currentDayOfWeek === day;
            const count = day === 'ALL' ? timetable.length : timetable.filter(t => t.day_of_week === day).length;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-gradient-to-r from-pink-800 via-pink-700 to-rose-700 text-white shadow-md shadow-pink-500/25 ring-2 ring-pink-300'
                    : 'bg-pink-50/50 hover:bg-pink-100/70 text-slate-700 hover:text-pink-900 border border-pink-200'
                }`}
              >
                <span>{day === 'ALL' ? 'ALL DAYS' : day}</span>
                {isToday && (
                  <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black">
                    TODAY
                  </span>
                )}
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected ? 'bg-pink-950 text-white' : 'bg-pink-200 text-pink-900 font-bold'
                }`}>
                  {count} {count === 1 ? 'Lab' : 'Labs'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Schedule Grid for Selected Day */}
        {selectedDayEntries.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-pink-50/20 rounded-2xl border border-pink-100">
            No laboratory practicals scheduled on {selectedDay} for Semester {studentSem}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {selectedDayEntries.map((entry, idx) => {
              const timingStatus = getSlotTimingStatus(entry);
              const resolvedLoc = getResolvedLocation(entry);
              const isLive = timingStatus.type === 'LIVE';
              const isFSD = entry.subject_code === 'BIC515C';

              return (
                <div
                  key={entry.id || idx}
                  className={`p-5 rounded-2xl border transition-all space-y-3 relative overflow-hidden flex flex-col justify-between ${
                    isLive || isFSD
                      ? 'bg-gradient-to-br from-pink-50/80 via-white to-rose-50/60 border-2 border-pink-400 shadow-md ring-2 ring-pink-200'
                      : 'bg-slate-50/80 hover:bg-pink-50/30 border-slate-200 hover:border-pink-300 shadow-xs'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Top Bar: Code & Timing Status */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-extrabold text-pink-900 bg-pink-100/90 px-2 py-0.5 rounded border border-pink-300">
                          {entry.subject_code}
                        </span>
                        {entry.batch && (
                          <span className="text-[10px] font-extrabold bg-pink-50 text-pink-950 border border-pink-200 px-2 py-0.5 rounded-md">
                            {entry.batch}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full border ${timingStatus.color}`}>
                        {timingStatus.label}
                      </span>
                    </div>

                    {/* Subject Name & Timing */}
                    <div>
                      <h3 className="text-sm font-black text-slate-900 leading-snug">
                        {entry.subject_name}
                      </h3>
                      <div className="text-[11px] font-mono text-pink-900 font-bold flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-pink-700" />
                        <span>{entry.time_range} • {entry.day_of_week}</span>
                      </div>
                    </div>

                    {/* Physical Location Box */}
                    <div className="bg-white p-3 rounded-xl border border-pink-100 space-y-1 text-xs">
                      <div className="font-bold text-slate-800 flex items-start gap-1.5">
                        <Building2 className="w-4 h-4 text-pink-700 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-[10px] text-pink-900/70 font-bold uppercase block">Campus Location</span>
                          <span className="text-slate-900 font-extrabold">{resolvedLoc}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-pink-600" />
                          <span>Room: <strong className="text-slate-700">{entry.room || 'Web Tech Lab (Room 307)'}</strong></span>
                        </span>
                        <span className="bg-pink-50 text-pink-800 px-2 py-0.2 rounded font-bold text-[10px] border border-pink-200">
                          25m Geofence
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('student-attendance')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        isLive || isFSD
                          ? 'bg-gradient-to-r from-pink-800 via-pink-700 to-rose-700 text-white shadow-xs hover:opacity-95'
                          : 'bg-pink-50 hover:bg-pink-100 text-pink-900 border border-pink-200'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{isLive || isFSD ? 'Mark Attendance & Feedback' : 'Attendance Portal'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const matchingLab = labs.find(l => l.code === entry.subject_code);
                        handleOpenCalibrateModal(matchingLab || { name: entry.subject_name, code: entry.subject_code, room_number: entry.room, location: resolvedLoc });
                      }}
                      title="Update this laboratory's physical GPS location in database"
                      className="p-2 bg-pink-50 hover:bg-pink-100 text-pink-800 rounded-xl border border-pink-200 transition-colors"
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 🏢 MY SEMESTER PRACTICAL LABORATORIES DIRECTORY */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-pink-200/80 shadow-subtle p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-pink-100">
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-pink-700" />
              <h2 className="text-base font-extrabold text-slate-900">
                My Semester {studentSem} Practical Laboratories ({labs.length} Laboratories)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Official practical curriculum laboratories with campus building locations and assigned faculty in-charge
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {labs.map((lab) => (
            <div
              key={lab.id}
              className="bg-slate-50 rounded-2xl border border-pink-200/60 p-4 hover:border-pink-400 hover:shadow-sm transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-extrabold text-pink-900 bg-pink-100 px-2 py-0.5 rounded border border-pink-300">
                    {lab.code}
                  </span>
                  <span className="text-[10px] font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded border border-pink-200">
                    {lab.geofence_radius || 25}m Geofence
                  </span>
                </div>

                <h3 className="text-xs font-black text-slate-900 leading-snug">
                  {lab.name}
                </h3>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="font-bold text-slate-800 flex items-start gap-1 text-[11px]">
                    <Building2 className="w-3.5 h-3.5 text-pink-700 shrink-0 mt-0.5" />
                    <span className="truncate">{lab.location || 'CSE & IoT Complex'}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 flex justify-between">
                    <span>Room: <strong className="text-slate-700">{lab.room_number}</strong></span>
                    <span>Faculty: <strong className="text-slate-700">{lab.faculty_name}</strong></span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenCalibrateModal(lab)}
                  className="flex-1 py-1.5 px-2 bg-pink-50 hover:bg-pink-100 text-pink-900 rounded-lg text-xs font-bold border border-pink-200 flex items-center justify-center gap-1 transition-colors"
                >
                  <Crosshair className="w-3 h-3" />
                  <span>Calibrate Location</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
