import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  FileSpreadsheet,
  Download,
  Filter,
  CheckCircle,
  XCircle,
  FileText,
  Printer,
  Layers,
  Building2,
  Calendar,
  Users,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Search,
  RefreshCw,
  Eye,
  Star,
  X,
  Lock
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [activeReport, setActiveReport] = useState<'attendance' | 'verification' | 'matrix'>('attendance');
  const [selectedSemester, setSelectedSemester] = useState<string>('3'); // Default to 3rd semester!
  const [selectedLabId, setSelectedLabId] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const [records, setRecords] = useState<any[]>([]);
  const [allLabs, setAllLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [detailRecord, setDetailRecord] = useState<any | null>(null);

  // Fetch all laboratories initially

  const fetchLabs = async () => {
    try {
      const res = await api.getLabs();
      if (res.success) {
        setAllLabs(res.labs || []);
      }
    } catch (err) {
      console.error('Failed to load labs:', err);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  // Filter laboratories for the dropdown based on selected semester
  const availableLabs = allLabs.filter((lab) => {
    if (selectedSemester === 'ALL') return true;
    return String(lab.semester) === String(selectedSemester);
  });

  // Whenever selected semester changes, reset selected lab if it does not belong to the semester
  useEffect(() => {
    if (selectedLabId !== 'ALL') {
      const exists = availableLabs.some((l) => String(l.id) === String(selectedLabId));
      if (!exists) {
        setSelectedLabId('ALL');
      }
    }
  }, [selectedSemester, allLabs]);

  // Fetch report data based on semester, lab, and report type
  const fetchReport = async () => {
    try {
      setLoading(true);
      if (activeReport === 'attendance') {
        const res = await api.getAttendanceReport({
          semester: selectedSemester !== 'ALL' ? selectedSemester : undefined,
          lab_id: selectedLabId !== 'ALL' ? selectedLabId : undefined
        });
        if (res.success) setRecords(res.records || []);
      } else if (activeReport === 'verification' || activeReport === 'matrix') {
        const res = await api.getVerificationReport({
          semester: selectedSemester !== 'ALL' ? selectedSemester : undefined,
          lab_id: selectedLabId !== 'ALL' ? selectedLabId : undefined
        });
        if (res.success) setRecords(res.records || []);
      }
    } catch (err) {
      console.error('Failed to fetch report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport, selectedSemester, selectedLabId]);

  const handleDownloadCsv = () => {
    const reportType = activeReport === 'matrix' ? 'verification' : activeReport;
    const url = `/api/reports/${reportType}?format=csv&semester=${selectedSemester}&lab_id=${selectedLabId}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter records by search text
  const filteredRecords = records.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.student_name?.toLowerCase().includes(s) ||
      r.usn?.toLowerCase().includes(s) ||
      r.lab_name?.toLowerCase().includes(s) ||
      r.lab_code?.toLowerCase().includes(s)
    );
  });

  // KPI Calculations
  const totalAttendance = activeReport === 'attendance' ? records.length : records.filter(r => r.attendance_id).length;
  const totalFeedback = activeReport === 'attendance' ? 0 : records.length;
  const verifiedCount = records.filter(r => r.verification_status === 'VERIFIED').length;
  const mismatchCount = records.filter(r => r.verification_status === 'SUSPICIOUS' || r.verification_status === 'INVALID' || r.verification_status === 'MISMATCH').length;

  const semesterOptions = [
    { value: 'ALL', label: 'All Semesters' },
    { value: '1', label: '1st Semester' },
    { value: '2', label: '2nd Semester' },
    { value: '3', label: '3rd Semester' },
    { value: '4', label: '4th Semester' },
    { value: '5', label: '5th Semester' },
    { value: '6', label: '6th Semester' },
    { value: '7', label: '7th Semester' },
    { value: '8', label: '8th Semester' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Semester & Laboratory Attendance & Feedback Reports
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Department of IoT and Cybersecurity Including Blockchain Technology • Semester-wise & Lab-wise verification analytics & audit exports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReport}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Refresh Report Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleDownloadCsv}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Filtered CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* Semester Filter Tabs (Explicitly supporting 3rd semester filtering!) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>1. Select Semester:</span>
          </div>

          <div className="text-xs">
            {selectedSemester === 'ALL' ? (
              <span className="text-slate-500 font-medium">Viewing all semesters</span>
            ) : (
              <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                Filtered strictly to: <strong>Semester {selectedSemester}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Semester Buttons / Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {semesterOptions.map((opt) => {
            const isSelected = selectedSemester === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setSelectedSemester(opt.value)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Lab & Section Filter Dropdowns */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Laboratory Dropdown (strictly filtered to selected semester!) */}
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600 font-semibold">2. Choose Laboratory:</span>
              <select
                value={selectedLabId}
                onChange={(e) => setSelectedLabId(e.target.value)}
                className="p-2 rounded-xl border border-slate-300 font-bold bg-white text-slate-800 text-xs min-w-[220px]"
              >
                <option value="ALL">
                  {selectedSemester !== 'ALL' ? `All Laboratories in Semester ${selectedSemester}` : 'All Laboratories'}
                </option>
                {availableLabs.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search box */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search student USN, name, or lab..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* KPI Summary Cards for Selected Scope */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
          <div className="text-[11px] font-semibold text-slate-500">Filtered Semester</div>
          <div className="text-xl font-extrabold text-blue-700 mt-1">
            {selectedSemester !== 'ALL' ? `Semester ${selectedSemester}` : 'All Semesters'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {availableLabs.length} Laboratories in scope
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
          <div className="text-[11px] font-semibold text-slate-500">Attendance Logged</div>
          <div className="text-xl font-extrabold text-slate-900 mt-1">
            {totalAttendance}
            <span className="text-xs font-normal text-slate-500 ml-1">students</span>
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Physical Geofence Verified</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
          <div className="text-[11px] font-semibold text-slate-500">Feedback Submissions</div>
          <div className="text-xl font-extrabold text-slate-900 mt-1">
            {totalFeedback > 0 ? totalFeedback : records.length}
            <span className="text-xs font-normal text-slate-500 ml-1">logged</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {verifiedCount} Verified Genuine
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
          <div className="text-[11px] font-semibold text-slate-500">Mismatches / Proxy Flags</div>
          <div className={`text-xl font-extrabold mt-1 ${mismatchCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {mismatchCount}
            <span className="text-xs font-normal text-slate-500 ml-1">issues</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {mismatchCount === 0 ? '✅ 100% Genuine Submissions' : '⚠️ Requires Admin Review'}
          </div>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl shadow-subtle">
        {[
          { id: 'attendance', label: '1. Laboratory Attendance Records (Semester & Lab-Wise)' },
          { id: 'verification', label: '2. Student Feedback Submissions (Semester & Lab-Wise)' },
          { id: 'matrix', label: '3. Attendance vs Feedback Cross-Correlation' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id as any)}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all ${
              activeReport === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reports Table View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <span>Compiling semester-wise & laboratory-wise records...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">
              No Records Found for {selectedSemester !== 'ALL' ? `Semester ${selectedSemester}` : 'the Selected Criteria'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              There are currently no attendance or feedback records logged for this semester and laboratory selection.
            </p>
          </div>
        ) : (
          <>
            {/* View Mode 1: Attendance Records */}
            {activeReport === 'attendance' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-3">Student USN & Name</th>
                      <th className="py-3 px-3">Semester & Sec</th>
                      <th className="py-3 px-3">Laboratory</th>
                      <th className="py-3 px-3">Experiment #</th>
                      <th className="py-3 px-3">Geofence Status</th>
                      <th className="py-3 px-3">Displacement</th>
                      <th className="py-3 px-3 text-right">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                          {new Date(r.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{r.student_name}</div>
                          <div className="font-mono text-[11px] text-blue-700">{r.usn}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Semester {r.semester}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-800 font-medium">
                          <div>{r.lab_name}</div>
                          <div className="text-[10px] font-mono text-slate-400">{r.lab_code}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          Exp {r.experiment_number}: {r.experiment_title?.slice(0, 24)}...
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            r.geofence_status === 'INSIDE'
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                              : 'text-red-700 bg-red-50 border-red-200'
                          }`}>
                            {r.geofence_status}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                          {r.distance_to_lab}m away
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded text-[11px]">
                            {r.verification_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* View Mode 2: Feedback Records */}
            {activeReport === 'verification' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Feedback ID</th>
                      <th className="py-3 px-3">Student USN & Name</th>
                      <th className="py-3 px-3">Semester</th>
                      <th className="py-3 px-3">Laboratory & Faculty</th>
                      <th className="py-3 px-3">Lab Quality & Conduct</th>
                      <th className="py-3 px-3 text-center">Attendance Match</th>
                      <th className="py-3 px-3">Distance</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-blue-700">
                          #FB-{r.id}
                          <div className="text-[10px] font-normal text-slate-400">
                            {new Date(r.submitted_at).toLocaleTimeString()}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{r.student_name}</div>
                          <div className="text-[11px] font-mono text-blue-700 font-semibold">{r.usn}</div>
                        </td>

                        <td className="py-3 px-3 font-bold text-slate-700">
                          Semester {r.semester}
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-800">{r.lab_name}</div>
                          <div className="text-[10px] font-mono text-slate-400">
                            Exp {r.experiment_number} • Faculty: <span className="font-semibold text-slate-600">{r.faculty_name || 'Assigned Faculty'}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-[11px] space-y-1">
                          <div className="flex items-center gap-1.5">
                            <div className="flex text-amber-400">
                              {[...Array(r.overall_rating || 5)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                              ))}
                            </div>
                            <span className="font-bold text-slate-700">({r.overall_rating || 5}/5)</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                              r.hands_on?.includes('Yes') || r.hands_on?.includes('performed')
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              Hands-on: {r.hands_on?.slice(0, 16)}...
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                              r.teaching_basics?.includes('Thoroughly') || r.teaching_basics === 'Excellent' || r.teaching_basics === 'Good'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              Basics: {r.teaching_basics?.slice(0, 14)}...
                            </span>
                          </div>
                          {r.comments && (
                            <div className="text-slate-500 italic max-w-xs truncate text-[10px]">
                              "{r.comments}"
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {r.attendance_id ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              PRESENT (MATCHED)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 animate-pulse">
                              MISSING ATTENDANCE
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 font-mono font-semibold">
                          <span className={r.distance_to_lab > 50 ? 'text-red-600 font-bold' : 'text-slate-800'}>
                            {r.distance_to_lab}m
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            r.verification_status === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.verification_status === 'SUSPICIOUS'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {r.verification_status}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setDetailRecord(r)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1 font-semibold text-[11px]"
                            title="Inspect Complete Student Responses"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Audit</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}


            {/* View Mode 3: Matrix Correlation View */}
            {activeReport === 'matrix' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Student USN & Name</th>
                      <th className="py-3 px-3">Semester</th>
                      <th className="py-3 px-3">Laboratory</th>
                      <th className="py-3 px-3 text-center">Step 1: Attendance Check-in</th>
                      <th className="py-3 px-3 text-center">Step 2: Dynamic QR Feedback</th>
                      <th className="py-3 px-3 text-center">Reconciliation Status</th>
                      <th className="py-3 px-3 text-right">System Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.map((r) => {
                      const hasAttendance = !!r.attendance_id;
                      const hasFeedback = true;
                      const isGenuine = hasAttendance && r.verification_status === 'VERIFIED';

                      return (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{r.student_name}</div>
                            <div className="font-mono text-blue-700">{r.usn}</div>
                          </td>

                          <td className="py-3 px-3 font-semibold text-slate-700">
                            Sem {r.semester}
                          </td>

                          <td className="py-3 px-3 font-medium text-slate-800">
                            {r.lab_name}
                          </td>

                          <td className="py-3 px-3 text-center">
                            {hasAttendance ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <CheckCircle className="w-3 h-3" />
                                <span>Checked in ({r.distance_to_lab}m)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                <XCircle className="w-3 h-3" />
                                <span>Not in Lab</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              <CheckCircle className="w-3 h-3" />
                              <span>Submitted (#FB-{r.id})</span>
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center">
                            {isGenuine ? (
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded">
                                ✅ GENUINE IN-LAB PARTICIPATION
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded">
                                ⚠️ PROXY / MISMATCH FLAGGED
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right">
                            <span className="text-[10px] font-mono text-slate-500">
                              {r.flags || 'AUDITED'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Inspection Modal for Complete Student Feedback */}
      {detailRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  Comprehensive Lab Audit Details
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Feedback Submission #FB-{detailRecord.id}
                </h3>
              </div>
              <button
                onClick={() => setDetailRecord(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Student & Session Information */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Student</span>
                  <strong className="text-slate-800">{detailRecord.student_name}</strong>
                  <div className="font-mono text-blue-600">{detailRecord.usn}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Class</span>
                  <strong className="text-slate-800">Semester {detailRecord.semester}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Laboratory</span>
                  <strong className="text-slate-800">{detailRecord.lab_name}</strong>
                  <div className="text-slate-500">Exp #{detailRecord.experiment_number}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Faculty In Charge</span>
                  <strong className="text-slate-800">{detailRecord.faculty_name || 'Assigned Faculty'}</strong>
                </div>
              </div>

              {/* Overall Rating Banner */}
              <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <div>
                  <span className="text-xs font-bold text-amber-900">Student's Overall Session Rating</span>
                  <div className="text-xl font-extrabold text-amber-950 mt-0.5">
                    {detailRecord.overall_rating || 5} / 5 Stars
                  </div>
                </div>
                <div className="flex text-amber-400">
                  {[...Array(detailRecord.overall_rating || 5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>

              {/* Student's Exact Responses to the Dimensions */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Detailed Responses on Teacher Lab Conduct
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-500 text-[11px] block">1. Lab Basics & Theory Taught by Teacher:</span>
                    <strong className="text-slate-900 text-xs mt-0.5 block">{detailRecord.teaching_basics || 'N/A'}</strong>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-500 text-[11px] block">2. Hands-on Experimentation Done:</span>
                    <strong className="text-slate-900 text-xs mt-0.5 block">{detailRecord.hands_on || 'N/A'}</strong>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-500 text-[11px] block">3. Teacher In-Lab Guidance & Presence:</span>
                    <strong className="text-slate-900 text-xs mt-0.5 block">{detailRecord.teacher_guidance || 'N/A'}</strong>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-500 text-[11px] block">4. Doubt Clearance Cooperation:</span>
                    <strong className="text-slate-900 text-xs mt-0.5 block">{detailRecord.doubt_support || 'N/A'}</strong>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-500 text-[11px] block">5. Student Understood Reason & Working of Experiment:</span>
                    <strong className="text-slate-900 text-xs mt-0.5 block">{detailRecord.reason_understanding || detailRecord.understanding || 'N/A'}</strong>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-500 text-[11px] block">6. Viva Voce Conducted by Faculty:</span>
                    <strong className="text-slate-900 text-xs mt-0.5 block">{detailRecord.viva_taken || detailRecord.viva || 'N/A'}</strong>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-500 text-[11px] block">7. Hardware / Software Setup Condition:</span>
                    <strong className="text-slate-900 text-xs mt-0.5 block">{detailRecord.hardware_setup || 'Complete working setup'}</strong>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-500 text-[11px] block">8. Lab Duration & Session Punctuality:</span>
                    <strong className="text-slate-900 text-xs mt-0.5 block">{detailRecord.lab_punctuality || 'Full scheduled duration'}</strong>
                  </div>

                  {detailRecord.comments && (
                    <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                      <span className="text-amber-800 text-[11px] font-bold block">Student Confidential Grievance / Observation:</span>
                      <p className="text-amber-950 text-xs mt-1 italic leading-relaxed">
                        "{detailRecord.comments}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Physical Security Verification Details */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Security Handshake Diagnostics
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>Geofence Displacement: <strong>{detailRecord.distance_to_lab} meters</strong></div>
                  <div>Physical Attendance: <strong>{detailRecord.attendance_id ? 'VERIFIED MATCH' : 'NOT FOUND'}</strong></div>
                  <div>Submitted At: <strong>{new Date(detailRecord.submitted_at).toLocaleString()}</strong></div>
                  <div>Final Status: <strong className="text-blue-700">{detailRecord.verification_status}</strong></div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setDetailRecord(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Close Audit Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

