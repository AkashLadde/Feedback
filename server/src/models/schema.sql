-- ========================================================================
-- LabGuard GNDEC Academic Platform: MySQL Database Schema
-- Department of CSE in IoT & Cyber Security including Block Chain Technology
-- ========================================================================

CREATE TABLE IF NOT EXISTS semesters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  number INT UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  academic_year VARCHAR(50) NOT NULL DEFAULT '2026-2027',
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'HOD', 'FACULTY', 'STUDENT') NOT NULL,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  usn VARCHAR(50) UNIQUE NOT NULL,
  semester INT NOT NULL DEFAULT 7,
  section VARCHAR(50) DEFAULT '',
  batch VARCHAR(50) NOT NULL DEFAULT '2023-2027',
  department VARCHAR(255) NOT NULL DEFAULT 'CSE in IoT & Cyber Security including Block Chain Technology',
  academic_year VARCHAR(50) NOT NULL DEFAULT '2026-2027',
  phone VARCHAR(50) NULL,
  phone_verified INT DEFAULT 0,
  profile_photo TEXT NULL,
  INDEX idx_students_usn (usn),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS faculty (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  designation VARCHAR(255) NOT NULL,
  specialization TEXT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS laboratories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  semester INT NOT NULL DEFAULT 7,
  section VARCHAR(50) DEFAULT '',
  academic_year VARCHAR(50) NOT NULL DEFAULT '2026-2027',
  faculty_id INT NULL,
  room_number VARCHAR(100) NOT NULL,
  location VARCHAR(255) NULL,
  latitude DOUBLE NOT NULL DEFAULT 17.9104,
  longitude DOUBLE NOT NULL DEFAULT 77.5199,
  geofence_radius DOUBLE NOT NULL DEFAULT 25.0,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS otp_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(50) NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otp_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS experiments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  laboratory_id INT NOT NULL,
  experiment_number INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  objectives TEXT NULL,
  tools_required TEXT NULL,
  UNIQUE KEY unique_lab_experiment (laboratory_id, experiment_number),
  FOREIGN KEY (laboratory_id) REFERENCES laboratories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  laboratory_id INT NOT NULL,
  faculty_id INT NOT NULL,
  day_of_week VARCHAR(50) NOT NULL,
  start_time VARCHAR(50) NOT NULL,
  end_time VARCHAR(50) NOT NULL,
  room VARCHAR(100) NOT NULL,
  FOREIGN KEY (laboratory_id) REFERENCES laboratories(id) ON DELETE CASCADE,
  FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lab_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_code VARCHAR(100) UNIQUE NOT NULL,
  laboratory_id INT NOT NULL,
  faculty_id INT NOT NULL,
  experiment_id INT NOT NULL,
  semester INT NOT NULL,
  section VARCHAR(50) DEFAULT '',
  date VARCHAR(50) NOT NULL,
  start_time VARCHAR(50) NOT NULL,
  end_time VARCHAR(50) NULL,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  qr_refresh_interval INT DEFAULT 60,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  INDEX idx_lab_sessions_status (status),
  FOREIGN KEY (laboratory_id) REFERENCES laboratories(id),
  FOREIGN KEY (faculty_id) REFERENCES faculty(id),
  FOREIGN KEY (experiment_id) REFERENCES experiments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================================
-- ATTENDANCE TABLE WITH STRICT ANTI-DUPLICATION CONSTRAINT
-- ========================================================================
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  lab_session_id INT NULL,
  experiment_id INT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  latitude DOUBLE DEFAULT 17.9104,
  longitude DOUBLE DEFAULT 77.5199,
  accuracy DOUBLE DEFAULT 10.0,
  distance_to_lab DOUBLE DEFAULT 5.0,
  geofence_status VARCHAR(50) DEFAULT 'INSIDE',
  verification_status VARCHAR(50) NOT NULL DEFAULT 'PRESENT',
  device_fingerprint TEXT NULL,
  marked_by_faculty_id INT NULL,
  remarks TEXT NULL,
  attendance_mode VARCHAR(50) DEFAULT 'ROSTER',
  UNIQUE KEY unique_student_lab_session (student_id, lab_session_id),
  INDEX idx_attendance_student_session (student_id, lab_session_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (lab_session_id) REFERENCES lab_sessions(id) ON DELETE SET NULL,
  FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE SET NULL,
  FOREIGN KEY (marked_by_faculty_id) REFERENCES faculty(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS timetable_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  semester INT NOT NULL,
  academic_year VARCHAR(50) DEFAULT '2026-2027',
  day_of_week VARCHAR(50) NOT NULL,
  slot_index INT NOT NULL,
  time_range VARCHAR(100) NOT NULL,
  subject_code VARCHAR(50) NOT NULL,
  subject_abbr VARCHAR(50) NOT NULL,
  subject_name VARCHAR(255) NOT NULL,
  faculty_abbr VARCHAR(50) NOT NULL,
  faculty_name VARCHAR(255) NOT NULL,
  room VARCHAR(100) NOT NULL,
  batch VARCHAR(50) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS qr_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lab_session_id INT NOT NULL,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  plain_token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  FOREIGN KEY (lab_session_id) REFERENCES lab_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS used_qr_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token_hash VARCHAR(255) NOT NULL,
  student_id INT NOT NULL,
  lab_session_id INT NOT NULL,
  device_fingerprint TEXT NULL,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_token_student (token_hash, student_id),
  UNIQUE KEY unique_student_used_session (student_id, lab_session_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (lab_session_id) REFERENCES lab_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  lab_session_id INT NOT NULL,
  experiment_id INT NOT NULL,
  teaching_basics TEXT NOT NULL,
  hands_on TEXT NOT NULL,
  doubt_support TEXT NULL,
  reason_understanding TEXT NULL,
  viva_taken TEXT NULL,
  hardware_setup TEXT NULL,
  teacher_guidance TEXT NULL,
  lab_punctuality TEXT NULL,
  overall_rating INT DEFAULT 5,
  anonymous_to_teacher INT DEFAULT 1,
  viva TEXT NULL,
  understanding TEXT NULL,
  comments TEXT NULL,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  accuracy DOUBLE NOT NULL,
  distance_to_lab DOUBLE NOT NULL,
  qr_token_used VARCHAR(255) NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  flags TEXT NULL,
  UNIQUE KEY unique_student_feedback_session (student_id, lab_session_id),
  INDEX idx_feedback_student_session (student_id, lab_session_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (lab_session_id) REFERENCES lab_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS verification_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NULL,
  lab_session_id INT NULL,
  feedback_id INT NULL,
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  rule_code VARCHAR(100) NOT NULL,
  reason TEXT NOT NULL,
  payload_details TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (lab_session_id) REFERENCES lab_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  student_id INT NULL,
  lab_session_id INT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'UNRESOLVED',
  resolution_notes TEXT NULL,
  resolved_by INT NULL,
  resolved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_alerts_status (status),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (lab_session_id) REFERENCES lab_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  user_email VARCHAR(255) NULL,
  user_role VARCHAR(50) NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100) NULL,
  details TEXT NULL,
  ip_address VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_created (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
