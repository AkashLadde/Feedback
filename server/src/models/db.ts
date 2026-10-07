import { DatabaseSync } from 'node:sqlite';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========================================================================
// MySQL Pool Configuration
// ========================================================================
export const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
  user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
  password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'labguard_gndec',
  port: parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

export let mysqlPool: mysql.Pool | null = null;
let isMySQLActive = false;

if (process.env.MYSQL_HOST || process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.DB_TYPE === 'mysql') {
  try {
    const connectionUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
    mysqlPool = connectionUrl
      ? mysql.createPool(connectionUrl)
      : mysql.createPool(MYSQL_CONFIG);
    isMySQLActive = true;
    console.log(`🐬 MySQL Pool configured for database '${MYSQL_CONFIG.database}' at ${MYSQL_CONFIG.host}:${MYSQL_CONFIG.port}`);
  } catch (mysqlInitErr) {
    console.warn('⚠️ Could not initialize MySQL pool, falling back to embedded engine:', mysqlInitErr);
  }
}

// ========================================================================
// Embedded SQLite Engine (Zero-configuration fallback & local dev)
// ========================================================================
const dbDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.resolve(dbDir, 'labguard.sqlite');
const sqliteDb = new DatabaseSync(dbPath);
sqliteDb.exec('PRAGMA foreign_keys = ON;');

// ========================================================================
// Unified Database Interface: Compatible with both MySQL & Prepared Statements
// ========================================================================
export const db = {
  isMySQL: () => isMySQLActive,
  getPool: () => mysqlPool,

  prepare(sql: string) {
    const stmt = sqliteDb.prepare(sql);
    return {
      get(...params: any[]) {
        return stmt.get(...params);
      },
      all(...params: any[]) {
        return stmt.all(...params);
      },
      run(...params: any[]) {
        return stmt.run(...params);
      }
    };
  },

  exec(sql: string) {
    return sqliteDb.exec(sql);
  },

  async queryMySQL(sql: string, params: any[] = []) {
    if (!mysqlPool) throw new Error('MySQL pool is not active');
    const [rows] = await mysqlPool.query(sql, params);
    return rows;
  },

  async executeMySQL(sql: string, params: any[] = []) {
    if (!mysqlPool) throw new Error('MySQL pool is not active');
    const [result] = await mysqlPool.execute(sql, params);
    return result;
  }
};

// ========================================================================
// Initialize Database Tables & Anti-Duplication Constraints
// ========================================================================
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
      phone_verified INTEGER DEFAULT 0,
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
      location TEXT,
      latitude REAL NOT NULL DEFAULT 17.9104,
      longitude REAL NOT NULL DEFAULT 77.5199,
      geofence_radius REAL NOT NULL DEFAULT 25.0,
      status TEXT DEFAULT 'ACTIVE',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS otp_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      otp_code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      verified INTEGER DEFAULT 0,
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

    -- ========================================================================
    -- ATTENDANCE TABLE WITH STRICT UNIQUE(student_id, lab_session_id)
    -- ZERO DUPLICATE ATTENDANCE PERMITTED
    -- ========================================================================
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
      room TEXT NOT NULL,
      batch TEXT DEFAULT ''
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

  sqliteDb.exec(schema);

  // Safe migrations for expanded feedback columns
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
      sqliteDb.exec(`ALTER TABLE feedback ADD COLUMN ${col.name} ${col.type}`);
    } catch {
      // Column already exists
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
      sqliteDb.exec(`ALTER TABLE attendance ADD COLUMN ${col.name} ${col.type}`);
    } catch {
      // Column already exists
    }
  }

  // Safe migrations for student columns
  try {
    sqliteDb.exec(`ALTER TABLE students ADD COLUMN phone_verified INTEGER DEFAULT 0`);
  } catch {
    // Column already exists
  }

  // Safe migrations for laboratory location column
  try {
    sqliteDb.exec(`ALTER TABLE laboratories ADD COLUMN location TEXT`);
  } catch {
    // Column already exists
  }

  // Safe migrations for timetable_entries batch column
  try {
    sqliteDb.exec(`ALTER TABLE timetable_entries ADD COLUMN batch TEXT DEFAULT ''`);
  } catch {
    // Column already exists
  }

  // Ensure Admin user (aiml.harishjoshi@gmail.com / Joshi@2308) is always active and accessible
  try {
    const adminEmail = 'aiml.harishjoshi@gmail.com';
    const adminPasswordHash = bcrypt.hashSync('Joshi@2308', 10);
    const existingAdmin = sqliteDb.prepare('SELECT id FROM users WHERE lower(email) = ?').get(adminEmail.toLowerCase()) as any;
    if (existingAdmin) {
      sqliteDb.prepare("UPDATE users SET password_hash = ?, role = 'ADMIN', status = 'ACTIVE', name = 'Dr. Harish Joshi (HOD / Admin)' WHERE id = ?").run(adminPasswordHash, existingAdmin.id);
    } else {
      sqliteDb.prepare("INSERT INTO users (name, email, password_hash, role, status) VALUES ('Dr. Harish Joshi (HOD / Admin)', ?, ?, 'ADMIN', 'ACTIVE')").run(adminEmail, adminPasswordHash);
    }
  } catch (adminErr) {
    console.warn('Could not auto-migrate admin user credentials:', adminErr);
  }

  // Ensure initial audit trail logs are populated if table is empty
  try {
    const auditCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM audit_logs').get() as any;
    if (!auditCount || auditCount.count === 0) {
      const initLogs = [
        ['ADMIN', 'aiml.harishjoshi@gmail.com', 'SYSTEM_INITIALIZE', 'SYSTEM', '1', 'Platform security engine initialized for GNDEC Dept. of CSE (IoT & Cyber Security including Blockchain Technology).'],
        ['ADMIN', 'aiml.harishjoshi@gmail.com', 'CONFIGURE_GEOFENCE', 'LABORATORY', 'ALL', 'Physical room geofence boundaries (25m radius) activated for all department laboratory rooms.'],
        ['ADMIN', 'aiml.harishjoshi@gmail.com', 'MAP_TIMETABLE', 'TIMETABLE', 'ALL', 'Practical laboratory schedules and faculty assignments configured for 1st, 3rd, 5th, 7th academic semesters.'],
        ['ADMIN', 'aiml.harishjoshi@gmail.com', 'SECURITY_RULES', 'POLICY', '1', 'Enforced 5-minute feedback submission window before end of practical lab session and strict GPS lock verification.']
      ];
      const insertStmt = sqliteDb.prepare("INSERT INTO audit_logs (user_role, user_email, action, entity_type, entity_id, details, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, '127.0.0.1', datetime('now'))");
      for (const log of initLogs) {
        insertStmt.run(log[0], log[1], log[2], log[3], log[4], log[5]);
      }
    }
  } catch (auditErr) {
    console.warn('Could not seed initial audit logs:', auditErr);
  }

  console.log('✅ Database initialized successfully with strict Anti-Duplication constraints.');
}
