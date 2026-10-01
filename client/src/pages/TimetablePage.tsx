import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, Printer, FlaskConical, MapPin, UserCheck, ShieldCheck, Lock } from 'lucide-react';

interface LabLegend {
  code: string;
  name: string;
  abbr: string;
  legend: string;
  room: string;
}

export const TimetablePage: React.FC = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';
  const studentSem = user?.semester || 1;

  // If student, lock activeSem strictly to their own semester. If admin, allow switching between semesters.
  const [activeSem, setActiveSem] = useState<number>(isStudent ? studentSem : 7);

  useEffect(() => {
    if (isStudent) {
      setActiveSem(studentSem);
    }
  }, [user, isStudent, studentSem]);

  // 1st Semester Practical Laboratories
  const sem1Legends: LabLegend[] = [
    { code: '1BPOPS103', name: 'Principles of Programming using C Lab', abbr: 'C PROG LAB', legend: 'Prof. Mahesh Kanjikar', room: 'C Programming Lab (Room 105)' },
    { code: '1BCSL107', name: 'Computer Aided Engineering Drawing Lab', abbr: 'CAED LAB', legend: 'Prof. Aarti Pawar', room: 'CAED Lab (Room 106)' },
    { code: '1BPHY102', name: 'Applied Engineering Physics Laboratory', abbr: 'PHY LAB', legend: 'Dr. Pandit Patil', room: 'Physics Lab (Room 107)' },
    { code: '1BENG106', name: 'Professional Communication & Language Lab', abbr: 'LANG LAB', legend: 'Prof. Farhanaz', room: 'Language Lab (Room 108)' }
  ];

  // 3rd Semester Practical Laboratories
  const sem3Legends: LabLegend[] = [
    { code: '1BCS302(P)', name: 'Object Oriented Programming with JAVA LAB', abbr: 'JAVA LAB', legend: 'Prof. Mahesh Kanjikar', room: 'Java Lab (Room 205)' },
    { code: '1BCS304(P)', name: 'Operating Systems LAB', abbr: 'OS LAB', legend: 'Prof. Aarti Pawar', room: 'OS Lab (Room 206)' },
    { code: '1BCSL306', name: 'Data Structures Laboratory', abbr: 'DS LAB', legend: 'Prof. Aarti Pawar', room: 'Data Structures Lab (Room 207)' },
    { code: '1BCSL307A', name: 'Project Management with GIT Lab', abbr: 'GIT LAB', legend: 'Prof. Farhanaz & Mr. Anand Patil', room: 'Project Lab (Room 208)' },
    { code: '1BCP308', name: 'Community Project Laboratory', abbr: 'CP LAB', legend: 'Mr. Anand Patil', room: 'Project Center (Room 209)' }
  ];

  // 5th Semester Practical Laboratories
  const sem5Legends: LabLegend[] = [
    { code: 'BCSL502', name: 'Computer Networks Laboratory', abbr: 'CN LAB', legend: 'Prof. Madhuri Joshi', room: 'Networks Lab (Room 305)' },
    { code: 'BICL504', name: 'IoT & Cyber Security Laboratory', abbr: 'IOT/CYBER LAB', legend: 'Prof. Uzma Kausar & Prof. Farhanaz', room: 'IoT & Cyber Lab (Room 306)' },
    { code: 'BIC515CL', name: 'Full Stack Development Laboratory', abbr: 'FSD LAB', legend: 'Prof. Ibtesham Zarrine', room: 'Web Tech Lab (Room 307)' },
    { code: 'BIC586', name: 'Mini Project Laboratory', abbr: 'MINI PROJECT', legend: 'Dr. Harish Joshi (HOD)', room: 'Project Center (Room 308)' }
  ];

  // 7th Semester Practical Laboratories
  const sem7Legends: LabLegend[] = [
    { code: 'BCO701(P)', name: 'IoT Communication Protocols Laboratory', abbr: 'ICP LAB', legend: 'Prof. Farhanaz', room: 'Protocols Lab (Room 405)' },
    { code: 'BIC702(P)', name: 'Blockchain Technology Laboratory', abbr: 'BC LAB', legend: 'Prof. Ashok Bawge', room: 'Blockchain Lab (Room 406)' },
    { code: 'BIC786', name: 'Major Project Phase-II Laboratory', abbr: 'PROJ LAB-II', legend: 'Prof. Ashok Bawge & Dr. Harish Joshi', room: 'Advanced Project Lab (Room 408)' }
  ];

  // 1st Sem Practical Schedule Grid
  const sem1Schedule = [
    { day: 'MONDAY', morning: { code: '1BPOPS103', abbr: 'C PROG LAB', fac: 'Prof. Mahesh Kanjikar', room: 'C Programming Lab (Room 105)' }, afternoon: { code: '1BCSL107', abbr: 'CAED LAB', fac: 'Prof. Aarti Pawar', room: 'CAED Lab (Room 106)' } },
    { day: 'TUESDAY', morning: { code: '1BPHY102', abbr: 'PHY LAB', fac: 'Dr. Pandit Patil', room: 'Physics Lab (Room 107)' }, afternoon: { code: '1BENG106', abbr: 'LANG LAB', fac: 'Prof. Farhanaz', room: 'Language Lab (Room 108)' } },
    { day: 'WEDNESDAY', morning: { code: '1BPOPS103', abbr: 'C PROG LAB', fac: 'Prof. Mahesh Kanjikar', room: 'C Programming Lab (Room 105)' }, afternoon: { code: '1BPHY102', abbr: 'PHY LAB', fac: 'Dr. Pandit Patil', room: 'Physics Lab (Room 107)' } },
    { day: 'THURSDAY', morning: { code: '1BCSL107', abbr: 'CAED LAB', fac: 'Prof. Aarti Pawar', room: 'CAED Lab (Room 106)' }, afternoon: { code: '1BENG106', abbr: 'LANG LAB', fac: 'Prof. Farhanaz', room: 'Language Lab (Room 108)' } },
    { day: 'FRIDAY', morning: { code: '1BPOPS103', abbr: 'C PROG LAB', fac: 'Prof. Mahesh Kanjikar', room: 'C Programming Lab (Room 105)' }, afternoon: { code: '1BPHY102', abbr: 'PHY LAB', fac: 'Dr. Pandit Patil', room: 'Physics Lab (Room 107)' } },
    { day: 'SATURDAY', morning: { code: '1BPOPS103', abbr: 'C & CAED LAB', fac: 'Prof. Mahesh Kanjikar', room: 'C Programming Lab (Room 105)' }, afternoon: null }
  ];

  // 3rd Sem Practical Schedule Grid
  const sem3Schedule = [
    { day: 'MONDAY', morning: { code: '1BCS302(P)', abbr: 'JAVA LAB', fac: 'Prof. Mahesh Kanjikar', room: 'Java Lab (Room 205)' }, afternoon: { code: '1BCS304(P)', abbr: 'OS LAB', fac: 'Prof. Aarti Pawar', room: 'OS Lab (Room 206)' } },
    { day: 'TUESDAY', morning: { code: '1BCSL306', abbr: 'DS LAB', fac: 'Dr. Harish Joshi (HOD)', room: 'Data Structures Lab (Room 207)' }, afternoon: { code: '1BCSL307A', abbr: 'GIT LAB', fac: 'Prof. Farhanaz', room: 'Project Lab (Room 208)' } },
    { day: 'WEDNESDAY', morning: { code: '1BCP308', abbr: 'CP LAB', fac: 'Mr. Anand Patil', room: 'Project Center (Room 209)' }, afternoon: { code: '1BCS302(P)', abbr: 'JAVA LAB', fac: 'Prof. Mahesh Kanjikar', room: 'Java Lab (Room 205)' } },
    { day: 'THURSDAY', morning: { code: '1BCS304(P)', abbr: 'OS LAB', fac: 'Prof. Aarti Pawar', room: 'OS Lab (Room 206)' }, afternoon: { code: '1BCSL306', abbr: 'DS LAB', fac: 'Dr. Harish Joshi (HOD)', room: 'Data Structures Lab (Room 207)' } },
    { day: 'FRIDAY', morning: { code: '1BCSL307A', abbr: 'GIT LAB', fac: 'Prof. Farhanaz', room: 'Project Lab (Room 208)' }, afternoon: { code: '1BCP308', abbr: 'CP LAB', fac: 'Mr. Anand Patil', room: 'Project Center (Room 209)' } },
    { day: 'SATURDAY', morning: { code: '1BCS302(P)', abbr: 'JAVA & OS LAB', fac: 'Prof. Mahesh Kanjikar / Prof. Aarti Pawar', room: 'Java Lab (Room 205)' }, afternoon: null }
  ];

  // 5th Sem Practical Schedule Grid
  const sem5Schedule = [
    { day: 'MONDAY', morning: { code: 'BCSL502', abbr: 'CN LAB', fac: 'Prof. Madhuri Joshi', room: 'Networks Lab (Room 305)' }, afternoon: { code: 'BICL504', abbr: 'IOT/CYBER LAB', fac: 'Prof. Uzma Kausar', room: 'IoT & Cyber Lab (Room 306)' } },
    { day: 'TUESDAY', morning: { code: 'BIC515CL', abbr: 'FSD LAB', fac: 'Prof. Ibtesham Zarrine', room: 'Web Tech Lab (Room 307)' }, afternoon: { code: 'BIC586', abbr: 'MINI PROJECT', fac: 'Dr. Harish Joshi (HOD)', room: 'Project Center (Room 308)' } },
    { day: 'WEDNESDAY', morning: { code: 'BCSL502', abbr: 'CN LAB', fac: 'Prof. Madhuri Joshi', room: 'Networks Lab (Room 305)' }, afternoon: { code: 'BIC515CL', abbr: 'FSD LAB', fac: 'Prof. Ibtesham Zarrine', room: 'Web Tech Lab (Room 307)' } },
    { day: 'THURSDAY', morning: { code: 'BICL504', abbr: 'IOT/CYBER LAB', fac: 'Prof. Uzma Kausar', room: 'IoT & Cyber Lab (Room 306)' }, afternoon: { code: 'BIC586', abbr: 'MINI PROJECT', fac: 'Dr. Harish Joshi (HOD)', room: 'Project Center (Room 308)' } },
    { day: 'FRIDAY', morning: { code: 'BIC515CL', abbr: 'FSD LAB', fac: 'Prof. Ibtesham Zarrine', room: 'Web Tech Lab (Room 307)' }, afternoon: { code: 'BCSL502', abbr: 'CN LAB', fac: 'Prof. Madhuri Joshi', room: 'Networks Lab (Room 305)' } },
    { day: 'SATURDAY', morning: { code: 'BIC586', abbr: 'PROJECT & INNOVATION', fac: 'Dr. Harish Joshi (HOD)', room: 'Project Center (Room 308)' }, afternoon: null }
  ];

  // 7th Sem Practical Schedule Grid
  const sem7Schedule = [
    { day: 'MONDAY', morning: { code: 'BCO701(P)', abbr: 'ICP LAB', fac: 'Prof. Farhanaz', room: 'Protocols Lab (Room 405)' }, afternoon: { code: 'BIC702(P)', abbr: 'BC LAB', fac: 'Prof. Ashok Bawge', room: 'Blockchain Lab (Room 406)' } },
    { day: 'TUESDAY', morning: { code: 'BIC786', abbr: 'PROJ LAB-II', fac: 'Dr. Harish Joshi (HOD)', room: 'Advanced Project Lab (Room 408)' }, afternoon: { code: 'BCO701(P)', abbr: 'ICP LAB', fac: 'Prof. Farhanaz', room: 'Protocols Lab (Room 405)' } },
    { day: 'WEDNESDAY', morning: { code: 'BIC702(P)', abbr: 'BC LAB', fac: 'Prof. Ashok Bawge', room: 'Blockchain Lab (Room 406)' }, afternoon: { code: 'BIC786', abbr: 'PROJ LAB-II', fac: 'Dr. Harish Joshi (HOD)', room: 'Advanced Project Lab (Room 408)' } },
    { day: 'THURSDAY', morning: { code: 'BCO701(P)', abbr: 'ICP LAB', fac: 'Prof. Farhanaz', room: 'Protocols Lab (Room 405)' }, afternoon: { code: 'BIC702(P)', abbr: 'BC LAB', fac: 'Prof. Ashok Bawge', room: 'Blockchain Lab (Room 406)' } },
    { day: 'FRIDAY', morning: { code: 'BIC786', abbr: 'PROJ LAB-II', fac: 'Dr. Harish Joshi (HOD)', room: 'Advanced Project Lab (Room 408)' }, afternoon: { code: 'BIC702(P)', abbr: 'BC SEC LAB', fac: 'Prof. Ashok Bawge', room: 'Blockchain Lab (Room 406)' } },
    { day: 'SATURDAY', morning: { code: 'BIC786', abbr: 'CAPSTONE DEFENSE', fac: 'Dr. Harish Joshi (HOD)', room: 'Advanced Project Lab (Room 408)' }, afternoon: null }
  ];

  const currentLegends =
    activeSem === 1 ? sem1Legends : activeSem === 3 ? sem3Legends : activeSem === 5 ? sem5Legends : sem7Legends;
  const currentSchedule =
    activeSem === 1 ? sem1Schedule : activeSem === 3 ? sem3Schedule : activeSem === 5 ? sem5Schedule : sem7Schedule;

  const getSemOrdinal = (s: number) => {
    if (s === 1) return '1ST';
    if (s === 3) return '3RD';
    if (s === 5) return '5TH';
    return '7TH';
  };

  const getBatchLabel = (s: number) => {
    if (s === 1) return 'Batch 2026';
    if (s === 3) return 'Batch 2025';
    if (s === 5) return 'Batch 2024';
    return 'Batch 2023';
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-cyan-600" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {isStudent
                ? `Semester ${studentSem} Practical Laboratory Timetable`
                : 'Practical Laboratory Time Tables • Academic Year 2026-27'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Department of CSE in IoT & Cyber Security including Block Chain Technology (GNDEC Bidar) • Head of Department: <strong>Dr. Harish Joshi</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Semester Selector Tabs ONLY FOR ADMIN - HIDDEN FOR STUDENTS */}
          {!isStudent ? (
            <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 border border-slate-200">
              {[1, 3, 5, 7].map((sem) => (
                <button
                  key={sem}
                  onClick={() => setActiveSem(sem)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeSem === sem
                      ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-md shadow-cyan-500/20'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sem === 1 ? '1st Sem' : sem === 3 ? '3rd Sem' : sem === 5 ? '5th Sem' : '7th Sem'}
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-cyan-50 border border-cyan-200 px-3 py-1.5 rounded-xl text-xs font-bold text-cyan-900 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-cyan-600" />
              <span>Semester {studentSem} ({getBatchLabel(studentSem)})</span>
            </div>
          )}

          <button
            onClick={() => window.print()}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
            title="Print Time Table"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Timetable Document Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 sm:p-8 space-y-6 print:border-none print:shadow-none">
        {/* Document Header */}
        <div className="text-center space-y-1 pb-4 border-b-2 border-slate-300">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 uppercase tracking-wide">
            Guru Nanak Dev Engineering College Bidar
          </h2>
          <h3 className="text-xs sm:text-sm font-bold text-slate-700">
            Department of CSE in IoT & Cyber Security including Block Chain Technology
          </h3>
          <div className="text-sm font-extrabold text-cyan-800 underline pt-1">
            {getSemOrdinal(activeSem)} SEMESTER PRACTICAL LABORATORY SCHEDULE ({getBatchLabel(activeSem)})
          </div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 pt-2 px-2">
            <span>Academic Year 2026-27</span>
            <span>Room Geofence: 25m Enforced</span>
            <span>Head of Department: Dr. Harish Joshi</span>
          </div>
        </div>

        {/* Practical Lab Schedule Grid */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-300 text-center text-xs">
            <thead>
              <tr className="bg-slate-100 font-bold text-slate-900">
                <th className="border border-slate-300 p-3 w-32">DAY / PERIOD</th>
                <th className="border border-slate-300 p-3 text-xs leading-relaxed bg-cyan-50/50">
                  <div className="font-extrabold text-cyan-950">MORNING PRACTICAL LAB SESSION</div>
                  <div className="text-[11px] font-mono text-cyan-700 font-bold">09.00 AM - 12.00 PM</div>
                </th>
                <th className="border border-slate-300 p-2 text-[10px] w-28 bg-emerald-50 leading-tight">
                  <div className="font-bold text-emerald-950">LUNCH BREAK</div>
                  <div className="text-slate-500">01.00 PM - 02.00 PM</div>
                </th>
                <th className="border border-slate-300 p-3 text-xs leading-relaxed bg-orange-50/50">
                  <div className="font-extrabold text-orange-950">AFTERNOON PRACTICAL LAB SESSION</div>
                  <div className="text-[11px] font-mono text-orange-700 font-bold">02.00 PM - 05.00 PM</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {currentSchedule.map((row) => (
                <tr key={row.day} className="hover:bg-slate-50/80">
                  <td className="border border-slate-300 p-3 font-extrabold text-slate-800 bg-slate-50">
                    {row.day}
                  </td>

                  {/* Morning Practical Lab */}
                  <td className="border border-slate-300 p-3 text-left">
                    {row.morning ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-cyan-800 bg-cyan-100/80 px-2 py-0.5 rounded text-[11px]">
                            {row.morning.code}
                          </span>
                          <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{row.morning.room}</span>
                          </span>
                        </div>
                        <div className="font-extrabold text-slate-900 text-xs">
                          {row.morning.abbr}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-cyan-600" />
                          <span>{row.morning.fac}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No scheduled lab</span>
                    )}
                  </td>

                  {/* Lunch Break */}
                  <td className="border border-slate-300 p-2 bg-emerald-50/30 text-[11px] font-semibold text-emerald-800">
                    Break
                  </td>

                  {/* Afternoon Practical Lab */}
                  <td className="border border-slate-300 p-3 text-left">
                    {row.afternoon ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-orange-800 bg-orange-100/80 px-2 py-0.5 rounded text-[11px]">
                            {row.afternoon.code}
                          </span>
                          <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{row.afternoon.room}</span>
                          </span>
                        </div>
                        <div className="font-extrabold text-slate-900 text-xs">
                          {row.afternoon.abbr}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-orange-600" />
                          <span>{row.afternoon.fac}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No scheduled lab</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Practical Labs Faculty Legend */}
        <div className="pt-4 border-t border-slate-200">
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">
            Official Practical Laboratory Courses & Faculty In-Charge ({getSemOrdinal(activeSem)} Semester)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {currentLegends.map((item) => (
              <div key={item.code} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-cyan-800 text-[11px]">{item.code}</span>
                  <span className="text-[10px] text-slate-500 font-semibold">{item.room}</span>
                </div>
                <div className="font-bold text-slate-900">{item.name}</div>
                <div className="text-[11px] text-cyan-700 font-medium flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  <span>Instructor: {item.legend}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Institutional Policy Notice */}
        <div className="p-4 bg-cyan-50/60 rounded-2xl border border-cyan-100 text-slate-600 text-[11px] leading-relaxed flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
          <span>
            <strong>Laboratory Policy:</strong> Attendance and feedback submissions are strictly isolated to this practical schedule. Geofencing perimeter (25m radius) is actively monitored during all practical sessions.
          </span>
        </div>
      </div>
    </div>
  );
};
