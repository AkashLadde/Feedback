import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { X, CheckCircle2, AlertTriangle, XCircle, ShieldAlert, Play, ArrowRight, Info } from 'lucide-react';

export const DemoScenarioRunner: React.FC = () => {
  const { demoModalOpen, setDemoModalOpen, triggerRefresh } = useAuth();
  const [running, setRunning] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [activeScenario, setActiveScenario] = useState<string>('SCENARIO_B');

  if (!demoModalOpen) return null;

  const scenarios = [
    {
      id: 'SCENARIO_A',
      title: 'Scenario A: Genuine In-Lab Submission',
      student: 'Rahul Verma (1RV23CY001)',
      desc: 'Student checks into VAPT Lab Exp 7, sits inside 50m geofence, scans fresh dynamic QR, and submits feedback.',
      expected: 'VERIFIED',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600'
    },
    {
      id: 'SCENARIO_B',
      title: 'Scenario B: Remote Proxy Feedback (The Classic Scam)',
      student: 'Pooja Kulkarni (1RV23CY002)',
      desc: 'Student missed laboratory class, but classmate took a photo of the QR code and sent it on WhatsApp. Student attempts feedback submission remotely without any attendance record.',
      expected: 'SUSPICIOUS (ATTENDANCE_MISSING)',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: AlertTriangle,
      iconColor: 'text-amber-600'
    },
    {
      id: 'SCENARIO_C',
      title: 'Scenario C: Expired Dynamic QR Token',
      student: 'Amit Shah (1RV23CY003)',
      desc: 'Student attended lab, but attempts feedback using an expired QR token (expired > 45 seconds ago or screenshot from previous batch).',
      expected: 'INVALID (EXPIRED_QR)',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      icon: XCircle,
      iconColor: 'text-rose-600'
    },
    {
      id: 'SCENARIO_D',
      title: 'Scenario D: Outside Permitted Geofence',
      student: 'Sneha Reddy (1RV23CY004)',
      desc: 'Student checked in earlier, but left the lab and attempted feedback submission from the campus cafeteria (420m away from VAPT Lab center).',
      expected: 'INVALID (OUTSIDE_GEOFENCE)',
      badgeColor: 'bg-red-100 text-red-800 border-red-300',
      icon: ShieldAlert,
      iconColor: 'text-red-600'
    }
  ];

  const handleRun = async (scId: string) => {
    try {
      setRunning(scId);
      setResult(null);
      const res = await api.runDemoScenario(scId as any);
      setResult(res);
      triggerRefresh();
    } catch (err: any) {
      setResult({ success: false, error: err.message || 'Execution failed' });
    } finally {
      setRunning(null);
    }
  };

  const currentScenarioObj = scenarios.find(s => s.id === activeScenario)!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-cyan-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 via-cyan-500 to-orange-500 text-white px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm text-white flex items-center justify-center font-bold">
              ⚡
            </div>
            <div>
              <h2 className="text-lg font-bold">LabGuard Verification Engine Demonstration Suite</h2>
              <p className="text-xs text-white/80">Simulate Section 40 fraud detection workflows with live backend evaluation</p>
            </div>
          </div>
          <button
            onClick={() => setDemoModalOpen(false)}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Scenario Selectors */}
          <div className="md:col-span-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Test Scenario</h3>
            <div className="space-y-2">
              {scenarios.map((sc) => {
                const isSelected = activeScenario === sc.id;
                const Icon = sc.icon;
                return (
                  <button
                    key={sc.id}
                    onClick={() => {
                      setActiveScenario(sc.id);
                      setResult(null);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-cyan-50 border-cyan-400 shadow-sm ring-1 ring-cyan-300'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${sc.iconColor}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900">{sc.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{sc.student}</div>
                        <span className={`inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded border ${sc.badgeColor}`}>
                          Target: {sc.expected}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Execution & Inspection */}
          <div className="md:col-span-7 bg-cyan-50/30 rounded-xl p-5 border border-cyan-100 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{currentScenarioObj.title}</h4>
                  <div className="text-xs text-cyan-700 font-medium mt-0.5">{currentScenarioObj.student}</div>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded border ${currentScenarioObj.badgeColor}`}>
                  {currentScenarioObj.expected}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-cyan-100 text-xs text-slate-700 leading-relaxed shadow-sm">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900 mb-1">
                  <Info className="w-4 h-4 text-cyan-600" />
                  <span>Scenario Description</span>
                </div>
                {currentScenarioObj.desc}
              </div>

              {/* Execution Action */}
              <button
                onClick={() => handleRun(currentScenarioObj.id)}
                disabled={running !== null}
                className="w-full bg-gradient-to-r from-cyan-500 to-orange-500 hover:from-cyan-600 hover:to-orange-600 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 transition-all disabled:opacity-50"
              >
                {running === currentScenarioObj.id ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Evaluating Verification Engine...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Trigger Live Backend Test</span>
                  </>
                )}
              </button>

              {/* Result Output Display */}
              {result && (
                <div className="mt-3 p-4 bg-white rounded-xl border border-cyan-100 shadow-sm animate-fadeIn">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">Verification Result:</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded border ${
                        result.result?.status === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : result.result?.status === 'SUSPICIOUS'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-red-100 text-red-800 border-red-300'
                      }`}
                    >
                      {result.result?.status || 'ERROR'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 font-medium mb-2">
                    {result.result?.message}
                  </div>

                  {result.result?.flags?.length > 0 && (
                    <div className="mb-2">
                      <div className="text-[11px] font-semibold text-slate-500 mb-1">Violated Security Rules:</div>
                      <div className="flex flex-wrap gap-1">
                        {result.result.flags.map((f: string) => (
                          <span key={f} className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-mono px-2 py-0.5 rounded">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.result?.reasons?.length > 0 && (
                    <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-100">
                      <strong>Audit Reason:</strong> {result.result.reasons[0]}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span>Runs against live database</span>
              <button
                onClick={() => setDemoModalOpen(false)}
                className="text-cyan-600 hover:text-cyan-800 font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
