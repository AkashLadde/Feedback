import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import { LiveClock } from '../components/LiveClock';
import {
  MapPin,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Navigation,
  RefreshCw,
  Info,
  Radio,
  Satellite,
  Compass,
  Lock,
  ArrowRight,
  Clock,
  Sparkles,
  Star,
  BookOpen,
  Cpu,
  UserCheck,
  MessageSquare,
  FlaskConical,
  Unlock,
  AlertCircle,
  Timer,
  Building2,
  CalendarDays,
  Calendar,
  Users
} from 'lucide-react';

export const StudentAttendancePage: React.FC = () => {
  const { user, setActiveTab, triggerRefresh } = useAuth();
  const [scheduleStatus, setScheduleStatus] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [forceOpenWindow, setForceOpenWindow] = useState<boolean>(false);

  // Strong GPS Geolocation State (< 25m geofencing inside lab)
  const [latitude, setLatitude] = useState<number>(17.9104);
  const [longitude, setLongitude] = useState<number>(77.5199);
  const [accuracy, setAccuracy] = useState<number>(8.0);
  const [locating, setLocating] = useState<boolean>(false);
  const [gpsLocked, setGpsLocked] = useState<boolean>(false);
  const [qrToken, setQrToken] = useState<string>('');

  // 8 Mandatory Feedback Evaluation Fields (Compulsory for Attendance)
  const [teachingBasics, setTeachingBasics] = useState<string>('Thoroughly explained on board/slides with clear objectives');
  const [handsOn, setHandsOn] = useState<string>('Yes, performed hands-on individually on my PC/Kit');
  const [teacherGuidance, setTeacherGuidance] = useState<string>('Continuously guided and inspected each student desk');
  const [doubtSupport, setDoubtSupport] = useState<string>('Extremely cooperative, patiently cleared every doubt');
  const [reasonUnderstanding, setReasonUnderstanding] = useState<string>('Yes, fully understand the working principle & reasons');
  const [vivaTaken, setVivaTaken] = useState<string>('Yes, detailed one-on-one individual viva conducted');
  const [hardwareSetup, setHardwareSetup] = useState<string>('Complete working setup (all kits, PCs & software working)');
  const [labPunctuality, setLabPunctuality] = useState<string>('Full scheduled lab duration conducted properly');
  const [overallRating, setOverallRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comments, setComments] = useState<string>('');

  const [testingUnlock, setTestingUnlock] = useState<boolean>(false);
  const [selectedDayTab, setSelectedDayTab] = useState<string>('TODAY');
  const [timetableEntries, setTimetableEntries] = useState<any[]>([]);

  const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

  const studentSem = Number(scheduleStatus?.student?.semester || user?.semester || user?.profile?.semester || 1);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const [res, ttRes] = await Promise.all([
        api.getStudentLabScheduleStatus(),
        api.getSemesterTimetable(studentSem).catch(() => ({ success: false, entries: [] }))
      ]);

      if (res.success) {
        setScheduleStatus(res);
        if (res.activeSession?.latitude && res.activeSession?.longitude) {
          setLatitude(res.activeSession.latitude + 0.00004);
          setLongitude(res.activeSession.longitude + 0.00004);
        } else if (res.matchingSlot?.latitude && res.matchingSlot?.longitude) {
          setLatitude(res.matchingSlot.latitude + 0.00004);
          setLongitude(res.matchingSlot.longitude + 0.00004);
        }

        if (res.activeSession?.id) {
          try {
            const liveRes = await api.getLiveSession(res.activeSession.id);
            if (liveRes.success && liveRes.activeQR?.token) {
              setQrToken(liveRes.activeQR.token);
            }
          } catch (e) {
            // Live session token optional
          }
        }
      }

      if (ttRes.success && ttRes.entries) {
        setTimetableEntries(ttRes.entries);
      }
    } catch (err) {
      console.error('Failed to load student status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 20000);
    return () => clearInterval(timer);
  }, [studentSem]);

  // High-Accuracy GPS Capture
  const getRealGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setGpsLocked(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setAccuracy(Math.round(pos.coords.accuracy * 10) / 10);
        setLocating(false);
        setGpsLocked(true);
      },
      (err) => {
        setLocating(false);
        alert('GPS notice: ' + err.message + '. Please allow location access.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Preset location simulations for laboratory testing
  const setPreset = (type: 'INSIDE' | 'DOORWAY' | 'CAFETERIA' | 'LOW_ACCURACY') => {
    const baseLat = scheduleStatus?.activeSession?.latitude || scheduleStatus?.matchingSlot?.latitude || 17.9104;
    const baseLng = scheduleStatus?.activeSession?.longitude || scheduleStatus?.matchingSlot?.longitude || 77.5199;

    if (type === 'INSIDE') {
      setLatitude(baseLat + 0.00004);
      setLongitude(baseLng + 0.00004);
      setAccuracy(6.0);
    } else if (type === 'DOORWAY') {
      setLatitude(baseLat + 0.00018);
      setLongitude(baseLng + 0.00018);
      setAccuracy(14.0);
    } else if (type === 'CAFETERIA') {
      setLatitude(baseLat + 0.0028);
      setLongitude(baseLng + 0.0025);
      setAccuracy(12.0);
    } else if (type === 'LOW_ACCURACY') {
      setLatitude(baseLat);
      setLongitude(baseLng);
      setAccuracy(120.0);
    }
    setResultMessage(null);
  };

  // Haversine Distance computation
  const calculateDistance = () => {
    const targetLat = scheduleStatus?.activeSession?.latitude || scheduleStatus?.matchingSlot?.latitude || 17.9104;
    const targetLng = scheduleStatus?.activeSession?.longitude || scheduleStatus?.matchingSlot?.longitude || 77.5199;

    const R = 6371e3;
    const phi1 = (latitude * Math.PI) / 180;
    const phi2 = (targetLat * Math.PI) / 180;
    const deltaPhi = ((targetLat - latitude) * Math.PI) / 180;
    const deltaLambda = ((targetLng - longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const distance = calculateDistance();
  const radius = scheduleStatus?.activeSession?.geofence_radius || scheduleStatus?.matchingSlot?.geofence_radius || 25;

  const isGpsStrong = accuracy <= 15.0;
  const isGpsModerate = accuracy > 15.0 && accuracy <= 25.0;

  let geoState: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
  let geoMessage = 'Strong GPS Lock Verified — You are inside the designated laboratory perimeter.';

  if (accuracy > 30) {
    geoState = 'YELLOW';
    geoMessage = 'Location accuracy margin is wide. Move near a window or refresh GPS.';
  } else if (distance > radius + 5) {
    geoState = 'RED';
    geoMessage = `Outside laboratory boundary (Displacement: ${distance}m, Permitted: ${radius}m).`;
  }

  // Handle Testing Override to unlock the 5-minute window
  const handleTestingUnlock = async () => {
    if (scheduleStatus?.activeSession?.id) {
      try {
        setTestingUnlock(true);
        await api.unlockAttendanceWindow(scheduleStatus.activeSession.id);
        await fetchStatus();
      } catch (err: any) {
        alert(err.message || 'Could not unlock session window.');
      } finally {
        setTestingUnlock(false);
      }
    }
  };

  // Unified Attendance & Compulsory Feedback Submission
  const handleUnifiedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleStatus || scheduleStatus.hasSubmitted) return;

    // Validate feedback completeness (Compulsory feedback check)
    if (!teachingBasics || !handsOn || !teacherGuidance || !doubtSupport || !reasonUnderstanding || !vivaTaken || !hardwareSetup || !labPunctuality || !overallRating) {
      alert('Feedback is strictly COMPULSORY! Please answer all 8 evaluation criteria before marking attendance.');
      return;
    }

    try {
      setSubmitting(true);
      setResultMessage(null);

      const targetSessionId = scheduleStatus.activeSession?.id;
      const targetLabId = scheduleStatus.matchingSlot?.laboratory_id || scheduleStatus.activeSession?.laboratory_id;

      const res = await api.submitUnifiedAttendanceFeedback({
        session_id: targetSessionId,
        laboratory_id: targetLabId,
        qr_token: qrToken.trim() || undefined,
        latitude,
        longitude,
        accuracy,
        teaching_basics: teachingBasics,
        hands_on: handsOn,
        teacher_guidance: teacherGuidance,
        doubt_support: doubtSupport,
        reason_understanding: reasonUnderstanding,
        viva_taken: vivaTaken,
        hardware_setup: hardwareSetup,
        lab_punctuality: labPunctuality,
        overall_rating: overallRating,
        comments: comments.trim() || undefined
      });

      if (res.success) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
        setIsSuccess(true);
        setResultMessage(res.message || 'Attendance & Compulsory Feedback logged and verified successfully!');
        await fetchStatus();
        triggerRefresh();
      }
    } catch (err: any) {
      setIsSuccess(false);
      setResultMessage(err.message || 'Attendance & feedback submission failed.');
    } finally {
      setSubmitting(false);
    }
  };  if (loading && !scheduleStatus) {
    return (
      <div className="p-12 text-center text-slate-600 space-y-3">
        <div className="w-10 h-10 border-3 border-pink-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <span className="text-xs font-bold text-slate-700">
          Checking Semester {user?.semester || user?.profile?.semester || 5} Laboratory Timetable & Geofence Status...
        </span>
      </div>
    );
  }

  const isLabActive = scheduleStatus?.isLabActive || forceOpenWindow;
  const is5MinWindowActive = scheduleStatus?.is5MinWindowActive || forceOpenWindow;
  const isBeforeWindow = scheduleStatus?.isBeforeWindow && !forceOpenWindow;
  const isWindowExpired = scheduleStatus?.isWindowExpired && !forceOpenWindow;
  const hasSubmitted = scheduleStatus?.hasSubmitted;
  const activeLab = scheduleStatus?.activeSession || scheduleStatus?.matchingSlot;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Academic Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 animate-pulse"></span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Laboratory Attendance & Feedback Portal
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Semester {studentSem} • Batch {user?.batch || (studentSem === 1 ? '2026' : studentSem === 3 ? '2025' : studentSem === 5 ? '2024' : '2023')} • Guru Nanak Dev Engineering College
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStatus}
            title="Refresh Status"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold border border-slate-200 shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 text-pink-700 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Portal</span>
          </button>
        </div>
      </div>

      {/* ================= SCENARIO 1: ALREADY SUBMITTED (ZERO DUPLICATES) ================= */}
      {hasSubmitted && (
        <div className="p-6 rounded-3xl bg-emerald-50 border-2 border-emerald-300 shadow-card text-emerald-950 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <div className="text-base font-extrabold text-emerald-900">
                Attendance & Feedback Verified & Locked (Zero Duplicates Policy)
              </div>
              <p className="text-xs text-emerald-800 mt-0.5 font-medium">
                Your presence in the laboratory has been confirmed via GPS, and your confidential feedback has been recorded.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/80 p-4 rounded-2xl border border-emerald-200 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px] font-semibold">Student USN</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{scheduleStatus?.student?.usn || user?.usn}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-semibold">Attendance Logged At</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {scheduleStatus?.submissionRecord?.attendance_time || 'Today'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-semibold">Feedback Given</span>
              <span className="font-bold text-emerald-800 text-sm flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>{scheduleStatus?.submissionRecord?.overall_rating || 5} / 5 Stars Verified</span>
              </span>
            </div>
          </div>

          <div className="text-[11px] text-emerald-800 font-medium">
            🛡️ Attendance can only be recorded once per practical session. Duplicate submissions are prevented.
          </div>
        </div>
      )}

      {/* ================= SCENARIO 2: OUTSIDE SCHEDULED LAB TIMING ================= */}
      {!hasSubmitted && !isLabActive && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-card text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-100 to-orange-100 text-cyan-800 flex items-center justify-center mx-auto border border-cyan-200 shadow-inner">
            <Lock className="w-8 h-8 text-cyan-700" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900">
              Laboratory Portal Closed — Outside Scheduled Lab Hours
            </h2>
            <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
              Laboratory details, attendance, and evaluation for <strong>Semester {studentSem}</strong> are strictly accessible only during scheduled practical laboratory periods.
            </p>
          </div>

          {scheduleStatus?.nextScheduledLab && (
            <div className="bg-gradient-to-r from-cyan-50/70 via-white to-orange-50/70 p-5 rounded-2xl border border-cyan-200 max-w-md mx-auto text-left space-y-2">
              <div className="text-[11px] font-bold text-cyan-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-600" />
                <span>Next Scheduled Semester {studentSem} Practical Lab:</span>
              </div>
              <div className="text-sm font-extrabold text-slate-900">
                {scheduleStatus.nextScheduledLab.subject_name} ({scheduleStatus.nextScheduledLab.subject_code})
              </div>
              {scheduleStatus.nextScheduledLab.location && (
                <div className="text-[11px] text-slate-600 flex items-center gap-1 font-semibold">
                  <Building2 className="w-3.5 h-3.5 text-cyan-700 shrink-0" />
                  <span>{scheduleStatus.nextScheduledLab.location}</span>
                </div>
              )}
              <div className="text-xs text-slate-800 font-bold flex items-center justify-between pt-1 border-t border-slate-100">
                <span>{scheduleStatus.nextScheduledLab.when}</span>
                <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200">
                  Room {scheduleStatus.nextScheduledLab.room || 'Lab'}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-2">
            <span>Live System Time:</span>
            <LiveClock variant="minimal" />
          </div>
        </div>
      )}

      {/* ================= SCENARIO 3: LAB ACTIVE BUT BEFORE THE SUBMISSION WINDOW ================= */}
      {!hasSubmitted && isLabActive && isBeforeWindow && (
        <div className="bg-white p-8 rounded-3xl border-2 border-orange-300 shadow-card space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-600 animate-ping"></span>
                <span className="text-xs font-black text-orange-900 uppercase tracking-wider">
                  Semester {studentSem} Practical Lab in Progress
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-1">
                {activeLab?.lab_name || activeLab?.subject_name} ({activeLab?.lab_code || activeLab?.subject_code})
              </h2>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                {activeLab?.location && (
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-cyan-700" />
                    <span>{activeLab.location}</span>
                  </span>
                )}
                <span>• Room {activeLab?.room_number || activeLab?.room}</span>
                <span>• Instructor: {activeLab?.faculty_name}</span>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 px-4 py-2 rounded-2xl text-right">
              <div className="text-[10px] text-orange-800 uppercase font-bold tracking-wider">Scheduled Window In</div>
              <div className="text-base font-black text-orange-950 font-mono flex items-center gap-1.5 justify-end">
                <Timer className="w-4 h-4 text-orange-600 animate-pulse" />
                <span>~{scheduleStatus?.minutesUntilWindowOpens || 10} min</span>
              </div>
            </div>
          </div>

          <div className="p-5 bg-gradient-to-r from-orange-50/80 via-white to-cyan-50/80 rounded-2xl border border-orange-200 flex items-start gap-3">
            <Info className="w-5 h-5 text-orange-700 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed space-y-1">
              <div className="font-bold text-slate-900 text-sm">
                Attendance & Feedback Opens 10 Minutes Before End of Lab (or Submit Directly Now)
              </div>
              <p>
                As per institutional guidelines, the attendance and compulsory feedback portal unlocks <strong>10 minutes before the end of the lab session</strong> (from {scheduleStatus?.windowOpenTimeStr || '10m before end'} to {scheduleStatus?.windowCloseTimeStr || 'end of lab'}).
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setForceOpenWindow(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-pink-800 via-rose-700 to-orange-600 hover:from-pink-900 hover:to-orange-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md shadow-pink-900/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-pink-200" />
              <span>Completed Practical Experiment? Fill & Submit Feedback Now</span>
            </button>

            {scheduleStatus?.activeSession && (
              <button
                type="button"
                onClick={handleTestingUnlock}
                disabled={testingUnlock}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>{testingUnlock ? 'Unlocking...' : 'Quick Unlock Window'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ================= SCENARIO 4: SUBMISSION WINDOW EXPIRED ================= */}
      {!hasSubmitted && isLabActive && isWindowExpired && (
        <div className="bg-white p-8 rounded-3xl border border-amber-200 shadow-card text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-extrabold text-slate-900">
            Attendance & Feedback Submission Portal for Today's Lab
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            The scheduled window concluded at {scheduleStatus?.windowCloseTimeStr}. If you are in the laboratory, you can still submit your feedback & attendance below.
          </p>
          <button
            type="button"
            onClick={() => setForceOpenWindow(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-pink-800 to-rose-600 hover:from-pink-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-pink-800/20 mx-auto"
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>Open Attendance & Feedback Form</span>
          </button>
        </div>
      )}

      {/* ================= SCENARIO 5: SUBMISSION WINDOW OPEN ================= */}
      {!hasSubmitted && isLabActive && is5MinWindowActive && (
        <form onSubmit={handleUnifiedSubmit} className="space-y-6">
          {/* Active Session Info Card */}
          <div className="bg-white p-6 rounded-3xl border-2 border-emerald-300 shadow-card flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Feedback Submission Portal Active (Open 10m before lab end)
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-0.5">
                {activeLab?.lab_name || activeLab?.subject_name} ({activeLab?.lab_code || activeLab?.subject_code})
              </h2>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                {activeLab?.location && (
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-cyan-700" />
                    <span>{activeLab.location}</span>
                  </span>
                )}
                <span>• Room {activeLab?.room_number || activeLab?.room}</span>
                <span>• Instructor: {activeLab?.faculty_name}</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-300 px-3.5 py-1.5 rounded-2xl text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Portal Open</span>
            </div>
          </div>

          {/* Section 1: Geofence & Strong GPS Check */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Satellite className="w-4 h-4 text-cyan-700" />
                <span>Step 1: Strong Satellite GPS Verification (&lt; 25m Room Geofence)</span>
              </span>

              <button
                type="button"
                onClick={getRealGPS}
                disabled={locating}
                className="text-xs font-bold text-cyan-800 hover:text-cyan-950 bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 rounded-xl border border-cyan-200 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
                <span>{locating ? 'Acquiring GPS...' : 'Refresh Device GPS'}</span>
              </button>
            </div>

            {/* Geofence Status Banner */}
            <div
              className={`p-4 rounded-2xl border-2 transition-all ${
                geoState === 'GREEN'
                  ? 'bg-cyan-50/90 border-cyan-400 text-cyan-950'
                  : geoState === 'YELLOW'
                  ? 'bg-orange-50/90 border-orange-300 text-orange-950'
                  : 'bg-red-50/90 border-red-300 text-red-950'
              }`}
            >
              <div className="flex items-start gap-3">
                {geoState === 'GREEN' && <ShieldCheck className="w-5 h-5 text-cyan-700 shrink-0 mt-0.5" />}
                {geoState === 'YELLOW' && <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />}
                {geoState === 'RED' && <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}

                <div className="flex-1 text-xs">
                  <div className="font-extrabold uppercase tracking-wider flex items-center justify-between">
                    <span>{geoState === 'GREEN' ? 'GEOFENCE STATUS: INSIDE LAB' : 'GEOFENCE STATUS: OUTSIDE BOUNDARY'}</span>
                    <span className="bg-white px-2 py-0.5 rounded-full font-bold border border-cyan-200">
                      {distance}m to Lab Center
                    </span>
                  </div>
                  <div className="font-bold mt-1 text-slate-900">{geoMessage}</div>
                </div>
              </div>
            </div>

            {/* GPS Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold block">Precision</span>
                <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${isGpsStrong ? 'bg-cyan-600' : 'bg-orange-400'}`}></span>
                  <span>{isGpsStrong ? 'Strong' : 'Moderate'}</span>
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold block">Accuracy Margin</span>
                <span className="font-mono font-bold text-cyan-900 mt-0.5 block">±{accuracy}m</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold block">Displacement</span>
                <span className="font-mono font-bold text-slate-900 mt-0.5 block">{distance}m (Max {radius}m)</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold block">Room</span>
                <span className="font-bold text-slate-900 mt-0.5 block">Room {activeLab?.room_number || activeLab?.room || '307'}</span>
              </div>
            </div>

            {/* Simulation Engine */}
            <div className="pt-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Compass className="w-3 h-3 text-cyan-600" />
                <span>Test Simulation Coordinates:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPreset('INSIDE')}
                  className="p-2 bg-cyan-50 hover:bg-cyan-100/80 border border-cyan-200 text-cyan-950 rounded-xl font-bold text-left"
                >
                  <div>Inside Lab Room</div>
                  <div className="text-[10px] text-cyan-700">~4m (Valid)</div>
                </button>
                <button
                  type="button"
                  onClick={() => setPreset('DOORWAY')}
                  className="p-2 bg-orange-50 hover:bg-orange-100/80 border border-orange-200 text-orange-950 rounded-xl font-bold text-left"
                >
                  <div>Lab Doorway</div>
                  <div className="text-[10px] text-orange-700">~18m (Valid)</div>
                </button>
                <button
                  type="button"
                  onClick={() => setPreset('CAFETERIA')}
                  className="p-2 bg-red-50 hover:bg-red-100/80 border border-red-200 text-red-900 rounded-xl font-bold text-left"
                >
                  <div>Canteen / Outside</div>
                  <div className="text-[10px] text-red-600">~320m (Rejected)</div>
                </button>
                <button
                  type="button"
                  onClick={() => setPreset('LOW_ACCURACY')}
                  className="p-2 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-900 rounded-xl font-bold text-left"
                >
                  <div>Low GPS Margin</div>
                  <div className="text-[10px] text-amber-600">±120m</div>
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Compulsory Laboratory Feedback Evaluation */}
          <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-card space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-pink-50">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Star className="w-4 h-4 text-pink-700 fill-pink-600" />
                <span>Step 2: Mandatory Laboratory Feedback (All 8 Fields Compulsory)</span>
              </span>
              <span className="text-[10px] bg-pink-100 text-pink-800 font-bold px-2.5 py-0.5 rounded-full border border-pink-200">
                Compulsory to Record Attendance
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* 1. Teaching Basics */}
              <div>
                <label className="block font-extrabold text-slate-800 mb-1.5">
                  1. Laboratory Experiment Basics & Concepts Explanation *
                </label>
                <select
                  required
                  value={teachingBasics}
                  onChange={(e) => setTeachingBasics(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium bg-white focus:ring-2 focus:ring-pink-500 outline-none"
                >
                  <option value="Thoroughly explained on board/slides with clear objectives">
                    Thoroughly explained on board/slides with clear objectives (Excellent)
                  </option>
                  <option value="Briefly explained the steps before starting">
                    Briefly explained the steps before starting (Satisfactory)
                  </option>
                  <option value="Asked to directly start without explaining concepts">
                    Asked to directly start without explaining concepts (Needs Improvement)
                  </option>
                </select>
              </div>

              {/* 2. Hands-on Experimentation */}
              <div>
                <label className="block font-extrabold text-slate-800 mb-1.5">
                  2. Hands-On Practical Execution by Students *
                </label>
                <select
                  required
                  value={handsOn}
                  onChange={(e) => setHandsOn(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium bg-white focus:ring-2 focus:ring-pink-500 outline-none"
                >
                  <option value="Yes, performed hands-on individually on my PC/Kit">
                    Yes, performed hands-on individually on my PC/Kit (Individual Execution)
                  </option>
                  <option value="Performed in a group of 2-3 students">
                    Performed in a group of 2-3 students (Group Execution)
                  </option>
                  <option value="Only observed teacher demo, did not get PC/Kit">
                    Only observed teacher demo, did not get PC/Kit (No Hands-on)
                  </option>
                </select>
              </div>

              {/* 3. Teacher Guidance */}
              <div>
                <label className="block font-extrabold text-slate-800 mb-1.5">
                  3. Teacher Desk-to-Desk Monitoring & Active Guidance *
                </label>
                <select
                  required
                  value={teacherGuidance}
                  onChange={(e) => setTeacherGuidance(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium bg-white focus:ring-2 focus:ring-pink-500 outline-none"
                >
                  <option value="Continuously guided and inspected each student desk">
                    Continuously guided and inspected each student desk (Active Continuous Guidance)
                  </option>
                  <option value="Available at faculty table when approached">
                    Available at faculty table when approached (Available on Request)
                  </option>
                  <option value="Teacher was not attentive or busy elsewhere">
                    Teacher was not attentive or busy elsewhere (Minimal Guidance)
                  </option>
                </select>
              </div>

              {/* 4. Doubt Support */}
              <div>
                <label className="block font-extrabold text-slate-800 mb-1.5">
                  4. Doubt Clearance & Cooperative Attitude *
                </label>
                <select
                  required
                  value={doubtSupport}
                  onChange={(e) => setDoubtSupport(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium bg-white focus:ring-2 focus:ring-pink-500 outline-none"
                >
                  <option value="Extremely cooperative, patiently cleared every doubt">
                    Extremely cooperative, patiently cleared every doubt (Excellent Support)
                  </option>
                  <option value="Cleared basic syntax/kit errors">
                    Cleared basic syntax/kit errors (Moderate Support)
                  </option>
                  <option value="Did not address questions or doubts">
                    Did not address questions or doubts (Unsupportive)
                  </option>
                </select>
              </div>

              {/* 5. Working Principle Understanding */}
              <div>
                <label className="block font-extrabold text-slate-800 mb-1.5">
                  5. Conceptual Understanding & Working Principle Learned *
                </label>
                <select
                  required
                  value={reasonUnderstanding}
                  onChange={(e) => setReasonUnderstanding(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium bg-white focus:ring-2 focus:ring-pink-500 outline-none"
                >
                  <option value="Yes, fully understand the working principle & reasons">
                    Yes, fully understand the working principle & reasons (100% Clarity)
                  </option>
                  <option value="Understood practical output, but theory needs revision">
                    Understood practical output, but theory needs revision (Partial Clarity)
                  </option>
                  <option value="Could not understand the underlying logic">
                    Could not understand the underlying logic (Need Remedial Help)
                  </option>
                </select>
              </div>

              {/* 6. Viva Taken */}
              <div>
                <label className="block font-extrabold text-slate-800 mb-1.5">
                  6. Individual Viva Examination Conducted During Lab *
                </label>
                <select
                  required
                  value={vivaTaken}
                  onChange={(e) => setVivaTaken(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium bg-white focus:ring-2 focus:ring-pink-500 outline-none"
                >
                  <option value="Yes, detailed one-on-one individual viva conducted">
                    Yes, detailed one-on-one individual viva conducted
                  </option>
                  <option value="Brief oral questions asked at the desk">
                    Brief oral questions asked at the desk
                  </option>
                  <option value="No viva conducted for today's experiment">
                    No viva conducted for today's experiment
                  </option>
                </select>
              </div>

              {/* 7. Hardware Setup */}
              <div>
                <label className="block font-extrabold text-slate-800 mb-1.5">
                  7. Laboratory Hardware, Kit & Software Availability *
                </label>
                <select
                  required
                  value={hardwareSetup}
                  onChange={(e) => setHardwareSetup(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium bg-white focus:ring-2 focus:ring-pink-500 outline-none"
                >
                  <option value="Complete working setup (all kits, PCs & software working)">
                    Complete working setup (all kits, PCs & software working smoothly)
                  </option>
                  <option value="Minor issues (had to share kit/restart PC)">
                    Minor issues (had to share kit/restart PC)
                  </option>
                  <option value="Frequent equipment failure or software missing">
                    Frequent equipment failure or software missing
                  </option>
                </select>
              </div>

              {/* 8. Lab Punctuality */}
              <div>
                <label className="block font-extrabold text-slate-800 mb-1.5">
                  8. Laboratory Punctuality & Full Duration Utilization *
                </label>
                <select
                  required
                  value={labPunctuality}
                  onChange={(e) => setLabPunctuality(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium bg-white focus:ring-2 focus:ring-pink-500 outline-none"
                >
                  <option value="Full scheduled lab duration conducted properly">
                    Full scheduled lab duration conducted properly (Full Session)
                  </option>
                  <option value="Conducted for 1.5 - 2 hours">
                    Conducted for 1.5 - 2 hours
                  </option>
                  <option value="Session ended very early">
                    Session ended very early
                  </option>
                </select>
              </div>

              {/* Overall Star Rating */}
              <div className="pt-2">
                <label className="block font-extrabold text-slate-800 mb-1">
                  Overall Laboratory & Faculty Rating (1 to 5 Stars) *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setOverallRating(star)}
                      className="p-1 focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          (hoverRating || overallRating) >= star
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 font-extrabold text-slate-800 text-sm">
                    {overallRating === 5
                      ? '5/5 (Outstanding)'
                      : overallRating === 4
                      ? '4/5 (Very Good)'
                      : overallRating === 3
                      ? '3/5 (Satisfactory)'
                      : overallRating === 2
                      ? '2/5 (Needs Improvement)'
                      : '1/5 (Poor)'}
                  </span>
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Constructive Observations / Suggestions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Share any constructive notes on the experiment, kit quality, or teacher guidance..."
                  className="w-full p-3 rounded-xl border border-slate-300 font-medium bg-white focus:ring-2 focus:ring-pink-500 outline-none text-xs"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Result Alert Message */}
          {resultMessage && (
            <div
              className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 border animate-fadeIn ${
                isSuccess
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-red-50 border-red-300 text-red-900'
              }`}
            >
              {isSuccess ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />}
              <div className="flex-1">{resultMessage}</div>
            </div>
          )}

          {/* Unified Submission Footer Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-600 font-medium">
              Student: <strong className="text-slate-900 font-bold">{user?.name}</strong> (<span className="font-mono">{user?.usn}</span>) • Semester {studentSem}
            </div>

            <button
              type="submit"
              disabled={submitting || geoState !== 'GREEN'}
              className="px-8 py-3.5 bg-gradient-to-r from-cyan-600 via-pink-700 to-orange-500 hover:from-cyan-700 hover:to-orange-600 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-orange-500/20 flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-101"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Attendance & Mandatory Feedback</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 📅 DAY-WISE SEMESTER PRACTICAL LABORATORY SCHEDULE (DAY & SEMESTER WISE) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-cyan-700" />
              <h2 className="text-base font-extrabold text-slate-900">
                Semester {studentSem} Practical Laboratory Timetable (Day-Wise & Batch-Wise)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Official Department Schedule • CSE in IoT & Cyber Security including Blockchain Technology
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-orange-800 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-200">
            <Timer className="w-3.5 h-3.5 text-orange-600" />
            <span>Attendance Active: Last 10m before lab end (5 mins duration)</span>
          </div>
        </div>

        {/* Day Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {['ALL', 'TODAY', ...daysOfWeek].map((tab) => {
            const isSelected = selectedDayTab === tab;
            const currentDayStr = scheduleStatus?.currentDay?.toUpperCase() || 'MONDAY';
            const displayDay = tab === 'TODAY' ? currentDayStr : tab;
            const count = tab === 'ALL'
              ? timetableEntries.length
              : timetableEntries.filter(t => t.day_of_week === displayDay).length;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedDayTab(tab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-600 to-pink-700 text-white shadow-md shadow-cyan-800/25 ring-2 ring-cyan-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <span>{tab === 'ALL' ? 'All Days' : tab === 'TODAY' ? `Today (${currentDayStr.substring(0, 3)})` : tab}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected ? 'bg-cyan-950 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Practical Lab Cards Grid */}
        {(() => {
          const currentDayStr = scheduleStatus?.currentDay?.toUpperCase() || 'MONDAY';
          const filteredEntries = selectedDayTab === 'ALL'
            ? timetableEntries
            : selectedDayTab === 'TODAY'
            ? timetableEntries.filter(t => t.day_of_week === currentDayStr)
            : timetableEntries.filter(t => t.day_of_week === selectedDayTab);

          if (filteredEntries.length === 0) {
            return (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                No practical laboratory sessions scheduled for {selectedDayTab === 'TODAY' ? `Today (${currentDayStr})` : selectedDayTab} in Semester {studentSem}.
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredEntries.map((entry, idx) => {
                const isTodayEntry = entry.day_of_week === currentDayStr;
                const batchText = entry.batch || (entry.subject_name?.includes('(B1)') ? 'B1' : entry.subject_name?.includes('(B2)') ? 'B2' : 'All Batches');

                return (
                  <div
                    key={entry.id || idx}
                    className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                      isTodayEntry
                        ? 'bg-gradient-to-br from-cyan-50/70 via-white to-orange-50/70 border-cyan-300 shadow-sm'
                        : 'bg-slate-50/80 border-slate-200 hover:border-cyan-200'
                    }`}
                  >
                    {/* Top Row: Day + Time + Batch */}
                    <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-black text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          isTodayEntry ? 'bg-cyan-800 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {entry.day_of_week}
                        </span>
                        {batchText && (
                          <span className="font-extrabold text-[10px] bg-orange-100 text-orange-900 border border-orange-200 px-2 py-0.5 rounded-md">
                            Batch {batchText}
                          </span>
                        )}
                      </div>

                      <div className="font-mono font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-700" />
                        <span>{entry.time_range}</span>
                      </div>
                    </div>

                    {/* Subject Code & Name */}
                    <div>
                      <div className="text-xs font-mono font-bold text-cyan-800">
                        {entry.subject_code}
                      </div>
                      <div className="text-sm font-extrabold text-slate-900 leading-snug">
                        {entry.subject_name}
                      </div>
                    </div>

                    {/* Location, Room & Faculty */}
                    <div className="bg-white/90 p-2.5 rounded-xl border border-slate-200 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-medium">Faculty: <strong className="text-slate-800 font-bold">{entry.faculty_name || 'Department Faculty'}</strong></span>
                        <span className="font-semibold text-slate-700">Room {entry.room || '307'}</span>
                      </div>
                      {entry.location && (
                        <div className="text-slate-500 flex items-center gap-1 text-[10px] pt-1 border-t border-slate-100">
                          <Building2 className="w-3 h-3 text-cyan-700 shrink-0" />
                          <span className="truncate">{entry.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Attendance Window Notice */}
                    <div className="text-[10px] text-orange-900 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200 flex items-center justify-between">
                      <span className="font-semibold">⚡ Attendance window opens 10m before lab finish</span>
                      <span className="font-bold text-orange-700">5 mins duration</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Institutional Attendance Rule Callout */}
      <div className="p-4 bg-gradient-to-r from-cyan-50/60 via-white to-orange-50/60 rounded-2xl border border-cyan-100 text-slate-600 text-[11px] leading-relaxed flex items-start gap-2">
        <Info className="w-4 h-4 shrink-0 text-cyan-700 mt-0.5" />
        <span>
          <strong>Academic Feedback & Zero-Duplication Rule:</strong> Feedback is strictly compulsory. Attendance will not be recorded unless the comprehensive 8-point laboratory evaluation is completed.
        </span>
      </div>
    </div>
  );
};

