import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, Printer, FlaskConical, MapPin, UserCheck, ShieldCheck, Lock, Calendar, BookOpen, Award, CheckCircle2 } from 'lucide-react';

interface LabLegend {
  code: string;
  name: string;
  abbr: string;
  legend: string;
  room: string;
}

interface TimetableSlot {
  code: string;
  abbr: string;
  name: string;
  time: string;
  fac: string;
  room: string;
  batch?: string;
}

interface DaySchedule {
  day: string;
  slots: TimetableSlot[];
}

export const TimetablePage: React.FC = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';
  const studentSem = user?.semester || 3;

  // If student, lock activeSem strictly to their own semester. If admin/faculty, allow switching.
  const [activeSem, setActiveSem] = useState<number>(isStudent ? studentSem : 3);

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

  // 3rd Semester Practical Laboratories (Official GNDEC 3rd Sem Timetable)
  const sem3Legends: LabLegend[] = [
    { code: '1BCS302(P)', name: 'Object Oriented Programming with JAVA LAB', abbr: 'JAVAL/MK', legend: 'Prof. Mahesh Kanjikar', room: 'Java Lab (Room 205)' },
    { code: '1BCS304(P)', name: 'Operating Systems LAB', abbr: 'OSL/AP', legend: 'Prof. Aarti Pawar', room: 'OS Lab (Room 206)' },
    { code: '1BCSL306', name: 'Data Structures Laboratory', abbr: 'DSAL/AP', legend: 'Prof. Aarti Pawar', room: 'Data Structures Lab (Room 207)' },
    { code: '1BCSL307A', name: 'Project Management (with GIT)', abbr: 'GIT/FN', legend: 'Prof. Farhnaz & Mr. Anand Patil', room: 'Project Lab (Room 208)' },
    { code: '1BCP308', name: 'Community Project', abbr: 'CP/ANP', legend: 'Mr. Anand Patil', room: 'Project Center (Room 209)' },
    { code: 'BNSK359', name: 'NSS / Sports Activity', abbr: 'NSS/MJ', legend: 'Prof. Madhuri Joshi', room: 'Sports Complex / Ground' }
  ];

  // 5th Semester Practical Laboratories (Official GNDEC 5th Sem Timetable)
  const sem5Legends: LabLegend[] = [
    { code: 'BCSL502', name: 'Computer Networks Laboratory', abbr: 'CNL/MJ', legend: 'Prof. Madhuri Joshi', room: 'Networks Lab (Room 305)' },
    { code: 'BICL504', name: 'IoT Lab', abbr: 'IOT/UK/FN', legend: 'Prof. Uzma Kausar & Prof. Farhnaz', room: 'IoT & Cyber Lab (Room 306)' },
    { code: 'BIC515C', name: 'Full Stack Development Laboratory', abbr: 'FSD LAB/IZ', legend: 'Prof. Ibtesham Zarrine', room: 'Web Tech Lab (Room 307)' },
    { code: 'BIC586', name: 'Mini Project', abbr: 'MiniProject/HJ', legend: 'Dr. Harish Joshi (HOD)', room: 'Project Center (Room 308)' },
    { code: 'BNSK559', name: 'National Service Scheme', abbr: 'NSS/AP', legend: 'Prof. Aarti Pawar', room: 'Activity Center' }
  ];

  // 7th Semester Practical Laboratories (Official GNDEC 7th Sem Timetable)
  const sem7Legends: LabLegend[] = [
    { code: 'BCO701(P)', name: 'IOT Communication Protocols Lab', abbr: 'ICPL/FN', legend: 'Prof. Farhanaz', room: 'Protocols Lab (Room 405)' },
    { code: 'BIC702(P)', name: 'Blockchain Technology Lab', abbr: 'BTL/AB', legend: 'Prof. Ashok Bawge', room: 'Blockchain Lab (Room 406)' },
    { code: 'BIC786', name: 'Major Project Phase-II', abbr: 'PP-II/AB', legend: 'Prof. Ashok Bawge & Dr. Harish Joshi', room: 'Advanced Project Lab (Room 408)' }
  ];

  // 1st Sem Practical Schedule
  const sem1Schedule: DaySchedule[] = [
    {
      day: 'MONDAY',
      slots: [
        { code: '1BPOPS103', abbr: 'C PROG LAB', name: 'Principles of Programming using C Lab', time: '09.00 AM - 12.00 PM', fac: 'Prof. Mahesh Kanjikar', room: 'C Programming Lab (Room 105)' },
        { code: '1BCSL107', abbr: 'CAED LAB', name: 'Computer Aided Engineering Drawing Lab', time: '02.00 PM - 05.00 PM', fac: 'Prof. Aarti Pawar', room: 'CAED Lab (Room 106)' }
      ]
    },
    {
      day: 'TUESDAY',
      slots: [
        { code: '1BPHY102', abbr: 'PHY LAB', name: 'Applied Engineering Physics Laboratory', time: '09.00 AM - 12.00 PM', fac: 'Dr. Pandit Patil', room: 'Physics Lab (Room 107)' },
        { code: '1BENG106', abbr: 'LANG LAB', name: 'Professional Communication & Language Lab', time: '02.00 PM - 05.00 PM', fac: 'Prof. Farhanaz', room: 'Language Lab (Room 108)' }
      ]
    },
    {
      day: 'WEDNESDAY',
      slots: [
        { code: '1BPOPS103', abbr: 'C PROG LAB', name: 'Principles of Programming using C Lab', time: '09.00 AM - 12.00 PM', fac: 'Prof. Mahesh Kanjikar', room: 'C Programming Lab (Room 105)' },
        { code: '1BPHY102', abbr: 'PHY LAB', name: 'Applied Engineering Physics Laboratory', time: '02.00 PM - 05.00 PM', fac: 'Dr. Pandit Patil', room: 'Physics Lab (Room 107)' }
      ]
    },
    {
      day: 'THURSDAY',
      slots: [
        { code: '1BCSL107', abbr: 'CAED LAB', name: 'Computer Aided Engineering Drawing Lab', time: '09.00 AM - 12.00 PM', fac: 'Prof. Aarti Pawar', room: 'CAED Lab (Room 106)' },
        { code: '1BENG106', abbr: 'LANG LAB', name: 'Professional Communication & Language Lab', time: '02.00 PM - 05.00 PM', fac: 'Prof. Farhanaz', room: 'Language Lab (Room 108)' }
      ]
    },
    {
      day: 'FRIDAY',
      slots: [
        { code: '1BPOPS103', abbr: 'C PROG LAB', name: 'Principles of Programming using C Lab', time: '09.00 AM - 12.00 PM', fac: 'Prof. Mahesh Kanjikar', room: 'C Programming Lab (Room 105)' },
        { code: '1BPHY102', abbr: 'PHY LAB', name: 'Applied Engineering Physics Laboratory', time: '02.00 PM - 05.00 PM', fac: 'Dr. Pandit Patil', room: 'Physics Lab (Room 107)' }
      ]
    },
    {
      day: 'SATURDAY',
      slots: [
        { code: '1BPOPS103', abbr: 'C & CAED LAB', name: 'C Programming & CAED Practical Practice Lab', time: '09.00 AM - 01.00 PM', fac: 'Prof. Mahesh Kanjikar', room: 'C Programming Lab (Room 105)' }
      ]
    }
  ];

  // 3rd Sem Practical Schedule (Real Time Slots from Official Timetable)
  const sem3Schedule: DaySchedule[] = [
    {
      day: 'MONDAY',
      slots: [
        { code: '1BCSL307A', abbr: 'GIT/FN', name: 'Project Management (with GIT)', time: '03.00 PM - 04.00 PM', fac: 'Prof. Farhnaz & Mr. Anand Patil', room: 'Project Lab (Room 208)' },
        { code: '1BCS304(P)', abbr: 'OSL/AP', name: 'Operating Systems LAB', time: '04.00 PM - 05.00 PM', fac: 'Prof. Aarti Pawar', room: 'OS Lab (Room 206)' }
      ]
    },
    {
      day: 'TUESDAY',
      slots: [
        { code: '1BCSL306', abbr: 'DSAL/AP', name: 'Data Structures Laboratory', time: '03.00 PM - 04.00 PM', fac: 'Prof. Aarti Pawar', room: 'Data Structures Lab (Room 207)' }
      ]
    },
    {
      day: 'WEDNESDAY',
      slots: [
        { code: '1BCSL306', abbr: 'DSAL/AP', name: 'Data Structures Laboratory', time: '11.10 AM - 01.00 PM', fac: 'Prof. Aarti Pawar', room: 'Data Structures Lab (Room 207)' }
      ]
    },
    {
      day: 'THURSDAY',
      slots: [
        { code: '1BCS302(P)', abbr: 'JAVAL/MK', name: 'Object Oriented Programming with JAVA LAB', time: '02.00 PM - 03.00 PM', fac: 'Prof. Mahesh Kanjikar', room: 'Java Lab (Room 205)' },
        { code: '1BCS304(P)', abbr: 'OSL/AP', name: 'Operating Systems LAB', time: '03.00 PM - 04.00 PM', fac: 'Prof. Aarti Pawar', room: 'OS Lab (Room 206)' }
      ]
    },
    {
      day: 'FRIDAY',
      slots: [
        { code: '1BCP308', abbr: 'CP/ANP', name: 'Community Project', time: '02.00 PM - 04.00 PM', fac: 'Mr. Anand Patil', room: 'Project Center (Room 209)' }
      ]
    },
    {
      day: 'SATURDAY',
      slots: [
        { code: '1BCSL307A', abbr: 'GIT/FN', name: 'Project Management (with GIT)', time: '09.00 AM - 09.55 AM', fac: 'Prof. Farhnaz & Mr. Anand Patil', room: 'Project Lab (Room 208)' }
      ]
    }
  ];

  // 5th Sem Practical Schedule (Real Time Slots from Official Timetable)
  const sem5Schedule: DaySchedule[] = [
    {
      day: 'MONDAY',
      slots: [
        { code: 'BCSL502', abbr: 'CNL/MJ', name: 'Computer Networks Laboratory', time: '03.00 PM - 04.00 PM', fac: 'Prof. Madhuri Joshi', room: 'Networks Lab (Room 305)' }
      ]
    },
    {
      day: 'TUESDAY',
      slots: [
        { code: 'BCSL502', abbr: 'CNL/MJ', name: 'Computer Networks Laboratory', time: '12.05 PM - 01.00 PM', fac: 'Prof. Madhuri Joshi', room: 'Networks Lab (Room 305)' }
      ]
    },
    {
      day: 'WEDNESDAY',
      slots: [
        { code: 'BIC515C', abbr: 'FSD LAB', name: 'Full Stack Development Laboratory', time: '11.10 AM - 01.00 PM', fac: 'Prof. Ibtesham Zarrine', room: 'Web Tech Lab (Room 307)' },
        { code: 'BCSL502', abbr: 'CNL/MJ', name: 'Computer Networks Laboratory', time: '04.00 PM - 05.00 PM', fac: 'Prof. Madhuri Joshi', room: 'Networks Lab (Room 305)' }
      ]
    },
    {
      day: 'THURSDAY',
      slots: [
        { code: 'BICL504', abbr: 'IOT/UK/FN', name: 'IoT Lab', time: '11.10 AM - 01.00 PM', fac: 'Prof. Uzma Kausar & Prof. Farhnaz', room: 'IoT & Cyber Lab (Room 306)' },
        { code: 'BCSL502', abbr: 'CNL/MJ', name: 'Computer Networks Laboratory', time: '02.00 PM - 03.00 PM', fac: 'Prof. Madhuri Joshi', room: 'Networks Lab (Room 305)' }
      ]
    },
    {
      day: 'FRIDAY',
      slots: [
        { code: 'BCSL502', abbr: 'CNL/MJ', name: 'Computer Networks Laboratory', time: '09.00 AM - 09.55 AM', fac: 'Prof. Madhuri Joshi', room: 'Networks Lab (Room 305)' }
      ]
    },
    {
      day: 'SATURDAY',
      slots: [
        { code: 'BIC586', abbr: 'Mini Project', name: 'Mini Project Laboratory', time: '11.10 AM - 01.00 PM', fac: 'Dr. Harish Joshi (HOD)', room: 'Project Center (Room 308)' }
      ]
    }
  ];

  // 7th Sem Practical Schedule (Real Time Slots from Official Timetable)
  const sem7Schedule: DaySchedule[] = [
    {
      day: 'MONDAY',
      slots: [
        { code: 'BCO701(P)', abbr: 'ICPL/FN', name: 'IOT Communication Protocols Lab', time: '09.55 AM - 10.50 AM', fac: 'Prof. Farhanaz', room: 'Protocols Lab (Room 405)' },
        { code: 'BCO701(P)', abbr: 'ICPL/FN', name: 'IOT Communication Protocols Lab', time: '02.00 PM - 03.00 PM', fac: 'Prof. Farhanaz', room: 'Protocols Lab (Room 405)' }
      ]
    },
    {
      day: 'TUESDAY',
      slots: [
        { code: 'BIC702(P)', abbr: 'BTL/AB', name: 'Blockchain Technology Lab', time: '11.10 AM - 12.05 PM', fac: 'Prof. Ashok Bawge', room: 'Blockchain Lab (Room 406)' }
      ]
    },
    {
      day: 'WEDNESDAY',
      slots: [
        { code: 'BCO701(P)', abbr: 'ICPL/FN', name: 'IOT Communication Protocols Lab', time: '09.55 AM - 10.50 AM', fac: 'Prof. Farhanaz', room: 'Protocols Lab (Room 405)' },
        { code: 'BIC786', abbr: 'PP-II/AB', name: 'Major Project Phase-II Laboratory', time: '02.00 PM - 05.00 PM', fac: 'Prof. Ashok Bawge', room: 'Advanced Project Lab (Room 408)' }
      ]
    },
    {
      day: 'THURSDAY',
      slots: [
        { code: 'BIC702(P)', abbr: 'BTL/AB (B1)', name: 'Blockchain Technology Lab (Batch 1)', time: '11.10 AM - 01.00 PM', fac: 'Prof. Ashok Bawge', room: 'Blockchain Lab (Room 406)', batch: 'Batch B1' },
        { code: 'BCO701(P)', abbr: 'ICPL/FN (B2)', name: 'IOT Communication Protocols Lab (Batch 2)', time: '11.10 AM - 01.00 PM', fac: 'Prof. Farhanaz', room: 'Protocols Lab (Room 405)', batch: 'Batch B2' }
      ]
    },
    {
      day: 'FRIDAY',
      slots: [
        { code: 'BIC702(P)', abbr: 'BTL/AB (B2)', name: 'Blockchain Technology Lab (Batch 2)', time: '11.10 AM - 01.00 PM', fac: 'Prof. Ashok Bawge', room: 'Blockchain Lab (Room 406)', batch: 'Batch B2' },
        { code: 'BCO701(P)', abbr: 'ICPL/FN (B1)', name: 'IOT Communication Protocols Lab (Batch 1)', time: '11.10 AM - 01.00 PM', fac: 'Prof. Farhanaz', room: 'Protocols Lab (Room 405)', batch: 'Batch B1' }
      ]
    },
    {
      day: 'SATURDAY',
      slots: []
    }
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

  const getEffectDate = (s: number) => {
    if (s === 1) return '01-09-2026';
    if (s === 3) return '08-09-2026';
    if (s === 5) return '07-09-2026';
    return '24-08-2026';
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
                : 'Official Practical Laboratory Time Tables • Academic Year 2026-27'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Department of CSE in IoT & Cyber Security including Block Chain Technology • GNDEC Bidar • HOD: <strong>Dr. Harish Joshi</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Semester Selector Tabs ONLY FOR ADMIN/FACULTY - LOCKED FOR STUDENTS */}
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
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold"
            title="Print Official Time Table"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Main Timetable Document Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 sm:p-8 space-y-6 print:border-none print:shadow-none">
        {/* Document Header */}
        <div className="text-center space-y-1 pb-4 border-b-2 border-slate-300">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-wide">
            Guru Nanak Dev Engineering College Bidar
          </h2>
          <h3 className="text-xs sm:text-sm font-bold text-slate-700">
            Department of CSE in IoT & Cyber Security including Block Chain Technology
          </h3>
          <div className="text-sm font-extrabold text-cyan-800 uppercase tracking-wider pt-1">
            {getSemOrdinal(activeSem)} SEMESTER LAB TIME TABLE (PRACTICAL LABORATORIES)
          </div>
          <div className="flex flex-wrap items-center justify-between text-xs font-semibold text-slate-600 pt-2 px-2 gap-2">
            <span>Academic Year 2026-27</span>
            <span className="bg-cyan-50 text-cyan-800 font-bold px-2 py-0.5 rounded-full border border-cyan-200">
              With Effect from: {getEffectDate(activeSem)}
            </span>
            <span>Room Geofence: 25m Radius Active</span>
          </div>
        </div>

        {/* Day-by-Day Practical Schedule Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-600" />
              <span>Weekly Practical Laboratory Schedule</span>
            </h4>
            <span className="text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full">
              Only Practical Labs Scheduled
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentSchedule.map((dayItem) => (
              <div
                key={dayItem.day}
                className="bg-slate-50/80 rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between"
              >
                <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
                  <span className="font-extrabold text-xs tracking-wider">{dayItem.day}</span>
                  <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                    {dayItem.slots.length} Lab{dayItem.slots.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="p-3.5 space-y-3 flex-1">
                  {dayItem.slots.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 italic">
                      No practical lab scheduled on {dayItem.day}
                    </div>
                  ) : (
                    dayItem.slots.map((slot, sIdx) => (
                      <div
                        key={sIdx}
                        className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-xs hover:border-cyan-300 transition-all space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono font-bold text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded text-[10px]">
                            {slot.code}
                          </span>
                          <span className="text-[10px] font-extrabold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {slot.time}
                          </span>
                        </div>

                        <div>
                          <div className="font-bold text-slate-900 text-xs leading-tight">
                            {slot.abbr}
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">
                            {slot.name}
                          </div>
                        </div>

                        <div className="pt-1.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-600 gap-1">
                          <div className="flex items-center gap-1 font-semibold text-slate-700">
                            <UserCheck className="w-3 h-3 text-cyan-600 shrink-0" />
                            <span className="truncate">{slot.fac}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                            <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span>{slot.room}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Official Subject Codes, Abbreviations & Legends Table */}
        <div className="pt-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-600" />
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Subject Code, Abbreviations & Faculty In-Charge ({getSemOrdinal(activeSem)} Semester)
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 text-left text-xs">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-900 text-[11px]">
                  <th className="border border-slate-300 p-2.5 w-32 font-black">SUBJECT CODE</th>
                  <th className="border border-slate-300 p-2.5 font-black">SUBJECT / LABORATORY NAME</th>
                  <th className="border border-slate-300 p-2.5 w-36 font-black">ABBREVIATION</th>
                  <th className="border border-slate-300 p-2.5 w-56 font-black">FACULTY LEGENDS</th>
                  <th className="border border-slate-300 p-2.5 w-44 font-black">LOCATION / ROOM</th>
                </tr>
              </thead>
              <tbody>
                {currentLegends.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 text-[11px]">
                    <td className="border border-slate-300 p-2.5 font-mono font-bold text-cyan-900 bg-slate-50/50">
                      {item.code}
                    </td>
                    <td className="border border-slate-300 p-2.5 font-bold text-slate-900">
                      {item.name}
                    </td>
                    <td className="border border-slate-300 p-2.5 font-mono font-bold text-orange-800">
                      {item.abbr}
                    </td>
                    <td className="border border-slate-300 p-2.5 text-slate-700 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{item.legend}</span>
                      </div>
                    </td>
                    <td className="border border-slate-300 p-2.5 text-slate-600">
                      <div className="flex items-center gap-1 text-[10px]">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{item.room}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Official Institutional Authority Signatures Footer */}
        <div className="pt-6 border-t-2 border-slate-300 flex items-center justify-between text-xs font-black text-slate-900 uppercase tracking-wider px-4">
          <div className="space-y-1 text-center">
            <div className="h-8 flex items-end justify-center font-serif text-[11px] text-cyan-800 italic">
              Verified & Approved
            </div>
            <div className="border-t border-slate-900 pt-1 px-4">
              TIME TABLE COORDINATOR
            </div>
          </div>

          <div className="space-y-1 text-center">
            <div className="h-8 flex items-end justify-center font-serif text-[11px] text-cyan-800 italic">
              Dr. Harish Joshi
            </div>
            <div className="border-t border-slate-900 pt-1 px-4">
              HOD CSE-ICB
            </div>
          </div>
        </div>

        {/* Institutional Policy Notice */}
        <div className="p-4 bg-cyan-50/60 rounded-2xl border border-cyan-100 text-slate-600 text-[11px] leading-relaxed flex items-start gap-2 print:hidden">
          <ShieldCheck className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
          <span>
            <strong>Official Practical Timetable:</strong> All laboratory attendance check-ins, active geofencing (25m perimeter), and 5-minute student feedback submission windows operate strictly according to these registered practical laboratory slots.
          </span>
        </div>
      </div>
    </div>
  );
};
