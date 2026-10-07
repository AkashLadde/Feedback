import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Download,
  Filter,
  Layers,
  Calendar,
  Building2,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';

export const AdminAttendancePage: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState<{ total: number; present: number; absent: number; late: number }>({
    total: 0,
    present: 0,
    absent: 0,
    late: 0
  });

  const [selectedSem, setSelectedSem] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.getAllAttendance({
        semester: selectedSem,
        date: selectedDate || undefined,
        search: search || undefined
      });
      if (res.success) {
        setRecords(res.records || []);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Error fetching attendance records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedSem, selectedDate]);

  const handleExportCSV = () => {
    if (records.length === 0) {
      alert('No attendance records available to export.');
      return;
    }

    let csv = 'Attendance ID,Date,Time Slot,Semester,Subject Code,Subject Name,Teacher,Student USN,Student Name,Status,Remarks,Mode\n';
    for (const r of records) {
      csv += `"${r.id}","${r.session_date || ''}","${r.time_slot || ''}","${r.semester || ''}","${r.lab_code || ''}","${r.lab_name || ''}","${r.teacher_name || ''}","${r.usn || ''}","${r.student_name || ''}","${r.verification_status || ''}","${(r.remarks || '').replace(/"/g, '""')}","${r.attendance_mode || 'ROSTER'}"\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `GNDEC_Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const presentPercentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 100;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-700"></span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Classroom & Laboratory Attendance Records
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Department oversight of attendance marked by faculty across 3rd, 5th, and 7th Semesters
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAttendance}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
            title="Refresh Attendance Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-gradient-to-r from-pink-800 to-pink-700 hover:from-pink-900 hover:to-pink-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-pink-900/20 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Users className="w-4 h-4 text-pink-700" />
            <span>Total Attendance Marks</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-1">Across 3rd, 5th, 7th Sem</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-subtle">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Present Count</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-950">{stats.present}</div>
          <div className="text-[11px] text-emerald-700 mt-1 font-bold">{presentPercentage}% Attendance Rate</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-subtle">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-800 mb-1">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>Absent Count</span>
          </div>
          <div className="text-2xl font-extrabold text-rose-950">{stats.absent}</div>
          <div className="text-[11px] text-rose-700 mt-1">Verified Absentees</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-pink-200 bg-pink-50/20 shadow-subtle">
          <div className="flex items-center gap-2 text-xs font-semibold text-pink-900 mb-1">
            <Clock className="w-4 h-4 text-pink-700" />
            <span>Late Check-ins</span>
          </div>
          <div className="text-2xl font-extrabold text-pink-950">{stats.late}</div>
          <div className="text-[11px] text-pink-800 mt-1">Arrived Post-Threshold</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Semester Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {['ALL', '3', '5', '7'].map(sem => (
              <button
                key={sem}
                onClick={() => setSelectedSem(sem)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  selectedSem === sem
                    ? 'bg-pink-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sem === 'ALL' ? 'All Semesters' : `Sem ${sem}`}
              </button>
            ))}
          </div>

          {/* Date Picker */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="text-xs text-rose-600 font-semibold hover:underline"
            >
              Clear Date
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search USN, student, subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchAttendance()}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-pink-600 bg-white"
          />
        </div>
      </div>

      {/* Table Records */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-3 border-pink-700 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <span className="text-xs font-bold">Loading department attendance records...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-bold">No attendance records found for current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">USN</th>
                  <th className="p-3.5">Semester</th>
                  <th className="p-3.5">Subject & Teacher</th>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => {
                  const isPresent = r.verification_status === 'PRESENT';
                  const isAbsent = r.verification_status === 'ABSENT';
                  const isLate = r.verification_status === 'LATE';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">
                        {r.student_name}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] font-bold text-slate-700">
                        {r.usn}
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-800">Semester {r.semester}</span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{r.lab_name}</div>
                        <div className="text-[11px] text-slate-400">
                          {r.lab_code} • {r.teacher_name || 'Faculty Instructor'}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <div>{r.session_date || r.timestamp?.split(' ')[0]}</div>
                        <div className="text-[10px] text-slate-400">{r.time_slot || 'Regular Slot'}</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          isPresent
                            ? 'bg-emerald-100 text-emerald-800'
                            : isAbsent
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isPresent && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {isAbsent && <XCircle className="w-3 h-3 text-rose-600" />}
                          {isLate && <Clock className="w-3 h-3 text-amber-600" />}
                          <span>{r.verification_status}</span>
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 text-[11px] max-w-xs truncate">
                        {r.remarks || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
