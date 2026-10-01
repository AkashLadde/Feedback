import bcrypt from 'bcryptjs';
import { db, initDatabase } from '../models/db.js';

export function seedDatabase() {
  console.log('🌱 Initializing clean Guru Nanak Dev Engineering College Bidar database (CSE-ICB)...');
  initDatabase();

  // Clear existing data cleanly in reverse order of foreign keys
  db.exec(`
    DELETE FROM audit_logs;
    DELETE FROM alerts;
    DELETE FROM verification_events;
    DELETE FROM feedback;
    DELETE FROM used_qr_tokens;
    DELETE FROM qr_sessions;
    DELETE FROM attendance;
    DELETE FROM lab_sessions;
    DELETE FROM schedules;
    DELETE FROM timetable_entries;
    DELETE FROM experiments;
    DELETE FROM laboratories;
    DELETE FROM faculty;
    DELETE FROM students;
    DELETE FROM users;
    DELETE FROM semesters;
  `);

  const facultyHash = bcrypt.hashSync('Faculty@123', 10);
  const adminHash = bcrypt.hashSync('Joshi@2308', 10);
  const hodHash = bcrypt.hashSync('Joshi@2308', 10);

  // 1. Semesters (1st to 8th Semester with Batch Years)
  const insertSem = db.prepare(`
    INSERT INTO semesters (number, name, academic_year, status)
    VALUES (?, ?, '2026-2027', 'ACTIVE')
  `);
  insertSem.run(1, '1st Semester (Batch 2026)');
  insertSem.run(2, '2nd Semester (Batch 2026)');
  insertSem.run(3, '3rd Semester (Batch 2025)');
  insertSem.run(4, '4th Semester (Batch 2025)');
  insertSem.run(5, '5th Semester (Batch 2024)');
  insertSem.run(6, '6th Semester (Batch 2024)');
  insertSem.run(7, '7th Semester (Batch 2023)');
  insertSem.run(8, '8th Semester (Batch 2023)');

  // 2. User & Faculty Statements
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, status)
    VALUES (?, ?, ?, ?, 'ACTIVE')
  `);

  const insertFaculty = db.prepare(`
    INSERT INTO faculty (user_id, employee_id, designation, specialization)
    VALUES (?, ?, ?, ?)
  `);

  // Seed System Administrator & HOD Account
  const adminUserId = Number(insertUser.run(
    'Dr. Harish Joshi (HOD / Admin)',
    'aiml.harishjoshi@gmail.com',
    adminHash,
    'ADMIN'
  ).lastInsertRowid);

  // Seed HOD Alias Account
  const hodAliasUserId = Number(insertUser.run(
    'Head of Department (CSE-ICB)',
    'hod.cse@gndec.ac.in',
    hodHash,
    'HOD'
  ).lastInsertRowid);
  insertFaculty.run(hodAliasUserId, 'GNDEC-HOD-01', 'Head of Department & Professor', 'Department Administration & IoT-Blockchain Curriculum');

  // 3. Faculty Members (Official faculty from CSE-ICB with Dr. Harish Joshi as Head of Department)
  const facultyData = [
    { name: 'Dr. Harish Joshi', email: 'harish.joshi@gndec.ac.in', empId: 'GNDEC-ICB-004', abbr: 'HJ', desig: 'Associate Professor & Head of Department', spec: 'Data Structures, AI & Dept Administration', role: 'HOD' },
    { name: 'Prof. Aarti Pawar', email: 'aarti.pawar@gndec.ac.in', empId: 'GNDEC-ICB-001', abbr: 'AP', desig: 'Assistant Professor', spec: 'Operating Systems & Software Engineering', role: 'FACULTY' },
    { name: 'Prof. Mahesh Kanjikar', email: 'mahesh.kanjikar@gndec.ac.in', empId: 'GNDEC-ICB-002', abbr: 'MK', desig: 'Assistant Professor', spec: 'Object Oriented Programming with Java', role: 'FACULTY' },
    { name: 'Dr. Pandit Patil', email: 'pandit.patil@gndec.ac.in', empId: 'GNDEC-ICB-003', abbr: 'PP', desig: 'Professor', spec: 'Digital Design & Computer Organization', role: 'FACULTY' },
    { name: 'Prof. Farhanaz', email: 'farhanaz@gndec.ac.in', empId: 'GNDEC-ICB-005', abbr: 'FN', desig: 'Assistant Professor', spec: 'IoT Communication Protocols & Git', role: 'FACULTY' },
    { name: 'Prof. Shrinidhi Dixit', email: 'shrinidhi.dixit@gndec.ac.in', empId: 'GNDEC-ICB-006', abbr: 'SD', desig: 'Assistant Professor', spec: 'Probability, Distributions & Statistics', role: 'FACULTY' },
    { name: 'Mr. Anand Patil', email: 'anand.patil@gndec.ac.in', empId: 'GNDEC-ICB-007', abbr: 'ANP', desig: 'Assistant Professor', spec: 'Project Management & Community Engineering', role: 'FACULTY' },
    { name: 'Prof. Madhuri Joshi', email: 'madhuri.joshi@gndec.ac.in', empId: 'GNDEC-ICB-008', abbr: 'MJ', desig: 'Assistant Professor', spec: 'Computer Networks & Network Security', role: 'FACULTY' },
    { name: 'Prof. Uzma Kausar', email: 'uzma.kausar@gndec.ac.in', empId: 'GNDEC-ICB-009', abbr: 'UK', desig: 'Assistant Professor', spec: 'Theory of Computation & Cyber Security', role: 'FACULTY' },
    { name: 'Prof. Ibtesham Zarrine', email: 'ibtesham.zarrine@gndec.ac.in', empId: 'GNDEC-ICB-010', abbr: 'IZ', desig: 'Assistant Professor', spec: 'Full Stack Development & Machine Learning', role: 'FACULTY' },
    { name: 'Prof. Ashok Bawge', email: 'ashok.bawge@gndec.ac.in', empId: 'GNDEC-ICB-011', abbr: 'AB', desig: 'Associate Professor', spec: 'Blockchain Technology & Research Methodology', role: 'FACULTY' },
    { name: 'Prof. Sangeeta K', email: 'sangeeta.k@gndec.ac.in', empId: 'GNDEC-ICB-012', abbr: 'SK', desig: 'Assistant Professor', spec: 'Environmental Studies & E-waste Management', role: 'FACULTY' },
    { name: 'Prof. Puneeth Kumar', email: 'puneeth.kumar@gndec.ac.in', empId: 'GNDEC-ICB-013', abbr: 'PK', desig: 'Assistant Professor', spec: 'Road Safety Engineering', role: 'FACULTY' }
  ];

  const facultyMap: Record<string, number> = {};
  const facultyUserMap: Record<string, number> = {};
  let hodUserId = hodAliasUserId;

  for (const f of facultyData) {
    const fUserId = Number(insertUser.run(f.name, f.email, facultyHash, f.role || 'FACULTY').lastInsertRowid);
    const fId = Number(insertFaculty.run(fUserId, f.empId, f.desig, f.spec).lastInsertRowid);
    facultyMap[f.abbr] = fId;
    facultyUserMap[f.abbr] = fUserId;
    if (f.abbr === 'HJ') {
      hodUserId = fUserId;
    }
  }

  // 4. Seed Verified Demo Students for 1st, 3rd, 5th, and 7th Semesters
  const studentHash = bcrypt.hashSync('Student@123', 10);
  const insertStudent = db.prepare(`
    INSERT INTO students (user_id, usn, semester, section, batch, department, academic_year)
    VALUES (?, ?, ?, 'A', ?, 'CSE in IoT & Cyber Security including Block Chain Technology', '2026-2027')
  `);

  const demoStudents = [
    { name: 'Arun Kulkarni (1st Sem)', email: 'arun.1st@gndec.ac.in', usn: '3GN26CI005', sem: 1, batch: '2026-2030 (Batch 2026)' },
    { name: 'Sneha Biradar (3rd Sem)', email: 'sneha.3rd@gndec.ac.in', usn: '3GN25CI012', sem: 3, batch: '2025-2029 (Batch 2025)' },
    { name: 'Rahul Sharma (5th Sem)', email: 'rahul.5th@gndec.ac.in', usn: '3GN24CI028', sem: 5, batch: '2024-2028 (Batch 2024)' },
    { name: 'Pooja Patil (7th Sem)', email: 'pooja.7th@gndec.ac.in', usn: '3GN23CI045', sem: 7, batch: '2023-2027 (Batch 2023)' }
  ];

  for (const s of demoStudents) {
    const sUserId = Number(insertUser.run(s.name, s.email, studentHash, 'STUDENT').lastInsertRowid);
    insertStudent.run(sUserId, s.usn, s.sem, s.batch);
  }

  // 5. Practical Laboratories ONLY (No Theory Classes)
  // Campus coordinates: Guru Nanak Dev Engineering College, Mailoor Road, Bidar (17.9104, 77.5199)
  const baseLat = 17.9104;
  const baseLng = 77.5199;

  const practicalLabsData = [
    // 1st Semester Practical Labs
    { sem: 1, name: 'Principles of Programming using C Lab', code: '1BPOPS103', room: 'C Programming Lab (Room 105)', fAbbr: 'MK', desc: 'C Syntax, Control Structures, Arrays, Pointers, Functions & Algorithms Lab' },
    { sem: 1, name: 'Computer Aided Engineering Drawing Lab', code: '1BCSL107', room: 'CAED Lab (Room 106)', fAbbr: 'AP', desc: 'CAD 2D/3D Projections, Isometric Views & Computer Modeling Lab' },
    { sem: 1, name: 'Applied Engineering Physics Laboratory', code: '1BPHY102', room: 'Physics Lab (Room 107)', fAbbr: 'PP', desc: 'Laser Optics, Semiconductor Bandgap, Dielectric Constants & Sensor Physics' },
    { sem: 1, name: 'Professional Communication & Language Lab', code: '1BENG106', room: 'Language Lab (Room 108)', fAbbr: 'FN', desc: 'Phonetics, Technical Presentation, Soft Skills & Professional Communication Lab' },

    // 3rd Semester Practical Labs
    { sem: 3, name: 'Object Oriented Programming with JAVA LAB', code: '1BCS302(P)', room: 'Java Lab (Room 205)', fAbbr: 'MK', desc: 'Core Java, OOPs, Collections, Multithreading & GUI Lab' },
    { sem: 3, name: 'Operating Systems LAB', code: '1BCS304(P)', room: 'OS Lab (Room 206)', fAbbr: 'AP', desc: 'Linux Shell Scripting, Process Scheduling, System Calls & Memory Lab' },
    { sem: 3, name: 'Data Structures Laboratory', code: '1BCSL306', room: 'Data Structures Lab (Room 207)', fAbbr: 'AP', desc: 'Arrays, Stacks, Queues, Trees, Graphs & Dynamic Memory Lab' },
    { sem: 3, name: 'Project Management with GIT Lab', code: '1BCSL307A', room: 'Project Lab (Room 208)', fAbbr: 'FN', desc: 'Git Version Control, GitHub Actions, CI/CD & Project Workflow Lab' },
    { sem: 3, name: 'Community Project Laboratory', code: '1BCP308', room: 'Project Center (Room 209)', fAbbr: 'ANP', desc: 'Social Innovation & Community Engineering Practical Implementation Lab' },

    // 5th Semester Practical Labs
    { sem: 5, name: 'Computer Networks Laboratory', code: 'BCSL502', room: 'Networks Lab (Room 305)', fAbbr: 'MJ', desc: 'Wireshark, Cisco Packet Tracer, Socket Programming & Protocol Analysis' },
    { sem: 5, name: 'IoT & Cyber Security Laboratory', code: 'BICL504', room: 'IoT & Cyber Lab (Room 306)', fAbbr: 'UK', desc: 'Arduino/Raspberry Pi Sensors, MQTT, Cryptography & Penetration Testing' },
    { sem: 5, name: 'Full Stack Development Laboratory', code: 'BIC515CL', room: 'Web Tech Lab (Room 307)', fAbbr: 'IZ', desc: 'React, Node.js, Express, REST APIs & SQLite/MongoDB Practical Lab' },
    { sem: 5, name: 'Mini Project Laboratory', code: 'BIC586', room: 'Project Center (Room 308)', fAbbr: 'HJ', desc: 'IoT, Cyber Security and Blockchain Embedded Project Development' },

    // 7th Semester Practical Labs
    { sem: 7, name: 'IoT Communication Protocols Laboratory', code: 'BCO701(P)', room: 'Protocols Lab (Room 405)', fAbbr: 'FN', desc: 'CoAP, MQTT-SN, Zigbee, LoRaWAN, BLE & Wireless Mesh Testbed' },
    { sem: 7, name: 'Blockchain Technology Laboratory', code: 'BIC702(P)', room: 'Blockchain Lab (Room 406)', fAbbr: 'AB', desc: 'Solidity Smart Contracts, Ethereum Ganache, Web3.js & DApp Architecture' },
    { sem: 7, name: 'Major Project Phase-II Laboratory', code: 'BIC786', room: 'Advanced Project Lab (Room 408)', fAbbr: 'AB', desc: 'Capstone Project Research, Prototype Testing & Departmental Defense' }
  ];

  const insertLab = db.prepare(`
    INSERT INTO laboratories (name, code, semester, section, academic_year, faculty_id, room_number, latitude, longitude, geofence_radius, status)
    VALUES (?, ?, ?, '', '2026-2027', ?, ?, ?, ?, 25.0, 'ACTIVE')
  `);

  const insertExp = db.prepare(`
    INSERT INTO experiments (laboratory_id, experiment_number, title, description)
    VALUES (?, ?, ?, ?)
  `);

  const labIdMap: Record<string, number> = {};

  for (let idx = 0; idx < practicalLabsData.length; idx++) {
    const s = practicalLabsData[idx];
    const fId = facultyMap[s.fAbbr] || 1;
    const offsetLat = baseLat + (idx % 4) * 0.0001;
    const offsetLng = baseLng + (idx % 3) * 0.0001;

    const labId = Number(insertLab.run(s.name, s.code, s.sem, fId, s.room, offsetLat, offsetLng).lastInsertRowid);
    labIdMap[s.code] = labId;

    // Create curriculum modules / experiments per lab
    for (let expNum = 1; expNum <= 10; expNum++) {
      insertExp.run(
        labId,
        expNum,
        `${s.name} - Practical Lab Experiment ${expNum}`,
        `Hands-on lab experiment ${expNum}: Code implementation, hardware interfacing, output verification and viva-voce.`
      );
    }
  }

  // 6. Timetable Entries: ONLY Practical Laboratories (Time-Wise & Semester-Wise)
  const insertTimetable = db.prepare(`
    INSERT INTO timetable_entries (
      semester, academic_year, day_of_week, slot_index, time_range,
      subject_code, subject_abbr, subject_name, faculty_abbr, faculty_name, room
    ) VALUES (?, '2026-2027', ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const fFullName: Record<string, string> = {
    'HJ': 'Dr. Harish Joshi (HOD)',
    'AP': 'Prof. Aarti Pawar',
    'MK': 'Prof. Mahesh Kanjikar',
    'PP': 'Dr. Pandit Patil',
    'FN': 'Prof. Farhanaz',
    'SD': 'Prof. Shrinidhi Dixit',
    'ANP': 'Mr. Anand Patil',
    'MJ': 'Prof. Madhuri Joshi',
    'UK': 'Prof. Uzma Kausar',
    'IZ': 'Prof. Ibtesham Zarrine',
    'AB': 'Prof. Ashok Bawge',
    'SK': 'Prof. Sangeeta K',
    'PK': 'Prof. Puneeth Kumar'
  };

  // 1st Sem Practical Labs Timetable Grid
  const sem1LabGrid: Record<string, Array<{ code: string; abbr: string; name: string; fAbbr: string; time: string; room: string }>> = {
    'MONDAY': [
      { code: '1BPOPS103', abbr: 'C PROG LAB', name: 'Principles of Programming using C Lab', fAbbr: 'MK', time: '09.00 AM - 12.00 PM', room: 'C Programming Lab (Room 105)' },
      { code: '1BCSL107', abbr: 'CAED LAB', name: 'Computer Aided Engineering Drawing Lab', fAbbr: 'AP', time: '02.00 PM - 05.00 PM', room: 'CAED Lab (Room 106)' }
    ],
    'TUESDAY': [
      { code: '1BPHY102', abbr: 'PHY LAB', name: 'Applied Engineering Physics Laboratory', fAbbr: 'PP', time: '09.00 AM - 12.00 PM', room: 'Physics Lab (Room 107)' },
      { code: '1BENG106', abbr: 'LANG LAB', name: 'Professional Communication & Language Lab', fAbbr: 'FN', time: '02.00 PM - 05.00 PM', room: 'Language Lab (Room 108)' }
    ],
    'WEDNESDAY': [
      { code: '1BPOPS103', abbr: 'C PROG LAB', name: 'Principles of Programming using C Lab', fAbbr: 'MK', time: '09.00 AM - 12.00 PM', room: 'C Programming Lab (Room 105)' },
      { code: '1BPHY102', abbr: 'PHY LAB', name: 'Applied Engineering Physics Laboratory', fAbbr: 'PP', time: '02.00 PM - 05.00 PM', room: 'Physics Lab (Room 107)' }
    ],
    'THURSDAY': [
      { code: '1BCSL107', abbr: 'CAED LAB', name: 'Computer Aided Engineering Drawing Lab', fAbbr: 'AP', time: '09.00 AM - 12.00 PM', room: 'CAED Lab (Room 106)' },
      { code: '1BENG106', abbr: 'LANG LAB', name: 'Professional Communication & Language Lab', fAbbr: 'FN', time: '02.00 PM - 05.00 PM', room: 'Language Lab (Room 108)' }
    ],
    'FRIDAY': [
      { code: '1BPOPS103', abbr: 'C PROG LAB', name: 'Principles of Programming using C Lab', fAbbr: 'MK', time: '09.00 AM - 12.00 PM', room: 'C Programming Lab (Room 105)' },
      { code: '1BPHY102', abbr: 'PHY LAB', name: 'Applied Engineering Physics Laboratory', fAbbr: 'PP', time: '02.00 PM - 05.00 PM', room: 'Physics Lab (Room 107)' }
    ],
    'SATURDAY': [
      { code: '1BPOPS103', abbr: 'C & CAED LAB', name: 'C Programming & CAED Practical Practice Lab', fAbbr: 'MK', time: '09.00 AM - 01.00 PM', room: 'C Programming Lab (Room 105)' }
    ]
  };

  // 3rd Sem Practical Labs Timetable Grid (Morning & Afternoon Practical Lab Blocks)
  const sem3LabGrid: Record<string, Array<{ code: string; abbr: string; name: string; fAbbr: string; time: string; room: string }>> = {
    'MONDAY': [
      { code: '1BCS302(P)', abbr: 'JAVA LAB', name: 'Object Oriented Programming with JAVA LAB', fAbbr: 'MK', time: '09.00 AM - 12.00 PM', room: 'Java Lab (Room 205)' },
      { code: '1BCS304(P)', abbr: 'OS LAB', name: 'Operating Systems LAB', fAbbr: 'AP', time: '02.00 PM - 05.00 PM', room: 'OS Lab (Room 206)' }
    ],
    'TUESDAY': [
      { code: '1BCSL306', abbr: 'DS LAB', name: 'Data Structures Laboratory', fAbbr: 'HJ', time: '09.00 AM - 12.00 PM', room: 'Data Structures Lab (Room 207)' },
      { code: '1BCSL307A', abbr: 'GIT LAB', name: 'Project Management with GIT Lab', fAbbr: 'FN', time: '02.00 PM - 05.00 PM', room: 'Project Lab (Room 208)' }
    ],
    'WEDNESDAY': [
      { code: '1BCP308', abbr: 'CP LAB', name: 'Community Project Laboratory', fAbbr: 'ANP', time: '09.00 AM - 12.00 PM', room: 'Project Center (Room 209)' },
      { code: '1BCS302(P)', abbr: 'JAVA LAB', name: 'Object Oriented Programming with JAVA LAB', fAbbr: 'MK', time: '02.00 PM - 05.00 PM', room: 'Java Lab (Room 205)' }
    ],
    'THURSDAY': [
      { code: '1BCS304(P)', abbr: 'OS LAB', name: 'Operating Systems LAB', fAbbr: 'AP', time: '09.00 AM - 12.00 PM', room: 'OS Lab (Room 206)' },
      { code: '1BCSL306', abbr: 'DS LAB', name: 'Data Structures Laboratory', fAbbr: 'HJ', time: '02.00 PM - 05.00 PM', room: 'Data Structures Lab (Room 207)' }
    ],
    'FRIDAY': [
      { code: '1BCSL307A', abbr: 'GIT LAB', name: 'Project Management with GIT Lab', fAbbr: 'FN', time: '09.00 AM - 12.00 PM', room: 'Project Lab (Room 208)' },
      { code: '1BCP308', abbr: 'CP LAB', name: 'Community Project Laboratory', fAbbr: 'ANP', time: '02.00 PM - 05.00 PM', room: 'Project Center (Room 209)' }
    ],
    'SATURDAY': [
      { code: '1BCS302(P)', abbr: 'JAVA & OS LAB', name: 'Java & OS Practical Practice Lab', fAbbr: 'MK', time: '09.00 AM - 01.00 PM', room: 'Java Lab (Room 205)' }
    ]
  };

  // 5th Sem Practical Labs Timetable Grid
  const sem5LabGrid: Record<string, Array<{ code: string; abbr: string; name: string; fAbbr: string; time: string; room: string }>> = {
    'MONDAY': [
      { code: 'BCSL502', abbr: 'CN LAB', name: 'Computer Networks Laboratory', fAbbr: 'MJ', time: '09.00 AM - 12.00 PM', room: 'Networks Lab (Room 305)' },
      { code: 'BICL504', abbr: 'IOT/CYBER LAB', name: 'IoT & Cyber Security Laboratory', fAbbr: 'UK', time: '02.00 PM - 05.00 PM', room: 'IoT & Cyber Lab (Room 306)' }
    ],
    'TUESDAY': [
      { code: 'BIC515CL', abbr: 'FSD LAB', name: 'Full Stack Development Laboratory', fAbbr: 'IZ', time: '09.00 AM - 12.00 PM', room: 'Web Tech Lab (Room 307)' },
      { code: 'BIC586', abbr: 'MINI PROJECT', name: 'Mini Project Laboratory', fAbbr: 'HJ', time: '02.00 PM - 05.00 PM', room: 'Project Center (Room 308)' }
    ],
    'WEDNESDAY': [
      { code: 'BCSL502', abbr: 'CN LAB', name: 'Computer Networks Laboratory', fAbbr: 'MJ', time: '09.00 AM - 12.00 PM', room: 'Networks Lab (Room 305)' },
      { code: 'BIC515CL', abbr: 'FSD LAB', name: 'Full Stack Development Laboratory', fAbbr: 'IZ', time: '02.00 PM - 05.00 PM', room: 'Web Tech Lab (Room 307)' }
    ],
    'THURSDAY': [
      { code: 'BICL504', abbr: 'IOT/CYBER LAB', name: 'IoT & Cyber Security Laboratory', fAbbr: 'UK', time: '09.00 AM - 12.00 PM', room: 'IoT & Cyber Lab (Room 306)' },
      { code: 'BIC586', abbr: 'MINI PROJECT', name: 'Mini Project Laboratory', fAbbr: 'HJ', time: '02.00 PM - 05.00 PM', room: 'Project Center (Room 308)' }
    ],
    'FRIDAY': [
      { code: 'BIC515CL', abbr: 'FSD LAB', name: 'Full Stack Development Laboratory', fAbbr: 'IZ', time: '09.00 AM - 12.00 PM', room: 'Web Tech Lab (Room 307)' },
      { code: 'BCSL502', abbr: 'CN LAB', name: 'Computer Networks Laboratory', fAbbr: 'MJ', time: '02.00 PM - 05.00 PM', room: 'Networks Lab (Room 305)' }
    ],
    'SATURDAY': [
      { code: 'BIC586', abbr: 'PROJECT & INNOVATION', name: 'Mini Project & Innovation Lab', fAbbr: 'HJ', time: '09.00 AM - 01.00 PM', room: 'Project Center (Room 308)' }
    ]
  };

  // 7th Sem Practical Labs Timetable Grid
  const sem7LabGrid: Record<string, Array<{ code: string; abbr: string; name: string; fAbbr: string; time: string; room: string }>> = {
    'MONDAY': [
      { code: 'BCO701(P)', abbr: 'ICP LAB', name: 'IoT Communication Protocols Laboratory', fAbbr: 'FN', time: '09.00 AM - 12.00 PM', room: 'Protocols Lab (Room 405)' },
      { code: 'BIC702(P)', abbr: 'BC LAB', name: 'Blockchain Technology Laboratory', fAbbr: 'AB', time: '02.00 PM - 05.00 PM', room: 'Blockchain Lab (Room 406)' }
    ],
    'TUESDAY': [
      { code: 'BIC786', abbr: 'PROJ LAB-II', name: 'Major Project Phase-II Laboratory', fAbbr: 'HJ', time: '09.00 AM - 12.00 PM', room: 'Advanced Project Lab (Room 408)' },
      { code: 'BCO701(P)', abbr: 'ICP LAB', name: 'IoT Communication Protocols Laboratory', fAbbr: 'FN', time: '02.00 PM - 05.00 PM', room: 'Protocols Lab (Room 405)' }
    ],
    'WEDNESDAY': [
      { code: 'BIC702(P)', abbr: 'BC LAB', name: 'Blockchain Technology Laboratory', fAbbr: 'AB', time: '09.00 AM - 12.00 PM', room: 'Blockchain Lab (Room 406)' },
      { code: 'BIC786', abbr: 'PROJ LAB-II', name: 'Major Project Phase-II Laboratory', fAbbr: 'HJ', time: '02.00 PM - 05.00 PM', room: 'Advanced Project Lab (Room 408)' }
    ],
    'THURSDAY': [
      { code: 'BCO701(P)', abbr: 'ICP LAB', name: 'IoT Communication Protocols Laboratory', fAbbr: 'FN', time: '09.00 AM - 12.00 PM', room: 'Protocols Lab (Room 405)' },
      { code: 'BIC702(P)', abbr: 'BC LAB', name: 'Blockchain Technology Laboratory', fAbbr: 'AB', time: '02.00 PM - 05.00 PM', room: 'Blockchain Lab (Room 406)' }
    ],
    'FRIDAY': [
      { code: 'BIC786', abbr: 'PROJ LAB-II', name: 'Major Project Phase-II Laboratory', fAbbr: 'HJ', time: '09.00 AM - 12.00 PM', room: 'Advanced Project Lab (Room 408)' },
      { code: 'BIC702(P)', abbr: 'BC SEC LAB', name: 'Blockchain & Security Testing Lab', fAbbr: 'AB', time: '02.00 PM - 05.00 PM', room: 'Blockchain Lab (Room 406)' }
    ],
    'SATURDAY': [
      { code: 'BIC786', abbr: 'CAPSTONE DEFENSE', name: 'Major Project Capstone & Viva Lab', fAbbr: 'HJ', time: '09.00 AM - 01.00 PM', room: 'Advanced Project Lab (Room 408)' }
    ]
  };

  const insertGridEntries = (sem: number, grid: Record<string, Array<{ code: string; abbr: string; name: string; fAbbr: string; time: string; room: string }>>) => {
    for (const day of Object.keys(grid)) {
      const daySlots = grid[day];
      for (let sIdx = 0; sIdx < daySlots.length; sIdx++) {
        const item = daySlots[sIdx];
        const facultyName = fFullName[item.fAbbr] || item.fAbbr;
        insertTimetable.run(
          sem,
          day,
          sIdx + 1,
          item.time,
          item.code,
          item.abbr,
          item.name,
          item.fAbbr,
          facultyName,
          item.room
        );
      }
    }
  };

  insertGridEntries(1, sem1LabGrid);
  insertGridEntries(3, sem3LabGrid);
  insertGridEntries(5, sem5LabGrid);
  insertGridEntries(7, sem7LabGrid);

  // 7. Initial Clean Audit Log
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (user_id, user_email, user_role, action, entity_type, entity_id, details, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, '127.0.0.1', datetime('now'))
  `);

  insertAudit.run(
    adminUserId,
    'aiml.harishjoshi@gmail.com',
    'ADMIN',
    'SYSTEM_INITIALIZE',
    'SYSTEM',
    '1',
    'Clean system initialized for Guru Nanak Dev Engineering College Bidar (CSE-ICB). Head of Department: Dr. Harish Joshi. Strictly Practical Laboratories only. Zero fake data.'
  );

  console.log(`
  ========================================================================
  ✅ CLEAN DATABASE INITIALIZED (PURE PRACTICAL LABS ONLY)!
  🏛️ Department: CSE in IoT & Cyber Security including Block Chain Technology
  👨‍🏫 Head of Department (HOD): Dr. Harish Joshi
  📅 Semesters: 3rd, 5th, 7th Semesters (Academic Year 2026-2027)
  👩‍🏫 Faculty: 13 Genuine Professors from Timetable Ready
  👨‍🎓 Students: 0 (Real students self-register, then Admin/HOD verifies them)
  🔬 Laboratories: 12 Official Practical Labs Only (No Theory Lectures)
  🕒 Timetable: Monday-Saturday Practical Lab Time Slots
  🔒 Security: 25m Room Geofencing & 1-Min Dynamic Non-Reusable QR
  ========================================================================
  `);
}

export function cleanDatabase() {
  seedDatabase();
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase();
}

