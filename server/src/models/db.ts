import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.resolve(dbDir, 'labguard.sqlite');
export const db = new DatabaseSync(dbPath);

// Enable foreign keys and WAL mode for reliability
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  const schema = `
    CREATE TABLE IF NOT EXISTS semesters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number INTEGER UNIQUE NOT NULL,
      name TEXT NOT NULL,
      academic_year TEXT NOT NULL DEFAULT '2026-2027',
      status TEXT DEFAULT 'ACTIVE',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('ADMIN', 'HOD', 'FACULTY', 'STUDENT')),
      status TEXT DEFAULT 'ACTIVE',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      usn TEXT UNIQUE NOT NULL,
      semester INTEGER NOT NULL DEFAULT 7,
      section TEXT DEFAULT '',
      batch TEXT NOT NULL DEFAULT '2023-2027',
      department TEXT NOT NULL DEFAULT 'CSE in IoT & Cyber Security including Block Chain Technology',
      academic_year TEXT NOT NULL DEFAULT '2026-2027',
      phone TEXT,
      profile_photo TEXT
    );

    CREATE TABLE IF NOT EXISTS faculty (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      employee_id TEXT UNIQUE NOT NULL,
      designation TEXT NOT NULL,
      specialization TEXT
    );

    CREATE TABLE IF NOT EXISTS laboratories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      semester INTEGER NOT NULL DEFAULT 7,
      section TEXT DEFAULT '',
      academic_year TEXT NOT NULL DEFAULT '2026-2027',
      faculty_id INTEGER REFERENCES faculty(id),
      room_number TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      geofence_radius REAL NOT NULL DEFAULT 25.0,
      status TEXT DEFAULT 'ACTIVE',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS experiments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      laboratory_id INTEGER NOT NULL REFERENCES laboratories(id) ON DELETE CASCADE,
      experiment_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      objectives TEXT,
      tools_required TEXT,
      UNIQUE(laboratory_id, experiment_number)
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      laboratory_id INTEGER NOT NULL REFERENCES laboratories(id) ON DELETE CASCADE,
      faculty_id INTEGER NOT NULL REFERENCES faculty(id),
      day_of_week TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      room TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lab_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_code TEXT UNIQUE NOT NULL,
      laboratory_id INTEGER NOT NULL REFERENCES laboratories(id),
      faculty_id INTEGER NOT NULL REFERENCES faculty(id),
      experiment_id INTEGER NOT NULL REFERENCES experiments(id),
      semester INTEGER NOT NULL,
      section TEXT DEFAULT '',
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
      qr_refresh_interval INTEGER DEFAULT 60,
      started_at TEXT DEFAULT (datetime('now')),
      ended_at TEXT
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id),
      lab_session_id INTEGER REFERENCES lab_sessions(id),
      experiment_id INTEGER REFERENCES experiments(id),
      timestamp TEXT DEFAULT (datetime('now')),
      latitude REAL DEFAULT 17.9104,
      longitude REAL DEFAULT 77.5199,
      accuracy REAL DEFAULT 10.0,
      distance_to_lab REAL DEFAULT 5.0,
      geofence_status TEXT DEFAULT 'INSIDE',
      verification_status TEXT NOT NULL DEFAULT 'PRESENT',
      device_fingerprint TEXT,
      marked_by_faculty_id INTEGER REFERENCES faculty(id),
      remarks TEXT,
      attendance_mode TEXT DEFAULT 'ROSTER',
      UNIQUE(student_id, lab_session_id)
    );

    CREATE TABLE IF NOT EXISTS timetable_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      semester INTEGER NOT NULL,
      academic_year TEXT DEFAULT '2026-2027',
      day_of_week TEXT NOT NULL,
      slot_index INTEGER NOT NULL,
      time_range TEXT NOT NULL,
      subject_code TEXT NOT NULL,
      subject_abbr TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      faculty_abbr TEXT NOT NULL,
      faculty_name TEXT NOT NULL,
      room TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS qr_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lab_session_id INTEGER NOT NULL REFERENCES lab_sessions(id),
      token_hash TEXT UNIQUE NOT NULL,
      plain_token TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'EXPIRED', 'REVOKED'))
    );

    CREATE TABLE IF NOT EXISTS used_qr_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_hash TEXT NOT NULL,
      student_id INTEGER NOT NULL REFERENCES students(id),
      lab_session_id INTEGER NOT NULL REFERENCES lab_sessions(id),
      device_fingerprint TEXT,
      used_at TEXT DEFAULT (datetime('now')),
      UNIQUE(token_hash, student_id),
      UNIQUE(student_id, lab_session_id)
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id),
      lab_session_id INTEGER NOT NULL REFERENCES lab_sessions(id),
      experiment_id INTEGER NOT NULL REFERENCES experiments(id),
      teaching_basics TEXT NOT NULL,
      hands_on TEXT NOT NULL,
      doubt_support TEXT,
      reason_understanding TEXT,
      viva_taken TEXT,
      hardware_setup TEXT,
      teacher_guidance TEXT,
      lab_punctuality TEXT,
      overall_rating INTEGER DEFAULT 5,
      anonymous_to_teacher INTEGER DEFAULT 1,
      viva TEXT,
      understanding TEXT,
      comments TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      accuracy REAL NOT NULL,
      distance_to_lab REAL NOT NULL,
      qr_token_used TEXT NOT NULL,
      submitted_at TEXT DEFAULT (datetime('now')),
      verification_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(verification_status IN ('VERIFIED', 'MISMATCH', 'SUSPICIOUS', 'INVALID', 'PENDING REVIEW')),
      flags TEXT,
      UNIQUE(student_id, lab_session_id)
    );

    CREATE TABLE IF NOT EXISTS verification_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER REFERENCES students(id),
      lab_session_id INTEGER REFERENCES lab_sessions(id),
      feedback_id INTEGER REFERENCES feedback(id),
      event_type TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
      rule_code TEXT NOT NULL,
      reason TEXT NOT NULL,
      payload_details TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
      student_id INTEGER REFERENCES students(id),
      lab_session_id INTEGER REFERENCES lab_sessions(id),
      message TEXT NOT NULL,
      status TEXT DEFAULT 'UNRESOLVED' CHECK(status IN ('UNRESOLVED', 'INVESTIGATING', 'RESOLVED', 'DISMISSED')),
      resolution_notes TEXT,
      resolved_by INTEGER REFERENCES users(id),
      resolved_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      user_email TEXT,
      user_role TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_students_usn ON students(usn);
    CREATE INDEX IF NOT EXISTS idx_lab_sessions_status ON lab_sessions(status);
    CREATE INDEX IF NOT EXISTS idx_attendance_student_session ON attendance(student_id, lab_session_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_student_session ON feedback(student_id, lab_session_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
  `;

  db.exec(schema);

  // Check if existing feedback table has legacy restrictive CHECK constraint
  try {
    const tableSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='feedback'").get() as any;
    if (tableSql && tableSql.sql && tableSql.sql.includes("teaching_basics IN ('Excellent'")) {
      db.exec(`
        PRAGMA foreign_keys=OFF;
        CREATE TABLE feedback_migrated (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER NOT NULL REFERENCES students(id),
          lab_session_id INTEGER NOT NULL REFERENCES lab_sessions(id),
          experiment_id INTEGER NOT NULL REFERENCES experiments(id),
          teaching_basics TEXT NOT NULL,
          hands_on TEXT NOT NULL,
          doubt_support TEXT,
          reason_understanding TEXT,
          viva_taken TEXT,
          hardware_setup TEXT,
          teacher_guidance TEXT,
          lab_punctuality TEXT,
          overall_rating INTEGER DEFAULT 5,
          anonymous_to_teacher INTEGER DEFAULT 1,
          viva TEXT,
          understanding TEXT,
          comments TEXT,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          accuracy REAL NOT NULL,
          distance_to_lab REAL NOT NULL,
          qr_token_used TEXT NOT NULL,
          submitted_at TEXT DEFAULT (datetime('now')),
          verification_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(verification_status IN ('VERIFIED', 'MISMATCH', 'SUSPICIOUS', 'INVALID', 'PENDING REVIEW')),
          flags TEXT,
          UNIQUE(student_id, lab_session_id)
        );
        INSERT OR IGNORE INTO feedback_migrated (
          id, student_id, lab_session_id, experiment_id, teaching_basics, hands_on, viva, understanding, comments, latitude, longitude, accuracy, distance_to_lab, qr_token_used, submitted_at, verification_status, flags
        ) SELECT id, student_id, lab_session_id, experiment_id, teaching_basics, hands_on, viva, understanding, comments, latitude, longitude, accuracy, distance_to_lab, qr_token_used, submitted_at, verification_status, flags FROM feedback;
        DROP TABLE feedback;
        ALTER TABLE feedback_migrated RENAME TO feedback;
        PRAGMA foreign_keys=ON;
      `);
      console.log('✅ Migrated feedback table: removed legacy restrictive check constraints.');
    }
  } catch (migErr) {
    console.warn('Feedback table migration note:', migErr);
  }

  // Safe migrations for expanded feedback columns on existing databases
  const feedbackMigrations = [
    { name: 'doubt_support', type: 'TEXT' },
    { name: 'reason_understanding', type: 'TEXT' },
    { name: 'viva_taken', type: 'TEXT' },
    { name: 'hardware_setup', type: 'TEXT' },
    { name: 'teacher_guidance', type: 'TEXT' },
    { name: 'lab_punctuality', type: 'TEXT' },
    { name: 'overall_rating', type: 'INTEGER DEFAULT 5' },
    { name: 'anonymous_to_teacher', type: 'INTEGER DEFAULT 1' },
    { name: 'software_setup', type: 'TEXT' },
    { name: 'laboratory_id', type: 'INTEGER' },
    { name: 'faculty_id', type: 'INTEGER' }
  ];

  for (const col of feedbackMigrations) {
    try {
      db.exec(`ALTER TABLE feedback ADD COLUMN ${col.name} ${col.type}`);
    } catch {
      // Column already exists, safe to ignore
    }
  }

  // Safe migrations for attendance columns
  const attendanceMigrations = [
    { name: 'marked_by_faculty_id', type: 'INTEGER' },
    { name: 'remarks', type: 'TEXT' },
    { name: 'attendance_mode', type: "TEXT DEFAULT 'ROSTER'" }
  ];

  for (const col of attendanceMigrations) {
    try {
      db.exec(`ALTER TABLE attendance ADD COLUMN ${col.name} ${col.type}`);
    } catch {
      // Column already exists, safe to ignore
    }
  }

  // Check if attendance table has restrictive verification_status constraint
  try {
    const attSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='attendance'").get() as any;
    if (attSql && attSql.sql && !attSql.sql.includes("'ABSENT'")) {
      db.exec(`
        PRAGMA foreign_keys=OFF;
        CREATE TABLE attendance_migrated (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER NOT NULL REFERENCES students(id),
          lab_session_id INTEGER REFERENCES lab_sessions(id),
          experiment_id INTEGER REFERENCES experiments(id),
          timestamp TEXT DEFAULT (datetime('now')),
          latitude REAL DEFAULT 17.9104,
          longitude REAL DEFAULT 77.5199,
          accuracy REAL DEFAULT 10.0,
          distance_to_lab REAL DEFAULT 5.0,
          geofence_status TEXT DEFAULT 'INSIDE',
          verification_status TEXT NOT NULL DEFAULT 'PRESENT',
          device_fingerprint TEXT,
          marked_by_faculty_id INTEGER REFERENCES faculty(id),
          remarks TEXT,
          attendance_mode TEXT DEFAULT 'ROSTER',
          UNIQUE(student_id, lab_session_id)
        );
        INSERT OR IGNORE INTO attendance_migrated (
          id, student_id, lab_session_id, experiment_id, timestamp, latitude, longitude, accuracy, distance_to_lab, geofence_status, verification_status, device_fingerprint, marked_by_faculty_id, remarks, attendance_mode
        ) SELECT id, student_id, lab_session_id, experiment_id, timestamp, latitude, longitude, accuracy, distance_to_lab, geofence_status, verification_status, device_fingerprint, marked_by_faculty_id, remarks, attendance_mode FROM attendance;
        DROP TABLE attendance;
        ALTER TABLE attendance_migrated RENAME TO attendance;
        PRAGMA foreign_keys=ON;
      `);
      console.log('✅ Migrated attendance table: enabled ABSENT status & roster mode.');
    }
  } catch (attMigErr) {
    console.warn('Attendance migration note:', attMigErr);
  }

  console.log('✅ SQLite Database schema initialized successfully at:', dbPath);
}


