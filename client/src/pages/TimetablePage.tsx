import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, Printer, FlaskConical, MapPin, UserCheck, ShieldCheck } from 'lucide-react';

interface LabLegend {
  code: string;
  name: string;
  abbr: string;
  legend: string;
  room: string;
}

export const TimetablePage: React.FC = () => {
  const { user } = useAuth();
  const [activeSem, setActiveSem] = useState<number>(user?.semester || 3);

  // Official Practical Laboratories for 3rd, 5th, 7th Semesters
  const sem3Legends: LabLegend[] = [
    { code: '1BCS302(P)', name: 'Object Oriented Programming with JAVA LAB', abbr: 'JAVA LAB', legend: 'Prof. Mahesh Kanjikar', room: 'Java Lab (Room 205)' },
    { code: '1BCS304(P)', name: 'Operating Systems LAB', abbr: 'OS LAB', legend: 'Prof. Aarti Pawar', room: 'OS Lab (Room 206)' },
    { code: '1BCSL306', name: 'Data Structures Laboratory', abbr: 'DS LAB', legend: 'Prof. Aarti Pawar', room: 'Data Structures Lab (Room 207)' },
    { code: '1BCSL307A', name: 'Project Management with GIT Lab', abbr: 'GIT LAB', legend: 'Prof. Farhanaz & Mr. Anand Patil', room: 'Project Lab (Room 208)' },
    { code: '1BCP308', name: 'Community Project Laboratory', abbr: 'CP LAB', legend: 'Mr. Anand Patil', room: 'Project Center (Room 209)' }
  ];

  const sem5Legends: LabLegend[] = [
    { code: 'BCSL502', name: 'Computer Networks Laboratory', abbr: 'CN LAB', legend: 'Prof. Madhuri Joshi', room: 'Networks Lab (Room 305)' },
    { code: 'BICL504', name: 'IoT & Cyber Security Laboratory', abbr: 'IOT/CYBER LAB', legend: 'Prof. Uzma Kausar & Prof. Farhanaz', room: 'IoT & Cyber Lab (Room 306)' },
    { code: 'BIC515CL', name: 'Full Stack Development Laboratory', abbr: 'FSD LAB', legend: 'Prof. Ibtesham Zarrine', room: 'Web Tech Lab (Room 307)' },
    { code: 'BIC586', name: 'Mini Project Laboratory', abbr: 'MINI PROJECT', legend: 'Dr. Harish Joshi (HOD)', room: 'Project Center (Room 308)' }
  ];

  const sem7Legends: LabLegend[] = [
    { code: 'BCO701(P)', name: 'IoT Communication Protocols Laboratory', abbr: 'ICP LAB', legend: 'Prof. Farhanaz', room: 'Protocols Lab (Room 405)' },
    { code: 'BIC702(P)', name: 'Blockchain Technology Laboratory', abbr: 'BC LAB', legend: 'Prof. Ashok Bawge', room: 'Blockchain Lab (Room 406)' },
    { code: 'BIC786', name: 'Major Project Phase-II Laboratory', abbr: 'PROJ LAB-II', legend: 'Prof. Ashok Bawge', room: 'Advanced Project Lab (Room 408)' }
  ];

  // Practical Lab Schedule Grid (Monday - Saturday)
  const sem3Schedule = [
    { day: 'MONDAY', morning: { code: '1BCS302(P)', abbr: 'JAVA LAB', fac: 'Prof. Mahesh Kanjikar', room: 'Java Lab (Room 205)' }, afternoon: { code: '1BCS304(P)', abbr: 'OS LAB', fac: 'Prof. Aarti Pawar', room: 'OS Lab (Room 206)' } },
    { day: 'TUESDAY', morning: { code: '1BCSL306', abbr: 'DS LAB', fac: 'Dr. Harish Joshi (HOD)', room: 'Data Structures Lab (Room 207)' }, afternoon: { code: '1BCSL307A', abbr: 'GIT LAB', fac: 'Prof. Farhanaz', room: 'Project Lab (Room 208)' } },
    { day: 'WEDNESDAY', morning: { code: '1BCP308', abbr: 'CP LAB', fac: 'Mr. Anand Patil', room: 'Project Center (Room 209)' }, afternoon: { code: '1BCS302(P)', abbr: 'JAVA LAB', fac: 'Prof. Mahesh Kanjikar', room: 'Java Lab (Room 205)' } },
    { day: 'THURSDAY', morning: { code: '1BCS304(P)', abbr: 'OS LAB', fac: 'Prof. Aarti Pawar', room: 'OS Lab (Room 206)' }, afternoon: { code: '1BCSL306', abbr: 'DS LAB', fac: 'Dr. Harish Joshi (HOD)', room: 'Data Structures Lab (Room 207)' } },
    { day: 'FRIDAY', morning: { code: '1BCSL307A', abbr: 'GIT LAB', fac: 'Prof. Farhanaz', room: 'Project Lab (Room 208)' }, afternoon: { code: '1BCP308', abbr: 'CP LAB', fac: 'Mr. Anand Patil', room: 'Project Center (Room 209)' } },
    { day: 'SATURDAY', morning: { code: '1BCS302(P)', abbr: 'JAVA & OS LAB', fac: 'Prof. Mahesh Kanjikar / Prof. Aarti Pawar', room: 'Java Lab (Room 205)' }, afternoon: null }
  ];

  const sem5Schedule = [
    { day: 'MONDAY', morning: { code: 'BCSL502', abbr: 'CN LAB', fac: 'Prof. Madhuri Joshi', room: 'Networks Lab (Room 305)' }, afternoon: { code: 'BICL504', abbr: 'IOT/CYBER LAB', fac: 'Prof. Uzma Kausar', room: 'IoT & Cyber Lab (Room 306)' } },
    { day: 'TUESDAY', morning: { code: 'BIC515CL', abbr: 'FSD LAB', fac: 'Prof. Ibtesham Zarrine', room: 'Web Tech Lab (Room 307)' }, afternoon: { code: 'BIC586', abbr: 'MINI PROJECT', fac: 'Dr. Harish Joshi (HOD)', room: 'Project Center (Room 308)' } },
    { day: 'WEDNESDAY', morning: { code: 'BCSL502', abbr: 'CN LAB', fac: 'Prof. Madhuri Joshi', room: 'Networks Lab (Room 305)' }, afternoon: { code: 'BIC515CL', abbr: 'FSD LAB', fac: 'Prof. Ibtesham Zarrine', room: 'Web Tech Lab (Room 307)' } },
    { day: 'THURSDAY', morning: { code: 'BICL504', abbr: 'IOT/CYBER LAB', fac: 'Prof. Uzma Kausar', room: 'IoT & Cyber Lab (Room 306)' }, afternoon: { code: 'BIC586', abbr: 'MINI PROJECT', fac: 'Dr. Harish Joshi (HOD)', room: 'Project Center (Room 308)' } },
    { day: 'FRIDAY', morning: { code: 'BIC515CL', abbr: 'FSD LAB', fac: 'Prof. Ibtesham Zarrine', room: 'Web Tech Lab (Room 307)' }, afternoon: { code: 'BCSL502', abbr: 'CN LAB', fac: 'Prof. Madhuri Joshi', room: 'Networks Lab (Room 305)' } },
    { day: 'SATURDAY', morning: { code: 'BIC586', abbr: 'PROJECT & INNOVATION', fac: 'Dr. Harish Joshi (HOD)', room: 'Project Center (Room 308)' }, afternoon: null }
  ];

  const sem7Schedule = [
    { day: 'MONDAY', morning: { code: 'BCO701(P)', abbr: 'ICP LAB', fac: 'Prof. Farhanaz', room: 'Protocols Lab (Room 405)' }, afternoon: { code: 'BIC702(P)', abbr: 'BC LAB', fac: 'Prof. Ashok Bawge', room: 'Blockchain Lab (Room 406)' } },
    { day: 'TUESDAY', morning: { code: 'BIC786', abbr: 'PROJ LAB-II', fac: 'Dr. Harish Joshi (HOD)', room: 'Advanced Project Lab (Room 408)' }, afternoon: { code: 'BCO701(P)', abbr: 'ICP LAB', fac: 'Prof. Farhanaz', room: 'Protocols Lab (Room 405)' } },
    { day: 'WEDNESDAY', morning: { code: 'BIC702(P)', abbr: 'BC LAB', fac: 'Prof. Ashok Bawge', room: 'Blockchain Lab (Room 406)' }, afternoon: { code: 'BIC786', abbr: 'PROJ LAB-II', fac: 'Dr. Harish Joshi (HOD)', room: 'Advanced Project Lab (Room 408)' } },
    { day: 'THURSDAY', morning: { code: 'BCO701(P)', abbr: 'ICP LAB', fac: 'Prof. Farhanaz', room: 'Protocols Lab (Room 405)' }, afternoon: { code: 'BIC702(P)', abbr: 'BC LAB', fac: 'Prof. Ashok Bawge', room: 'Blockchain Lab (Room 406)' } },
    { day: 'FRIDAY', morning: { code: 'BIC786', abbr: 'PROJ LAB-II', fac: 'Dr. Harish Joshi (HOD)', room: 'Advanced Project Lab (Room 408)' }, afternoon: { code: 'BIC702(P)', abbr: 'BC SEC LAB', fac: 'Prof. Ashok Bawge', room: 'Blockchain Lab (Room 406)' } },
    { day: 'SATURDAY', morning: { code: 'BIC786', abbr: 'CAPSTONE DEFENSE', fac: 'Dr. Harish Joshi (HOD)', room: 'Advanced Project Lab (Room 408)' }, afternoon: null }
  ];

  const currentLegends = activeSem === 3 ? sem3Legends : activeSem === 5 ? sem5Legends : sem7Legends;
  const currentSchedule = activeSem === 3 ? sem3Schedule : activeSem === 5 ? sem5Schedule : sem7Schedule;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Practical Laboratory Time Tables • Academic Year 2026-27
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Department of CSE in IoT & Cyber Security including Block Chain Technology (GNDEC Bidar) • Head of Department: <strong>Dr. Harish Joshi</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Semester Selector Tabs */}
          <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 border border-slate-200">
            {[3, 5, 7].map(sem => (
              <button
                key={sem}
                onClick={() => setActiveSem(sem)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeSem === sem
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sem === 3 ? '3rd Sem Labs' : sem === 5 ? '5th Sem Labs' : '7th Sem Labs'}
              </button>
            ))}
          </div>

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
      <div className="bg-white rounded-3xl border border-slate-300 shadow-xl p-6 sm:p-8 space-y-6 print:border-none print:shadow-none">
        {/* Document Header */}
        <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 uppercase tracking-wide">
            Guru Nanak Dev Engineering College Bidar
          </h2>
          <h3 className="text-xs sm:text-sm font-bold text-slate-700">
            Department of CSE in IoT & Cyber Security including Block Chain Technology
          </h3>
          <div className="text-sm font-extrabold text-blue-900 underline pt-1">
            {activeSem === 3 ? '3RD' : activeSem === 5 ? '5TH' : '7TH'} SEMESTER PRACTICAL LABORATORY SCHEDULE
          </div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 pt-2 px-2">
            <span>Academic Year 2026-27</span>
            <span>Room Geofence: 25m Enforced</span>
            <span>Head of Department: Dr. Harish Joshi</span>
          </div>
        </div>

        {/* Practical Lab Schedule Grid */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-800 text-center text-xs">
            <thead>
              <tr className="bg-slate-100 font-bold text-slate-900">
                <th className="border border-slate-800 p-3 w-32">
                  DAY / PERIOD
                </th>
                <th className="border border-slate-800 p-3 text-xs leading-relaxed bg-blue-50/50">
                  <div className="font-extrabold text-blue-950">MORNING PRACTICAL LAB SESSION</div>
                  <div className="text-[11px] font-mono text-blue-700 font-bold">09.00 AM - 12.00 PM</div>
                </th>
                <th className="border border-slate-800 p-2 text-[10px] w-28 bg-emerald-50 leading-tight">
                  <div className="font-bold text-emerald-950">LUNCH BREAK</div>
                  <div className="text-slate-500">01.00 PM - 02.00 PM</div>
                </th>
                <th className="border border-slate-800 p-3 text-xs leading-relaxed bg-indigo-50/50">
                  <div className="font-extrabold text-indigo-950">AFTERNOON PRACTICAL LAB SESSION</div>
                  <div className="text-[11px] font-mono text-indigo-700 font-bold">02.00 PM - 05.00 PM</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {currentSchedule.map((row, rIdx) => (
                <tr key={row.day} className="h-16">
                  {/* Day Label */}
                  <td className="border border-slate-800 font-extrabold bg-slate-50 text-slate-900 p-3 text-xs">
                    {row.day}
                  </td>

                  {/* Morning Practical Session */}
                  <td className="border border-slate-800 p-3 font-semibold bg-white text-left">
                    {row.morning ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-extrabold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                            {row.morning.code}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {row.morning.room}
                          </span>
                        </div>
                        <div className="font-bold text-slate-900 text-xs">{row.morning.abbr}</div>
                        <div className="text-[11px] text-slate-600">Faculty: <strong>{row.morning.fac}</strong></div>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-normal">--</span>
                    )}
                  </td>

                  {/* Lunch Break Banner */}
                  {rIdx === 0 ? (
                    <td rowSpan={6} className="border border-slate-800 bg-emerald-100 font-extrabold text-[11px] text-emerald-950 tracking-widest uppercase p-1 text-center">
                      <div className="writing-vertical flex items-center justify-center h-full mx-auto" style={{ writingMode: 'vertical-rl' }}>
                        L U N C H &nbsp; B R E A K
                      </div>
                    </td>
                  ) : null}

                  {/* Afternoon Practical Session */}
                  <td className="border border-slate-800 p-3 font-semibold bg-white text-left">
                    {row.afternoon ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-extrabold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
                            {row.afternoon.code}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {row.afternoon.room}
                          </span>
                        </div>
                        <div className="font-bold text-slate-900 text-xs">{row.afternoon.abbr}</div>
                        <div className="text-[11px] text-slate-600">Faculty: <strong>{row.afternoon.fac}</strong></div>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-normal">Self Study / Lab Revision</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Practical Laboratory Course Legend */}
        <div className="pt-4 border-t-2 border-slate-800 space-y-3">
          <div className="font-bold text-xs text-slate-800 uppercase tracking-wide">
            Official Practical Laboratories & Faculty In-Charge Directory:
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-800 text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-extrabold">
                  <th className="border border-slate-800 p-2 w-36">COURSE CODE</th>
                  <th className="border border-slate-800 p-2">PRACTICAL LABORATORY NAME</th>
                  <th className="border border-slate-800 p-2 w-48">ROOM LOCATION</th>
                  <th className="border border-slate-800 p-2 w-64">FACULTY IN-CHARGE</th>
                </tr>
              </thead>
              <tbody>
                {currentLegends.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border border-slate-800 p-2 font-mono font-bold text-slate-800">
                      {item.code}
                    </td>
                    <td className="border border-slate-800 p-2 font-semibold text-slate-900">
                      {item.name}
                    </td>
                    <td className="border border-slate-800 p-2 text-slate-600 font-medium">
                      {item.room}
                    </td>
                    <td className="border border-slate-800 p-2 font-bold text-slate-800">
                      {item.legend}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Signature Blocks */}
        <div className="pt-8 flex items-center justify-between text-xs font-extrabold text-slate-800 px-4">
          <div>LABORATORY COORDINATOR</div>
          <div>HOD CSE-ICB (Dr. Harish Joshi)</div>
        </div>
      </div>
    </div>
  );
};
