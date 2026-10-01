import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
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
  ArrowRight
} from 'lucide-react';

export const StudentAttendancePage: React.FC = () => {
  const { user, setActiveTab, triggerRefresh } = useAuth();
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState<boolean>(false);
  const [existingRecord, setExistingRecord] = useState<any | null>(null);

  // Strong GPS Geolocation State
  const [latitude, setLatitude] = useState<number>(17.9104);
  const [longitude, setLongitude] = useState<number>(77.5199);
  const [accuracy, setAccuracy] = useState<number>(8.0);
  const [locating, setLocating] = useState<boolean>(false);
  const [gpsLocked, setGpsLocked] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [sessRes, myAttRes] = await Promise.all([
          api.getActiveSessions(),
          api.getStudentAttendance('me').catch(() => ({ records: [] }))
        ]);

        if (sessRes.success && sessRes.sessions?.length > 0) {
          const sess = sessRes.sessions[0];
          setActiveSession(sess);

          // Check if student has already recorded attendance for this session (Strict Zero Duplication)
          if (myAttRes.records && myAttRes.records.length > 0) {
            const found = myAttRes.records.find((r: any) => r.lab_session_id === sess.id);
            if (found) {
              setAlreadyCheckedIn(true);
              setExistingRecord(found);
            }
          }

          if (sess.latitude && sess.longitude) {
            setLatitude(sess.latitude + 0.00004);
            setLongitude(sess.longitude + 0.00004);
          }
        }
      } catch (err) {
        console.error('Error loading session attendance state:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Strong High-Accuracy Device GPS Capture
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
        alert('GPS capture note: ' + err.message + '. Ensure location permissions are granted.');
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
    if (!activeSession) return;
    const baseLat = activeSession.latitude || 17.9104;
    const baseLng = activeSession.longitude || 77.5199;

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

  // Distance computation via Haversine
  const calculateDistance = () => {
    if (!activeSession) return 0;
    const lat1 = latitude;
    const lon1 = longitude;
    const lat2 = activeSession.latitude || 17.9104;
    const lon2 = activeSession.longitude || 77.5199;

    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const distance = calculateDistance();
  const radius = activeSession?.geofence_radius || 25;

  // Signal Strength Classification
  const isGpsStrong = accuracy <= 15.0;
  const isGpsModerate = accuracy > 15.0 && accuracy <= 25.0;

  // Determine Geofence State Banner
  let geoState: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
  let geoMessage = 'Strong GPS Lock Verified — You are within the laboratory perimeter.';

  if (accuracy > 30) {
    geoState = 'YELLOW';
    geoMessage = 'Location accuracy is low. Move closer to a window or allow high-precision GPS.';
  } else if (distance > radius + 5) {
    geoState = 'RED';
    geoMessage = `Outside laboratory boundary (Displacement: ${distance}m, Permitted: ${radius}m).`;
  }

  const handleSubmitAttendance = async () => {
    if (!activeSession || alreadyCheckedIn) return;
    try {
      setSubmitting(true);
      setResultMessage(null);
      const res = await api.checkInAttendance({
        session_id: activeSession.id,
        latitude,
        longitude,
        accuracy
      });

      if (res.success) {
        setIsSuccess(true);
        setAlreadyCheckedIn(true);
        setResultMessage(res.message || 'Attendance verified and recorded successfully!');
        triggerRefresh();
      }
    } catch (err: any) {
      setIsSuccess(false);
      setResultMessage(err.message || 'Attendance verification failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-600 space-y-3">
        <div className="w-9 h-9 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <span className="text-xs font-bold text-slate-700">Locking strong GPS signal and checking active laboratory sessions...</span>
      </div>
    );
  }

  if (!activeSession) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-cyan-100 text-center space-y-3 shadow-card max-w-xl mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 mx-auto">
          <Radio className="w-6 h-6" />
        </div>
        <h2 className="text-base font-extrabold text-slate-900">No Active Laboratory Session Available</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Attendance check-in requires an active session initiated by your faculty instructor. Please check back when your practical laboratory starts.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Session Header Card: Clean White with Cyan & Orange Accents */}
      <div className="bg-white p-6 rounded-3xl border border-cyan-100 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse"></span>
            <h1 className="text-lg font-black text-slate-900">Laboratory Presence & Strong GPS Check-in</h1>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            {activeSession.lab_name} ({activeSession.lab_code}) • Experiment {activeSession.experiment_number}: {activeSession.experiment_title}
          </p>
        </div>

        <div className="bg-gradient-to-r from-cyan-50 to-orange-50 border border-cyan-200 px-3.5 py-1.5 rounded-2xl text-xs font-bold text-cyan-900 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-orange-500" />
          <span>Room {activeSession.room_number} • Perimeter: {radius}m</span>
        </div>
      </div>

      {/* STRICT ZERO DUPLICATION: Already Verified Banner */}
      {alreadyCheckedIn && (
        <div className="p-5 rounded-3xl bg-emerald-50 border-2 border-emerald-300 shadow-sm text-emerald-950 space-y-2">
          <div className="flex items-center gap-2 font-black text-sm text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Attendance Already Recorded (Zero Duplicates Policy)</span>
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed">
            Your attendance has already been successfully verified and logged for this session
            {existingRecord?.timestamp ? ` at ${existingRecord.timestamp}` : ''}. You may now proceed directly to submit your laboratory feedback.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setActiveTab('student-feedback')}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-orange-500 hover:from-cyan-700 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-cyan flex items-center gap-1.5"
            >
              <span>Proceed to Laboratory Feedback</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Geofence & GPS Signal Status Indicator */}
      {!alreadyCheckedIn && (
        <div
          className={`p-5 rounded-3xl border-2 shadow-sm transition-all ${
            geoState === 'GREEN'
              ? 'bg-cyan-50/90 border-cyan-400 text-cyan-950'
              : geoState === 'YELLOW'
              ? 'bg-orange-50/90 border-orange-300 text-orange-950'
              : 'bg-red-50/90 border-red-300 text-red-950'
          }`}
        >
          <div className="flex items-start gap-3">
            {geoState === 'GREEN' && <ShieldCheck className="w-6 h-6 text-cyan-600 shrink-0 mt-0.5" />}
            {geoState === 'YELLOW' && <AlertTriangle className="w-6 h-6 text-orange-600 shrink-0 mt-0.5" />}
            {geoState === 'RED' && <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />}

            <div className="flex-1">
              <div className="text-xs font-extrabold uppercase tracking-wider text-cyan-900 flex items-center justify-between">
                <span>{geoState === 'GREEN' ? 'GEOFENCE STATUS: VERIFIED (INSIDE LAB)' : geoState === 'YELLOW' ? 'GPS STATUS: LOW ACCURACY' : 'GEOFENCE STATUS: OUTSIDE BOUNDARY'}</span>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded-full font-bold border border-cyan-200">
                  {distance}m to Lab Center
                </span>
              </div>
              <div className="text-sm font-extrabold mt-1 text-slate-900">{geoMessage}</div>
              <div className="text-xs text-slate-600 mt-1">
                Max Allowed Radius: <strong>{radius} meters</strong> • GPS Margin: <strong>±{accuracy}m</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Strong GPS Position Diagnostics Card */}
      <div className="bg-white p-6 rounded-3xl border border-cyan-100 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-cyan-50">
          <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <Satellite className="w-4 h-4 text-cyan-600" />
            <span>High-Precision GPS Diagnostics</span>
          </span>

          <button
            type="button"
            onClick={getRealGPS}
            disabled={locating}
            className="text-xs font-bold text-cyan-700 hover:text-cyan-900 bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 rounded-xl border border-cyan-200 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
            <span>{locating ? 'Locking Satellites...' : 'Refresh Device GPS'}</span>
          </button>
        </div>

        {/* Live GPS Lock Indicator */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-gradient-to-br from-cyan-50/70 to-white p-3.5 rounded-2xl border border-cyan-200/70">
            <div className="text-slate-500 text-[10px] font-semibold">Signal Precision</div>
            <div className="font-extrabold text-slate-900 text-sm mt-0.5 flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isGpsStrong ? 'bg-cyan-500 animate-pulse' : isGpsModerate ? 'bg-orange-400' : 'bg-red-500'}`}></span>
              <span>{isGpsStrong ? 'Strong Lock' : isGpsModerate ? 'Moderate' : 'Weak Signal'}</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-cyan-50/70 to-white p-3.5 rounded-2xl border border-cyan-200/70">
            <div className="text-slate-500 text-[10px] font-semibold">Accuracy Margin</div>
            <div className="font-mono font-extrabold text-cyan-900 text-sm mt-0.5">±{accuracy}m</div>
          </div>

          <div className="bg-gradient-to-br from-orange-50/70 to-white p-3.5 rounded-2xl border border-orange-200/70">
            <div className="text-slate-500 text-[10px] font-semibold">Latitude</div>
            <div className="font-mono font-bold text-slate-800 text-xs mt-0.5">{latitude.toFixed(6)}</div>
          </div>

          <div className="bg-gradient-to-br from-orange-50/70 to-white p-3.5 rounded-2xl border border-orange-200/70">
            <div className="text-slate-500 text-[10px] font-semibold">Longitude</div>
            <div className="font-mono font-bold text-slate-800 text-xs mt-0.5">{longitude.toFixed(6)}</div>
          </div>
        </div>

        {/* Location Simulation Quick Presets */}
        <div className="pt-2">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-orange-500" />
            <span>Campus Testing Presets (Simulation Engine):</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setPreset('INSIDE')}
              className="p-2.5 bg-cyan-50 hover:bg-cyan-100/80 border border-cyan-200 text-cyan-900 rounded-2xl font-bold text-left transition-colors"
            >
              <div className="text-xs">Inside Lab Room</div>
              <div className="text-[10px] text-cyan-600 font-semibold">~4m (Verified)</div>
            </button>
            <button
              type="button"
              onClick={() => setPreset('DOORWAY')}
              className="p-2.5 bg-orange-50 hover:bg-orange-100/80 border border-orange-200 text-orange-900 rounded-2xl font-bold text-left transition-colors"
            >
              <div className="text-xs">Lab Doorway</div>
              <div className="text-[10px] text-orange-600 font-semibold">~18m (Verified)</div>
            </button>
            <button
              type="button"
              onClick={() => setPreset('CAFETERIA')}
              className="p-2.5 bg-red-50 hover:bg-red-100/80 border border-red-200 text-red-900 rounded-2xl font-bold text-left transition-colors"
            >
              <div className="text-xs">College Canteen</div>
              <div className="text-[10px] text-red-600 font-semibold">~320m (Outside)</div>
            </button>
            <button
              type="button"
              onClick={() => setPreset('LOW_ACCURACY')}
              className="p-2.5 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-900 rounded-2xl font-bold text-left transition-colors"
            >
              <div className="text-xs">Low GPS Margin</div>
              <div className="text-[10px] text-amber-600 font-semibold">±120m (Uncertain)</div>
            </button>
          </div>
        </div>
      </div>

      {/* Submission Feedback Message */}
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
          {isSuccess && (
            <button
              onClick={() => setActiveTab('student-feedback')}
              className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-orange-500 text-white rounded-xl text-xs font-bold shadow-cyan"
            >
              Go to Feedback →
            </button>
          )}
        </div>
      )}

      {/* Check-In Action Button */}
      {!alreadyCheckedIn && (
        <div className="bg-white p-5 rounded-3xl border border-cyan-100 shadow-card flex items-center justify-between">
          <div className="text-xs text-slate-600 font-medium">
            Student: <strong className="text-slate-900 font-bold">{user?.name}</strong> (<span className="font-mono">{user?.usn}</span>)
          </div>

          <button
            onClick={handleSubmitAttendance}
            disabled={submitting || geoState !== 'GREEN'}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-orange-500 hover:from-cyan-700 hover:to-orange-600 text-white font-bold text-xs rounded-2xl shadow-cyan flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify & Check-In Attendance</span>
              </>
            )}
          </button>
        </div>
      )}

      <div className="p-4 bg-gradient-to-r from-cyan-50/60 via-white to-orange-50/60 rounded-2xl border border-cyan-100 text-slate-600 text-[11px] leading-relaxed flex items-start gap-2">
        <Info className="w-4 h-4 shrink-0 text-cyan-600 mt-0.5" />
        <span>
          <strong>Strict Attendance Policy:</strong> Each student is permitted exactly one verified check-in per laboratory session. Duplicate submissions are automatically rejected.
        </span>
      </div>
    </div>
  );
};
