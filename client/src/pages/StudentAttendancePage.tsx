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
  Radio
} from 'lucide-react';

export const StudentAttendancePage: React.FC = () => {
  const { user, setActiveTab, triggerRefresh } = useAuth();
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Geolocation state
  const [latitude, setLatitude] = useState<number>(12.971598);
  const [longitude, setLongitude] = useState<number>(77.594562);
  const [accuracy, setAccuracy] = useState<number>(12.0);
  const [locating, setLocating] = useState<boolean>(false);

  useEffect(() => {
    async function loadSession() {
      try {
        setLoading(true);
        const res = await api.getActiveSessions();
        if (res.success && res.sessions?.length > 0) {
          const sess = res.sessions[0];
          setActiveSession(sess);
          if (sess.latitude && sess.longitude) {
            // Default to slightly jittered coordinates near the lab center
            setLatitude(sess.latitude + 0.00008);
            setLongitude(sess.longitude + 0.00008);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, []);

  const getRealGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setAccuracy(pos.coords.accuracy);
        setLocating(false);
      },
      (err) => {
        alert('GPS retrieval error: ' + err.message + '. You may use the campus simulator presets.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Preset location simulations for demo evaluation
  const setPreset = (type: 'INSIDE' | 'DOORWAY' | 'CAFETERIA' | 'LOW_ACCURACY') => {
    if (!activeSession) return;
    const baseLat = activeSession.latitude || 12.971598;
    const baseLng = activeSession.longitude || 77.594562;

    if (type === 'INSIDE') {
      setLatitude(baseLat + 0.00008);
      setLongitude(baseLng + 0.00008);
      setAccuracy(10.0);
    } else if (type === 'DOORWAY') {
      setLatitude(baseLat + 0.00035);
      setLongitude(baseLng + 0.00030);
      setAccuracy(15.0);
    } else if (type === 'CAFETERIA') {
      setLatitude(baseLat + 0.0038);
      setLongitude(baseLng + 0.0035);
      setAccuracy(20.0);
    } else if (type === 'LOW_ACCURACY') {
      setLatitude(baseLat);
      setLongitude(baseLng);
      setAccuracy(140.0);
    }
    setResultMessage(null);
  };

  // Distance computation
  const calculateDistance = () => {
    if (!activeSession) return 0;
    const lat1 = latitude;
    const lon1 = longitude;
    const lat2 = activeSession.latitude || 12.971598;
    const lon2 = activeSession.longitude || 77.594562;

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
  const radius = activeSession?.geofence_radius || 50;

  // Determine Geofence State Banner
  let geoState: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
  let geoMessage = 'Location verified — You are inside the laboratory area.';

  if (accuracy > 100) {
    geoState = 'YELLOW';
    geoMessage = 'Location accuracy is low. Please move to an open area and retry.';
  } else if (distance > radius + 5) {
    geoState = 'RED';
    geoMessage = `You are outside the permitted laboratory area. (Distance: ${distance}m, Permitted: ${radius}m)`;
  }

  const handleSubmitAttendance = async () => {
    if (!activeSession) return;
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
      <div className="p-8 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <span>Checking active laboratory sessions & geofence perimeter...</span>
      </div>
    );
  }

  if (!activeSession) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
        <Radio className="w-10 h-10 mx-auto text-slate-400" />
        <h2 className="text-base font-bold text-slate-900">No Active Laboratory Session Available</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Attendance check-in can only be recorded during an active lab session started by your faculty instructor.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Session Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
            <h1 className="text-lg font-bold text-slate-900">Laboratory Presence & Geofence Check-in</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {activeSession.lab_name} ({activeSession.lab_code}) • Experiment {activeSession.experiment_number}: {activeSession.experiment_title}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-blue-800">
          Room {activeSession.room_number} • Radius: {radius}m
        </div>
      </div>

      {/* Geofence Verification Status Indicator (GREEN / YELLOW / RED) */}
      <div
        className={`p-5 rounded-2xl border-2 shadow-sm transition-all ${
          geoState === 'GREEN'
            ? 'bg-emerald-50/90 border-emerald-400 text-emerald-900'
            : geoState === 'YELLOW'
            ? 'bg-amber-50/90 border-amber-400 text-amber-900'
            : 'bg-red-50/90 border-red-400 text-red-900'
        }`}
      >
        <div className="flex items-start gap-3">
          {geoState === 'GREEN' && <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />}
          {geoState === 'YELLOW' && <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />}
          {geoState === 'RED' && <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />}

          <div className="flex-1">
            <div className="text-xs font-bold uppercase tracking-wider">
              {geoState === 'GREEN' ? 'GEOFENCE STATUS: VERIFIED (INSIDE)' : geoState === 'YELLOW' ? 'GEOFENCE STATUS: LOW ACCURACY' : 'GEOFENCE STATUS: RESTRICTED (OUTSIDE)'}
            </div>
            <div className="text-sm font-extrabold mt-1">{geoMessage}</div>
            <div className="text-xs opacity-80 mt-1">
              Displacement: <strong>{distance} meters</strong> from lab center (Permitted boundary: ≤ {radius}m)
            </div>
          </div>
        </div>
      </div>

      {/* Coordinate & Accuracy Details */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-blue-600" />
            <span>Position Diagnostics</span>
          </span>

          <button
            type="button"
            onClick={getRealGPS}
            disabled={locating}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${locating ? 'animate-spin' : ''}`} />
            <span>Get Live Device GPS</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="text-slate-400 text-[10px]">Your Latitude</div>
            <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">{latitude.toFixed(6)}</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="text-slate-400 text-[10px]">Your Longitude</div>
            <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">{longitude.toFixed(6)}</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="text-slate-400 text-[10px]">Accuracy Margin</div>
            <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">±{accuracy}m</div>
          </div>
        </div>

        {/* Demo Simulator Presets */}
        <div className="pt-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Campus Location Presets (Quick Demonstration Simulator):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setPreset('INSIDE')}
              className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl font-semibold text-left transition-colors"
            >
              <div className="text-xs">Inside Lab</div>
              <div className="text-[10px] text-emerald-600">~12m away (Green)</div>
            </button>
            <button
              type="button"
              onClick={() => setPreset('DOORWAY')}
              className="p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 rounded-xl font-semibold text-left transition-colors"
            >
              <div className="text-xs">Lab Doorway</div>
              <div className="text-[10px] text-blue-600">~45m away (Green)</div>
            </button>
            <button
              type="button"
              onClick={() => setPreset('CAFETERIA')}
              className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 rounded-xl font-semibold text-left transition-colors"
            >
              <div className="text-xs">Campus Canteen</div>
              <div className="text-[10px] text-red-600">~420m away (Red)</div>
            </button>
            <button
              type="button"
              onClick={() => setPreset('LOW_ACCURACY')}
              className="p-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl font-semibold text-left transition-colors"
            >
              <div className="text-xs">Low GPS Signal</div>
              <div className="text-[10px] text-amber-600">±140m margin (Yellow)</div>
            </button>
          </div>
        </div>
      </div>

      {/* Submission Feedback Message */}
      {resultMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border animate-fadeIn ${
            isSuccess
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-red-50 border-red-300 text-red-800'
          }`}
        >
          {isSuccess ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <div className="flex-1">{resultMessage}</div>
          {isSuccess && (
            <button
              onClick={() => setActiveTab('student-feedback')}
              className="px-3 py-1 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800"
            >
              Proceed to Feedback →
            </button>
          )}
        </div>
      )}

      {/* Check-In Action Button */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Logged in as <strong>{user?.name}</strong> ({user?.usn})
        </div>

        <button
          onClick={handleSubmitAttendance}
          disabled={submitting || geoState !== 'GREEN'}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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

      <div className="p-4 bg-slate-100 rounded-xl text-slate-500 text-[11px] leading-relaxed flex items-start gap-2">
        <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
        <span>
          <strong>Privacy Note:</strong> Your geolocation is evaluated strictly at the instant of attendance marking to confirm physical presence inside the laboratory room. No continuous GPS tracking occurs.
        </span>
      </div>
    </div>
  );
};
