import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { X, ShieldCheck, AlertCircle, CheckCircle, XCircle, Clock, MapPin, QrCode, FileText } from 'lucide-react';

interface Props {
  feedbackId: number | null;
  onClose: () => void;
  onResolved: () => void;
}

export const VerificationDetailModal: React.FC<Props> = ({ feedbackId, onClose, onResolved }) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!feedbackId) return;
    async function load() {
      try {
        setLoading(true);
        const res = await api.getVerificationDetail(feedbackId!);
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [feedbackId]);

  if (!feedbackId) return null;

  const handleResolve = async (decision: 'VERIFIED' | 'INVALID' | 'SUSPICIOUS') => {
    try {
      setResolving(true);
      await api.resolveVerification(feedbackId, { decision, notes });
      onResolved();
      onClose();
    } catch (err: any) {
      alert('Resolution failed: ' + err.message);
    } finally {
      setResolving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2.5 py-1 rounded text-xs">VERIFIED</span>;
      case 'SUSPICIOUS':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 font-bold px-2.5 py-1 rounded text-xs">SUSPICIOUS</span>;
      case 'MISMATCH':
        return <span className="bg-purple-100 text-purple-800 border border-purple-300 font-bold px-2.5 py-1 rounded text-xs">MISMATCH</span>;
      case 'INVALID':
        return <span className="bg-red-100 text-red-800 border border-red-300 font-bold px-2.5 py-1 rounded text-xs">INVALID</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 border border-slate-300 font-bold px-2.5 py-1 rounded text-xs">PENDING REVIEW</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Verification Investigation & Audit Inspector</h2>
              <p className="text-xs text-slate-400">Comparing Physical Attendance Check-in with Feedback Submission</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading || !data ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <span>Loading verification audit details...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Top Bar with Student & Session */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Student Record</div>
                <div className="text-base font-bold text-slate-900">{data.feedback.student_name} ({data.feedback.usn})</div>
                <div className="text-xs text-slate-500">
                  Semester {data.feedback.semester} • {data.feedback.email}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Laboratory & Experiment</div>
                <div className="text-base font-bold text-slate-900">{data.feedback.lab_name} ({data.feedback.lab_code})</div>
                <div className="text-xs text-slate-500">
                  Exp {data.feedback.experiment_number}: {data.feedback.experiment_title}
                </div>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Status</div>
                {getStatusBadge(data.feedback.verification_status)}
              </div>
            </div>

            {/* Side-by-side comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Attendance Check-in Record */}
              <div className="bg-white rounded-xl border-2 border-slate-200 p-4">
                <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-200 text-slate-900 font-bold text-sm">
                  <CheckCircle className={`w-4 h-4 ${data.attendance ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>Physical Attendance Check-in</span>
                  {data.attendance ? (
                    <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">PRESENT</span>
                  ) : (
                    <span className="ml-auto text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded">MISSING</span>
                  )}
                </div>

                {data.attendance ? (
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Check-in Time:</span>
                      <span className="font-semibold text-slate-800">{new Date(data.attendance.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Distance to Lab:</span>
                      <span className="font-semibold text-slate-800">{data.attendance.distance_to_lab} meters</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">GPS Accuracy Margin:</span>
                      <span className="font-semibold text-slate-800">±{data.attendance.accuracy}m</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Geofence Status:</span>
                      <span className="font-bold text-emerald-700">{data.attendance.geofence_status}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 truncate">
                      Coords: {data.attendance.latitude.toFixed(6)}, {data.attendance.longitude.toFixed(6)}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-red-600 bg-red-50 rounded-lg">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                    <div className="font-bold">No Attendance Record Found</div>
                    <div className="text-[11px] text-red-700 mt-1">
                      Student did not register presence in the laboratory for this session.
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Feedback Submission Record */}
              <div className="bg-white rounded-xl border-2 border-slate-200 p-4">
                <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-200 text-slate-900 font-bold text-sm">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Feedback Submission Data</span>
                  <span className="ml-auto text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                    {data.feedback.verification_status}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Submitted Time:</span>
                    <span className="font-semibold text-slate-800">{new Date(data.feedback.submitted_at).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Distance to Lab:</span>
                    <span className={`font-bold ${data.feedback.distance_to_lab > 50 ? 'text-red-600' : 'text-slate-800'}`}>
                      {data.feedback.distance_to_lab} meters {data.feedback.distance_to_lab > 50 && '(Outside Geofence)'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Teaching Basics:</span>
                    <span className="font-semibold text-slate-800">{data.feedback.teaching_basics}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Hands-on Practice / Viva:</span>
                    <span className="font-semibold text-slate-800">{data.feedback.hands_on} / {data.feedback.viva}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Understanding Level:</span>
                    <span className="font-semibold text-slate-800">{data.feedback.understanding}</span>
                  </div>
                  {data.feedback.comments && (
                    <div className="bg-slate-50 p-2 rounded text-[11px] text-slate-600 italic">
                      "{data.feedback.comments}"
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Triggered Security Rules */}
            {data.events?.length > 0 && (
              <div className="bg-red-50/70 border border-red-200 rounded-xl p-4">
                <div className="text-xs font-bold text-red-900 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span>Triggered Security Engine Rules ({data.events.length})</span>
                </div>
                <div className="space-y-2">
                  {data.events.map((ev: any) => (
                    <div key={ev.id} className="bg-white p-2.5 rounded-lg border border-red-200 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-red-700">{ev.rule_code}</span>
                        <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded">
                          SEVERITY: {ev.severity}
                        </span>
                      </div>
                      <div className="text-slate-700">{ev.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Resolution Action */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Manual Administrative Review Decision
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter investigation notes, faculty remarks, or review justification..."
                className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              ></textarea>
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  onClick={() => handleResolve('VERIFIED')}
                  disabled={resolving}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                >
                  Approve as Genuine
                </button>
                <button
                  onClick={() => handleResolve('SUSPICIOUS')}
                  disabled={resolving}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                >
                  Flag as Suspicious
                </button>
                <button
                  onClick={() => handleResolve('INVALID')}
                  disabled={resolving}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                >
                  Reject & Mark Invalid
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
