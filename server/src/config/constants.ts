import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'labguard_super_secret_jwt_key_iot_cybersecurity_2026',
  QR_TOKEN_SECRET: process.env.QR_TOKEN_SECRET || 'labguard_hmac_dynamic_qr_secret_key_9981',
  SESSION_DEFAULT_DURATION_MINUTES: parseInt(process.env.SESSION_DEFAULT_DURATION_MINUTES || '120', 10),
  GEOFENCE_DEFAULT_RADIUS_METERS: parseFloat(process.env.GEOFENCE_DEFAULT_RADIUS_METERS || '25.0'),
  DEFAULT_QR_EXPIRATION_SECONDS: 60, // Dynamic QR code expires every 60 seconds (1 minute)
  DEPARTMENT_NAME: 'Department of CSE in IoT & Cyber Security including Block Chain Technology (CSE-ICB)',
  COLLEGE_NAME: 'Guru Nanak Dev Engineering College Bidar',
  APP_NAME: 'LabGuard GNDEC',
  APP_SUBTITLE: 'Attendance & Student Feedback Verification Platform',
  CAMPUS_LATITUDE: 17.9104,
  CAMPUS_LONGITUDE: 77.5199
};

export const ROLES = {
  ADMIN: 'ADMIN',
  FACULTY: 'FACULTY',
  STUDENT: 'STUDENT'
} as const;

export const VERIFICATION_STATUS = {
  VERIFIED: 'VERIFIED',
  MISMATCH: 'MISMATCH',
  SUSPICIOUS: 'SUSPICIOUS',
  INVALID: 'INVALID',
  PENDING_REVIEW: 'PENDING REVIEW'
} as const;

export const RULES = {
  RULE_1_ATTENDANCE_MISSING: {
    code: 'ATTENDANCE_MISSING',
    title: 'Feedback without Attendance',
    severity: 'HIGH',
    status: VERIFICATION_STATUS.SUSPICIOUS,
    description: 'Student attempted to submit laboratory feedback without an active, verified attendance record for this session.'
  },
  RULE_2_OUTSIDE_GEOFENCE: {
    code: 'OUTSIDE_GEOFENCE',
    title: 'Outside Geofence Perimeter',
    severity: 'HIGH',
    status: VERIFICATION_STATUS.INVALID,
    description: 'Submission coordinates lie outside the permissible physical laboratory geofence boundary.'
  },
  RULE_3_EXPIRED_QR: {
    code: 'EXPIRED_QR',
    title: 'Expired QR Token',
    severity: 'MEDIUM',
    status: VERIFICATION_STATUS.INVALID,
    description: 'Dynamic QR token has expired and is no longer authorized for feedback submission.'
  },
  RULE_4_LAB_MISMATCH: {
    code: 'LAB_MISMATCH',
    title: 'Laboratory Discrepancy',
    severity: 'HIGH',
    status: VERIFICATION_STATUS.MISMATCH,
    description: 'The target laboratory does not match the active session laboratory.'
  },
  RULE_5_EXPERIMENT_MISMATCH: {
    code: 'EXPERIMENT_MISMATCH',
    title: 'Experiment Discrepancy',
    severity: 'MEDIUM',
    status: VERIFICATION_STATUS.MISMATCH,
    description: 'The feedback submitted does not match the experiment conducted in this session.'
  },
  RULE_6_SECTION_MISMATCH: {
    code: 'SECTION_MISMATCH',
    title: 'Section/Batch Discrepancy',
    severity: 'MEDIUM',
    status: VERIFICATION_STATUS.MISMATCH,
    description: 'Student is officially enrolled in a different academic section or batch.'
  },
  RULE_7_DUPLICATE_SUBMISSION: {
    code: 'DUPLICATE_SUBMISSION',
    title: 'Duplicate Submission Attempt',
    severity: 'MEDIUM',
    status: VERIFICATION_STATUS.INVALID,
    description: 'Feedback has already been logged for this student in the current laboratory session.'
  },
  RULE_8_LOCATION_UNCERTAIN: {
    code: 'LOCATION_UNCERTAIN',
    title: 'Low Geolocation Accuracy',
    severity: 'LOW',
    status: VERIFICATION_STATUS.PENDING_REVIEW,
    description: 'Reported GPS precision is low (> 100 meters), introducing positional uncertainty.'
  },
  RULE_9_LOCATION_ANOMALY: {
    code: 'LOCATION_ANOMALY',
    title: 'Suspicious Location Jump (Spoofing Flag)',
    severity: 'HIGH',
    status: VERIFICATION_STATUS.SUSPICIOUS,
    description: 'Physical displacement velocity from attendance checkpoint exceeds plausible human walking speed.'
  },
  RULE_10_REPEATED_VERIFICATION_FAILURE: {
    code: 'REPEATED_VERIFICATION_FAILURE',
    title: 'Repeated Verification Violations',
    severity: 'CRITICAL',
    status: VERIFICATION_STATUS.PENDING_REVIEW,
    description: 'Multiple failed verification attempts detected from this student account.'
  }
} as const;
