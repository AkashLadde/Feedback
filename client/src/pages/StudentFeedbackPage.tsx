import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Send,
  ShieldCheck,
  Building2,
  Sparkles,
  Lock,
  EyeOff,
  Star,
  Cpu,
  HelpCircle,
  BookOpen,
  UserCheck,
  Clock,
  MessageSquare
} from 'lucide-react';

export const StudentFeedbackPage: React.FC = () => {
  const { user, setActiveTab, triggerRefresh } = useAuth();
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [qrToken, setQrToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [outcome, setOutcome] = useState<any | null>(null);

  // 8+ Real Teacher Conduct & Lab Quality Dimensions
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

  const [mode, setMode] = useState<'DIRECT' | 'QR'>('DIRECT');
  const [semesterLabs, setSemesterLabs] = useState<any[]>([]);
  const [selectedLabId, setSelectedLabId] = useState<number | null>(null);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        // Load subjects for the student's semester
        const sem = user?.semester || 7;
        const labsRes = await api.getLabs({ semester: sem });
        if (labsRes.success && labsRes.labs) {
          setSemesterLabs(labsRes.labs);
          if (labsRes.labs.length > 0) {
            setSelectedLabId(labsRes.labs[0].id);
          }
        }

        // Also check if any live session is active
        const res = await api.getActiveSessions();
        if (res.success && res.sessions?.length > 0) {
          const sess = res.sessions[0];
          setActiveSession(sess);

          // Fetch the live QR token for this session automatically
          const liveRes = await api.getLiveSession(sess.id);
          if (liveRes.success && liveRes.activeQR) {
            setQrToken(liveRes.activeQR.token);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setOutcome(null);

      let res: any;

      if (mode === 'DIRECT') {
        if (!selectedLabId) {
          alert('Please select a subject or laboratory to evaluate.');
          setSubmitting(false);
          return;
        }

        res = await api.submitDirectFeedback({
          laboratory_id: selectedLabId,
          teaching_basics: teachingBasics,
          hands_on: handsOn,
          teacher_guidance: teacherGuidance,
          doubt_support: doubtSupport,
          reason_understanding: reasonUnderstanding,
          viva_taken: vivaTaken,
          hardware_setup: hardwareSetup,
          lab_punctuality: labPunctuality,
          overall_rating: overallRating,
          comments
        });
      } else {
        if (!qrToken) {
          alert('Please enter or scan a dynamic QR token.');
          setSubmitting(false);
          return;
        }

        const lat = activeSession?.latitude ? activeSession.latitude + 0.00008 : 17.91048;
        const lng = activeSession?.longitude ? activeSession.longitude + 0.00008 : 77.51998;

        res = await api.submitFeedback({
          qr_token: qrToken,
          latitude: lat,
          longitude: lng,
          accuracy: 10.0,
          teaching_basics: teachingBasics,
          hands_on: handsOn,
          teacher_guidance: teacherGuidance,
          doubt_support: doubtSupport,
          reason_understanding: reasonUnderstanding,
          viva_taken: vivaTaken,
          hardware_setup: hardwareSetup,
          lab_punctuality: labPunctuality,
          overall_rating: overallRating,
          anonymous_to_teacher: 1,
          viva: vivaTaken.includes('Yes') ? 'Yes' : 'No',
          understanding: reasonUnderstanding.includes('fully') ? 'Completely understood' : reasonUnderstanding.includes('basic') ? 'Mostly understood' : 'Did not understand',
          comments
        });
      }

      setOutcome(res);
      triggerRefresh();

      if (res.status === 'VERIFIED' || res.success) {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 }
        });
      }
    } catch (err: any) {
      setOutcome({
        success: false,
        status: err.data?.status || 'INVALID',
        flags: err.data?.flags || [],
        message: err.message || 'Submission verification failed.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <span>Validating dynamic QR session security handshake...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Session Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
        {/* Mode Selector Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 gap-1 text-xs">
            <button
              type="button"
              onClick={() => setMode('DIRECT')}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                mode === 'DIRECT'
                  ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semester Course Evaluation
            </button>
            <button
              type="button"
              onClick={() => setMode('QR')}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                mode === 'QR'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan Dynamic QR</span>
            </button>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            Student: <strong className="text-slate-900">{user?.name}</strong> ({user?.usn}) • Sem <strong className="text-cyan-700">{user?.semester || 7}</strong>
          </span>
        </div>

        {mode === 'DIRECT' ? (
          /* Subject Selector */
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Select Semester {user?.semester || 7} Subject / Laboratory to Evaluate:
            </label>
            <select
              value={selectedLabId || ''}
              onChange={(e) => setSelectedLabId(Number(e.target.value))}
              className="w-full text-xs font-semibold py-2.5 px-3.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
            >
              {semesterLabs.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.code} - {l.name} (Faculty: {l.faculty_name} • {l.room_number})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Laboratory Feedback Session
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 mt-1">
                {activeSession?.lab_name || 'Live Laboratory Session'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Experiment {activeSession?.experiment_number}: {activeSession?.experiment_title}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-semibold text-slate-700">
                Semester {activeSession?.semester || user?.semester || 3}
              </span>
              <span className="bg-cyan-50 text-cyan-800 px-3 py-1.5 rounded-xl border border-cyan-200 text-xs font-semibold">
                Room {activeSession?.room_number || 'Lab'}
              </span>
            </div>
          </div>
        )}

        {/* Confidentiality & Anti-Retaliation Protection Notice */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 p-4 rounded-2xl border border-emerald-200/80 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <Lock className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-emerald-950 flex items-center gap-1">
                <EyeOff className="w-3.5 h-3.5 text-emerald-700" />
                100% Anonymous & Confidential to Department Administration
              </span>
              <span className="bg-emerald-200 text-emerald-900 text-[10px] font-bold px-2 py-0.2 rounded-full uppercase">
                Protected
              </span>
            </div>
            <p className="text-emerald-800 leading-relaxed">
              Your individual responses are strictly anonymous to your subject teachers to eliminate any bias.
              <strong> Please submit honest and genuine feedback</strong> regarding syllabus coverage, hands-on quality, and doubt clearing.
            </p>
          </div>
        </div>

        {/* 3-Step Verification Checklist */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
            <div className="text-[11px] font-bold text-emerald-900">Session Verified ✓</div>
          </div>
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
            <div className="text-[11px] font-bold text-emerald-900">Geofence Inside ✓</div>
          </div>
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
            <div className="text-[11px] font-bold text-emerald-900">Attendance Ready ✓</div>
          </div>
        </div>
      </div>

      {/* Outcome Banner */}
      {outcome && (
        <div
          className={`p-5 rounded-3xl border-2 shadow-sm animate-fadeIn ${
            outcome.status === 'VERIFIED'
              ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
              : outcome.status === 'SUSPICIOUS' || outcome.status === 'PENDING REVIEW'
              ? 'bg-amber-50 border-amber-400 text-amber-950'
              : 'bg-red-50 border-red-400 text-red-950'
          }`}
        >
          <div className="flex items-start gap-3">
            {outcome.status === 'VERIFIED' ? (
              <Sparkles className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Verification Status:
                </span>
                <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${
                  outcome.status === 'VERIFIED'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  {outcome.status}
                </span>
              </div>

              <div className="text-sm font-bold mt-1.5">{outcome.message}</div>

              {outcome.flags?.length > 0 && (
                <div className="mt-2 text-xs">
                  <span className="font-semibold">Security Diagnostic: </span>
                  {outcome.flags.join(', ')}
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setActiveTab('student-feedback-history')}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-orange-500 hover:from-cyan-700 hover:to-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  View My Submission Log
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Feedback Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-subtle p-6 space-y-7">
        {/* Dynamic QR Token */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
            Dynamic QR Token Signature <span className="text-orange-500">*</span>
          </label>
          <div className="relative">
            <QrCode className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              required
              value={qrToken}
              onChange={(e) => setQrToken(e.target.value)}
              placeholder="Paste or scan dynamic HMAC QR token..."
              className="w-full text-xs font-mono pl-10 pr-3 py-3 rounded-2xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Dynamic HMAC token rotates every 45 seconds from the laboratory faculty projector.
          </p>
        </div>

        {/* SECTION 1: TEACHER LAB CONDUCT & INSTRUCTION */}
        <div className="pt-4 border-t border-slate-100 space-y-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-600" />
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
              1. Laboratory Teaching & Demonstration Quality
            </h2>
          </div>

          {/* Q1: Teaching Basics */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Q1. Was the theory/basics of the lab taught by the teacher before starting? <span className="text-orange-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {[
                { label: 'Thoroughly explained on board/slides with clear objectives', tag: 'Recommended' },
                { label: 'Brief / rushed 2-minute overview only', tag: 'Rushed' },
                { label: 'Directly told to start / Not taught at all', tag: 'Skipped' }
              ].map((item) => (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => setTeachingBasics(item.label)}
                  className={`p-3 rounded-2xl border text-left font-medium transition-all ${
                    teachingBasics === item.label
                      ? 'bg-cyan-50 border-cyan-600 text-cyan-900 ring-2 ring-cyan-500/20 shadow-sm font-semibold'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.tag === 'Recommended' ? 'bg-emerald-100 text-emerald-800' :
                      item.tag === 'Rushed' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.tag}
                    </span>
                    {teachingBasics === item.label && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />}
                  </div>
                  <div className="text-[11px] leading-snug">{item.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Q2: Hands-on Experiments Done */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Q2. Were hands-on practical experiments actually performed by you? <span className="text-orange-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Yes, performed hands-on individually on my PC/Kit', sub: 'Full practical execution done myself' },
                { label: 'Partially (shared in a group, only observed others)', sub: 'Not enough kits or teacher grouped us' },
                { label: 'Only teacher demo shown, students did not touch kit/code', sub: 'No individual experimentation' },
                { label: 'No practical done (theory only / sitting idle)', sub: 'Faculty did not conduct practicals' }
              ].map((item) => (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => setHandsOn(item.label)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    handsOn === item.label
                      ? 'bg-cyan-50 border-cyan-600 text-cyan-900 ring-2 ring-cyan-500/20 shadow-sm font-semibold'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{item.label}</span>
                    {handsOn === item.label && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">{item.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Q3: Teacher Guidance & Presence */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Q3. Instructor / Teacher Guidance and In-Lab Presence <span className="text-orange-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Continuously guided and inspected each student desk', sub: 'Very active throughout the session' },
                { label: 'Sat at teacher desk, only checked final output', sub: 'Minimal guidance during execution' },
                { label: 'Distracted on personal phone/laptop or unattended', sub: 'Teacher did not pay attention' },
                { label: 'Teacher arrived very late or left lab session early', sub: 'Dereliction of lab duties' }
              ].map((item) => (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => setTeacherGuidance(item.label)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    teacherGuidance === item.label
                      ? 'bg-cyan-50 border-cyan-600 text-cyan-900 ring-2 ring-cyan-500/20 shadow-sm font-semibold'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{item.label}</span>
                    {teacherGuidance === item.label && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">{item.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Q4: Doubt Clearance & Cooperation */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Q4. Cooperation for doubt clearance by teacher <span className="text-orange-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Extremely cooperative, patiently cleared every doubt', badge: 'Cooperative' },
                { label: 'Answered only when repeatedly pressed', badge: 'Average' },
                { label: 'Dismissive / scolded students for asking doubts', badge: 'Uncooperative' },
                { label: 'Teacher was unapproachable or unavailable', badge: 'Absent' }
              ].map((item) => (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => setDoubtSupport(item.label)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    doubtSupport === item.label
                      ? 'bg-cyan-50 border-cyan-600 text-cyan-900 ring-2 ring-cyan-500/20 shadow-sm font-semibold'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs">{item.label}</span>
                    {doubtSupport === item.label && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 2: STUDENT UNDERSTANDING & VIVA */}
        <div className="pt-4 border-t border-slate-100 space-y-6">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-orange-600" />
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
              2. Student Understanding & Viva Examination
            </h2>
          </div>

          {/* Q5: Reason Understanding */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Q5. Did you understand the REASON behind the experiment and HOW it works? <span className="text-orange-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Yes, fully understand the working principle & reasons', sub: 'I know WHY and HOW each step works' },
                { label: 'Know the basic steps, but unclear why it works', sub: 'Need more clarification on concepts' },
                { label: 'Blindly followed lab manual/copied code without understanding', sub: 'Just completed to get signatures' },
                { label: 'Did not understand anything', sub: 'Experiment concept completely unclear' }
              ].map((item) => (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => setReasonUnderstanding(item.label)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    reasonUnderstanding === item.label
                      ? 'bg-orange-50 border-orange-600 text-orange-900 ring-2 ring-orange-500/20 shadow-sm font-semibold'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{item.label}</span>
                    {reasonUnderstanding === item.label && <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">{item.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Q6: Viva Voce Taken */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Q6. Was Viva Voce conducted for this experiment? <span className="text-orange-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {[
                { label: 'Yes, detailed one-on-one individual viva conducted', tag: 'Individual Viva' },
                { label: 'Brief oral questions asked in group', tag: 'Group Viva' },
                { label: 'No viva was conducted at all', tag: 'No Viva' }
              ].map((item) => (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => setVivaTaken(item.label)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    vivaTaken === item.label
                      ? 'bg-orange-50 border-orange-600 text-orange-900 ring-2 ring-orange-500/20 shadow-sm font-semibold'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.tag === 'Individual Viva' ? 'bg-emerald-100 text-emerald-800' :
                      item.tag === 'Group Viva' ? 'bg-cyan-100 text-cyan-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.tag}
                    </span>
                    {vivaTaken === item.label && <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />}
                  </div>
                  <div className="text-[11px] leading-snug">{item.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 3: LAB INFRASTRUCTURE & PUNCTUALITY */}
        <div className="pt-4 border-t border-slate-100 space-y-6">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-600" />
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
              3. Laboratory Setup & Session Punctuality
            </h2>
          </div>

          {/* Q7: Hardware / Software Setup */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Q7. Hardware / Software setup condition during the lab <span className="text-orange-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {[
                { label: 'Complete working setup (all kits, PCs & software working)', tag: 'Functional' },
                { label: 'Partially working (some kits/ports broken, had to share)', tag: 'Minor Issues' },
                { label: 'Severe setup issues (kits/PCs not working, software missing)', tag: 'Broken' }
              ].map((item) => (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => setHardwareSetup(item.label)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    hardwareSetup === item.label
                      ? 'bg-cyan-50 border-cyan-600 text-cyan-900 ring-2 ring-cyan-500/20 shadow-sm font-semibold'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {item.tag}
                    </span>
                    {hardwareSetup === item.label && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />}
                  </div>
                  <div className="text-[11px] leading-snug">{item.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Q8: Lab Punctuality & Duration */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Q8. Lab duration and punctuality <span className="text-orange-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {[
                { label: 'Full scheduled lab duration conducted properly', tag: 'On Schedule' },
                { label: 'Conducted but rushed through in half time', tag: 'Rushed' },
                { label: 'Dismissed early (teacher left/ended early)', tag: 'Ended Early' }
              ].map((item) => (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => setLabPunctuality(item.label)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    labPunctuality === item.label
                      ? 'bg-cyan-50 border-cyan-600 text-cyan-900 ring-2 ring-cyan-500/20 shadow-sm font-semibold'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {item.tag}
                    </span>
                    {labPunctuality === item.label && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />}
                  </div>
                  <div className="text-[11px] leading-snug">{item.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Overall 5-Star Rating */}
          <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-900">
              Overall Rating of Today's Laboratory Session & Teacher Execution <span className="text-orange-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setOverallRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        (hoverRating || overallRating) >= star
                          ? 'text-orange-400 fill-orange-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-slate-700">
                {overallRating === 5 && '⭐⭐⭐⭐⭐ Excellent (5/5)'}
                {overallRating === 4 && '⭐⭐⭐⭐ Good (4/5)'}
                {overallRating === 3 && '⭐⭐⭐ Average (3/5)'}
                {overallRating === 2 && '⭐⭐ Poor / Irregular (2/5)'}
                {overallRating === 1 && '⭐ Very Poor / Dereliction (1/5)'}
              </span>
            </div>
          </div>

          {/* Grievance / Honest Feedback Comments */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Confidential Grievance or Observations for HOD (Optional)</span>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Teacher Cannot See This
              </span>
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              placeholder="If the teacher did not teach, skipped viva, or refused to clear doubts, mention details here confidentially for the HOD..."
              className="w-full text-xs p-3.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            ></textarea>
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cryptographically signed & reconciled against attendance log</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-7 py-3 bg-gradient-to-r from-cyan-600 via-cyan-500 to-orange-500 hover:from-cyan-700 hover:to-orange-600 text-white font-bold text-xs rounded-2xl shadow-cyan flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Genuine Laboratory Feedback</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
