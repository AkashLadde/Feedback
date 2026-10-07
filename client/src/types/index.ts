export type UserRole = 'ADMIN' | 'HOD' | 'FACULTY' | 'STUDENT';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  studentId?: number;
  facultyId?: number;
  usn?: string;
  semester?: number;
  batch?: string;
  department?: string;
  phone?: string;
  phone_verified?: number;
  profile?: any;
}

export interface Laboratory {
  id: number;
  name: string;
  code: string;
  semester: number;
  academic_year: string;
  faculty_id?: number;
  faculty_name?: string;
  faculty_emp_id?: string;
  room_number: string;
  location?: string;
  latitude: number;
  longitude: number;
  geofence_radius: number;
  status: string;
  experiment_count?: number;
  active_sessions_count?: number;
}

export interface Experiment {
  id: number;
  laboratory_id: number;
  experiment_number: number;
  title: string;
  description: string;
  objectives?: string;
  tools_required?: string;
}

export interface LabSession {
  id: number;
  session_code: string;
  laboratory_id: number;
  faculty_id: number;
  experiment_id: number;
  semester: number;
  date: string;
  start_time: string;
  end_time?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  qr_refresh_interval: number;
  started_at: string;
  ended_at?: string;
  lab_name?: string;
  lab_code?: string;
  room_number?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  geofence_radius?: number;
  experiment_number?: number;
  experiment_title?: string;
  experiment_desc?: string;
  faculty_name?: string;
}

export interface DynamicQR {
  token: string;
  tokenHash: string;
  qrDataUrl: string;
  issuedAt: string;
  expiresAt: string;
  expiresInSeconds: number;
  sessionCode: string;
}

export interface AttendanceRecord {
  id: number;
  student_id: number;
  lab_session_id: number;
  experiment_id: number;
  timestamp: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  distance_to_lab: number;
  geofence_status: 'INSIDE' | 'UNCERTAIN' | 'OUTSIDE';
  verification_status: 'PRESENT' | 'LATE' | 'FLAGGED' | 'ABSENT';
  student_name?: string;
  usn?: string;
  semester?: number;
  lab_name?: string;
  lab_code?: string;
  teacher_name?: string;
  experiment_number?: number;
  experiment_title?: string;
  session_code?: string;
  session_date?: string;
  time_slot?: string;
  remarks?: string;
  attendance_mode?: string;
}

export interface FeedbackRecord {
  id: number;
  student_id: number;
  lab_session_id: number;
  experiment_id: number;
  teaching_basics: string;
  hands_on: string;
  teacher_guidance?: string;
  doubt_support?: string;
  reason_understanding?: string;
  viva_taken?: string;
  hardware_setup?: string;
  lab_punctuality?: string;
  overall_rating?: number;
  anonymous_to_teacher?: number;
  viva?: string;
  understanding?: string;
  comments?: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  distance_to_lab: number;
  qr_token_used: string;
  submitted_at: string;
  verification_status: 'VERIFIED' | 'MISMATCH' | 'SUSPICIOUS' | 'INVALID' | 'PENDING REVIEW';
  flags?: string;
  student_name?: string;
  student_email?: string;
  usn?: string;
  semester?: number;
  lab_name?: string;
  lab_code?: string;
  teacher_name?: string;
  room_number?: string;
  experiment_number?: number;
  experiment_title?: string;
  session_code?: string;
  session_date?: string;
  attendance_id?: number;
  attendance_time?: string;
  attendance_geofence?: string;
  attendance_dist?: number;
}

export interface VerificationEvent {
  id: number;
  student_id: number;
  lab_session_id: number;
  feedback_id?: number;
  event_type: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  rule_code: string;
  reason: string;
  payload_details?: string;
  created_at: string;
}

export interface SystemAlert {
  id: number;
  type: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  student_id?: number;
  lab_session_id?: number;
  message: string;
  status: 'UNRESOLVED' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  resolution_notes?: string;
  resolved_by?: number;
  resolved_by_name?: string;
  resolved_at?: string;
  created_at: string;
  student_name?: string;
  usn?: string;
  lab_name?: string;
  lab_code?: string;
  session_code?: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_email?: string;
  user_role?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface LiveSessionData {
  session: LabSession;
  liveMetrics: {
    totalStudentsCount: number;
    presentCount: number;
    absentCount: number;
    feedbackSubmittedCount: number;
    pendingFeedbackCount: number;
    verifiedCount: number;
    suspiciousCount: number;
    mismatchCount: number;
    invalidCount: number;
    pendingReviewCount: number;
    totalVerificationIssues: number;
  };
  activeQR: DynamicQR;
  recentAttendance: AttendanceRecord[];
  recentFeedback: FeedbackRecord[];
}
