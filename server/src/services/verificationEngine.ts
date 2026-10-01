import crypto from 'node:crypto';
import { db } from '../models/db.js';
import { RULES, VERIFICATION_STATUS } from '../config/constants.js';
import { evaluateGeofence, checkLocationJump } from './geofenceService.js';
import { validateQRToken, QRTokenPayload } from './qrService.js';

export interface FeedbackSubmissionRequest {
  studentUserId: number;
  qrToken: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  teachingBasics: string;
  handsOn: string;
  doubtSupport?: string;
  reasonUnderstanding?: string;
  vivaTaken?: string;
  hardwareSetup?: string;
  teacherGuidance?: string;
  labPunctuality?: string;
  overallRating?: number;
  anonymousToTeacher?: boolean | number;
  viva?: string;
  understanding?: string;
  comments?: string;
  deviceFingerprint?: string;
}


export interface VerificationResult {
  isAccepted: boolean;
  status: 'VERIFIED' | 'MISMATCH' | 'SUSPICIOUS' | 'INVALID' | 'PENDING REVIEW';
  flags: string[];
  reasons: string[];
  attendanceRecord?: any;
  labSession?: any;
  geofenceResult?: any;
  feedbackId?: number;
  message: string;
}

/**
 * Execute comprehensive 10-rule verification engine
 */
export function verifyFeedbackSubmission(req: FeedbackSubmissionRequest): VerificationResult {
  const flags: string[] = [];
  const reasons: string[] = [];

  // 1. Fetch Student Record
  const student = db.prepare(`
    SELECT s.*, u.name, u.email, u.status as user_status
    FROM students s
    JOIN users u ON s.user_id = u.id
    WHERE s.user_id = ?
  `).get(req.studentUserId) as any;

  if (!student) {
    return {
      isAccepted: false,
      status: VERIFICATION_STATUS.INVALID,
      flags: ['STUDENT_NOT_FOUND'],
      reasons: ['Student account not recognized in department registry.'],
      message: 'Student account not found.'
    };
  }

  // 2. Validate QR Token (Rule 3: EXPIRED_QR / HMAC check)
  const qrValidation = validateQRToken(req.qrToken);
  let qrPayload: QRTokenPayload | undefined = qrValidation.payload;

  if (!qrValidation.isValid) {
    if (qrValidation.errorCode === 'EXPIRED_QR') {
      flags.push(RULES.RULE_3_EXPIRED_QR.code);
      reasons.push('This dynamic QR code has expired (1-minute validity exceeded). Please scan the new live rotating QR code from the projector screen.');
    } else {
      flags.push('INVALID_QR_TOKEN');
      reasons.push(qrValidation.errorMessage || 'Invalid dynamic QR token signature.');
    }
  }

  // If QR token is completely unparseable and we don't have payload, fail early
  if (!qrPayload) {
    return {
      isAccepted: false,
      status: VERIFICATION_STATUS.INVALID,
      flags,
      reasons,
      message: 'QR validation failed: ' + (reasons[0] || 'Invalid QR code.')
    };
  }

  // 3. Fetch Lab Session
  const session = db.prepare(`
    SELECT ls.*, l.name as lab_name, l.code as lab_code, l.latitude as lab_lat, 
           l.longitude as lab_lng, l.geofence_radius as lab_radius,
           e.title as experiment_title, e.experiment_number
    FROM lab_sessions ls
    JOIN laboratories l ON ls.laboratory_id = l.id
    JOIN experiments e ON ls.experiment_id = e.id
    WHERE ls.id = ?
  `).get(qrPayload.sessionId) as any;

  if (!session) {
    return {
      isAccepted: false,
      status: VERIFICATION_STATUS.INVALID,
      flags: ['SESSION_NOT_FOUND'],
      reasons: ['Associated laboratory session does not exist.'],
      message: 'Laboratory session not found.'
    };
  }

  if (session.status !== 'ACTIVE') {
    return {
      isAccepted: false,
      status: VERIFICATION_STATUS.INVALID,
      flags: ['SESSION_INACTIVE'],
      reasons: ['This laboratory session has ended or is not currently active.'],
      message: 'Your laboratory session has ended.'
    };
  }

  // Check Non-Reusable & Non-Reshareable Token Policy
  const tokenHash = crypto.createHash('sha256').update(req.qrToken).digest('hex');
  const usedToken = db.prepare(`
    SELECT * FROM used_qr_tokens WHERE token_hash = ? AND student_id = ?
  `).get(tokenHash, student.id) as any;

  if (usedToken) {
    flags.push(RULES.RULE_7_DUPLICATE_SUBMISSION.code);
    reasons.push('This dynamic QR token has already been consumed by your account.');
    return {
      isAccepted: false,
      status: VERIFICATION_STATUS.INVALID,
      flags,
      reasons,
      message: 'This dynamic QR token has already been used. Please scan the current live QR code on the screen.'
    };
  }

  // Rule 4: LAB_MISMATCH
  if (qrPayload.sessionCode !== session.session_code) {
    flags.push(RULES.RULE_4_LAB_MISMATCH.code);
    reasons.push(`Session code mismatch: expected ${session.session_code}, got ${qrPayload.sessionCode}`);
  }

  // Rule 5: EXPERIMENT_MISMATCH
  if (qrPayload.experimentId !== session.experiment_id) {
    flags.push(RULES.RULE_5_EXPERIMENT_MISMATCH.code);
    reasons.push(`Experiment mismatch: active is Experiment ${session.experiment_number}, but QR references ${qrPayload.experimentId}`);
  }

  // Rule 6: SEMESTER_MISMATCH
  if (student.semester !== session.semester) {
    flags.push(RULES.RULE_6_SECTION_MISMATCH.code);
    reasons.push(`Student enrolled in Semester ${student.semester}, but session is Semester ${session.semester}`);
  }

  // Rule 7: DUPLICATE_SUBMISSION FOR SAME LAB SESSION
  const existingFeedback = db.prepare(`
    SELECT id, submitted_at FROM feedback 
    WHERE student_id = ? AND lab_session_id = ?
  `).get(student.id, session.id) as any;

  if (existingFeedback) {
    flags.push(RULES.RULE_7_DUPLICATE_SUBMISSION.code);
    reasons.push(`Feedback was already submitted by student for this lab session at ${existingFeedback.submitted_at}.`);
    return {
      isAccepted: false,
      status: VERIFICATION_STATUS.INVALID,
      flags,
      reasons,
      message: 'You have already submitted feedback for this laboratory session. Duplicate submissions are not permitted.'
    };
  }

  // Geofence Evaluation (Rule 2: OUTSIDE_GEOFENCE, Rule 8: LOCATION_UNCERTAIN)
  const geoEval = evaluateGeofence(
    req.latitude,
    req.longitude,
    req.accuracy,
    session.lab_lat,
    session.lab_lng,
    session.lab_radius || 25.0
  );

  if (geoEval.status === 'OUTSIDE') {
    flags.push(RULES.RULE_2_OUTSIDE_GEOFENCE.code);
    reasons.push(geoEval.message);
    return {
      isAccepted: false,
      status: VERIFICATION_STATUS.INVALID,
      flags,
      reasons,
      message: `Geofence violation: You are outside the laboratory room boundary (${Math.round(geoEval.distance)}m away, limit ${session.lab_radius || 25}m). You must be physically inside the lab to submit feedback.`
    };
  } else if (geoEval.status === 'UNCERTAIN') {
    flags.push(RULES.RULE_8_LOCATION_UNCERTAIN.code);
    reasons.push('Location accuracy precision is below threshold (>100m).');
  }

  // Fetch Attendance Record (Rule 1: ATTENDANCE_MISSING)
  const attendance = db.prepare(`
    SELECT * FROM attendance
    WHERE student_id = ? AND lab_session_id = ?
  `).get(student.id, session.id) as any;

  if (!attendance) {
    flags.push(RULES.RULE_1_ATTENDANCE_MISSING.code);
    reasons.push('No verified attendance check-in found for this laboratory session. Remote or proxy feedback attempt suspected.');
  } else {
    // If attendance exists, check Rule 9: LOCATION_ANOMALY (Impossible jump)
    if (attendance.latitude && attendance.longitude && attendance.timestamp) {
      const attendanceTimeMs = new Date(attendance.timestamp).getTime();
      const feedbackTimeMs = Date.now();
      const jumpCheck = checkLocationJump(
        attendance.latitude,
        attendance.longitude,
        attendanceTimeMs,
        req.latitude,
        req.longitude,
        feedbackTimeMs
      );

      if (jumpCheck.isAnomaly) {
        flags.push(RULES.RULE_9_LOCATION_ANOMALY.code);
        reasons.push(`Suspicious spatial jump: ${jumpCheck.distanceMeters}m displacement at ${jumpCheck.speedKmh} km/h between attendance and feedback.`);
      }
    }
  }

  // Check Rule 10: REPEATED_VERIFICATION_FAILURE
  const recentFailures = db.prepare(`
    SELECT COUNT(*) as count FROM verification_events
    WHERE student_id = ? AND severity IN ('HIGH', 'CRITICAL')
    AND created_at >= datetime('now', '-7 days')
  `).get(student.id) as any;

  if (recentFailures && recentFailures.count >= 2) {
    flags.push(RULES.RULE_10_REPEATED_VERIFICATION_FAILURE.code);
    reasons.push(`Student has ${recentFailures.count} prior security verification warnings in the past 7 days.`);
  }

  // Determine Final Overall Status
  let finalStatus: 'VERIFIED' | 'MISMATCH' | 'SUSPICIOUS' | 'INVALID' | 'PENDING REVIEW' = VERIFICATION_STATUS.VERIFIED;

  if (flags.includes(RULES.RULE_3_EXPIRED_QR.code) || flags.includes(RULES.RULE_2_OUTSIDE_GEOFENCE.code)) {
    finalStatus = VERIFICATION_STATUS.INVALID;
  } else if (flags.includes(RULES.RULE_1_ATTENDANCE_MISSING.code) || flags.includes(RULES.RULE_9_LOCATION_ANOMALY.code)) {
    finalStatus = VERIFICATION_STATUS.SUSPICIOUS;
  } else if (
    flags.includes(RULES.RULE_4_LAB_MISMATCH.code) ||
    flags.includes(RULES.RULE_5_EXPERIMENT_MISMATCH.code) ||
    flags.includes(RULES.RULE_6_SECTION_MISMATCH.code)
  ) {
    finalStatus = VERIFICATION_STATUS.MISMATCH;
  } else if (flags.includes(RULES.RULE_8_LOCATION_UNCERTAIN.code) || flags.includes(RULES.RULE_10_REPEATED_VERIFICATION_FAILURE.code)) {
    finalStatus = VERIFICATION_STATUS.PENDING_REVIEW;
  }

  // Insert feedback record (even if suspicious/mismatch, we log it for audit/investigation with appropriate status)
  // If INVALID due to expired QR or Outside geofence, we also save with INVALID status so HOD can see attempts
  const insertResult = db.prepare(`
    INSERT INTO feedback (
      student_id, lab_session_id, experiment_id,
      teaching_basics, hands_on, doubt_support, reason_understanding,
      viva_taken, hardware_setup, teacher_guidance, lab_punctuality,
      overall_rating, anonymous_to_teacher,
      viva, understanding, comments,
      latitude, longitude, accuracy, distance_to_lab,
      qr_token_used, submitted_at, verification_status, flags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)
  `).run(
    student.id,
    session.id,
    session.experiment_id,
    req.teachingBasics,
    req.handsOn,
    req.doubtSupport || null,
    req.reasonUnderstanding || null,
    req.vivaTaken || req.viva || null,
    req.hardwareSetup || null,
    req.teacherGuidance || null,
    req.labPunctuality || null,
    req.overallRating || 5,
    req.anonymousToTeacher ? 1 : 0,
    req.viva || req.vivaTaken || null,
    req.understanding || req.reasonUnderstanding || null,
    req.comments || null,
    req.latitude,
    req.longitude,
    req.accuracy,
    geoEval.distance,
    req.qrToken,
    finalStatus,
    JSON.stringify(flags)
  );

  const feedbackId = Number(insertResult.lastInsertRowid);

  // Record consumed token to prevent reuse / resharing
  try {
    const tokenHashForStorage = crypto.createHash('sha256').update(req.qrToken).digest('hex');
    db.prepare(`
      INSERT OR REPLACE INTO used_qr_tokens (token_hash, student_id, lab_session_id, device_fingerprint, used_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).run(tokenHashForStorage, student.id, session.id, req.deviceFingerprint || null);
  } catch (tokenErr) {
    console.warn('Could not record used token:', tokenErr);
  }

  // Automated Teacher Lab Conduct Analysis - Flag dereliction of duty for HOD review
  const conductIssues: string[] = [];
  if (req.handsOn && (req.handsOn.toLowerCase().includes('no practical') || req.handsOn.toLowerCase().includes('skipped') || req.handsOn === 'No')) {
    conductIssues.push('Hands-on experiments not conducted / skipped');
  }
  if (req.teacherGuidance && (req.teacherGuidance.toLowerCase().includes('left lab') || req.teacherGuidance.toLowerCase().includes('distracted') || req.teacherGuidance.toLowerCase().includes('absent'))) {
    conductIssues.push('Faculty reportedly left lab early, absent, or inattentive');
  }
  if (req.teachingBasics && (req.teachingBasics.toLowerCase().includes('skipped') || req.teachingBasics.toLowerCase().includes('not taught') || req.teachingBasics === 'Poor' || req.teachingBasics === 'Very Poor')) {
    conductIssues.push('Lab basics & experiment principles not taught');
  }
  if (req.vivaTaken && req.vivaTaken.toLowerCase().includes('no viva')) {
    conductIssues.push('Mandatory viva voce not conducted');
  }
  if (req.doubtSupport && (req.doubtSupport.toLowerCase().includes('dismissive') || req.doubtSupport.toLowerCase().includes('unapproachable') || req.doubtSupport.toLowerCase().includes('scolded') || req.doubtSupport.toLowerCase().includes('ignored'))) {
    conductIssues.push('Faculty uncooperative for doubt clearance');
  }
  if (req.overallRating && req.overallRating <= 2) {
    conductIssues.push(`Critically low lab execution rating (${req.overallRating}/5)`);
  }

  if (conductIssues.length > 0) {
    db.prepare(`
      INSERT INTO alerts (
        type, severity, student_id, lab_session_id, message, status
      ) VALUES (?, ?, ?, ?, ?, 'UNRESOLVED')
    `).run(
      'TEACHER_CONDUCT_FLAG',
      conductIssues.length >= 2 ? 'HIGH' : 'MEDIUM',
      student.id,
      session.id,
      `⚠️ Faculty Conduct Notice (${session.lab_name} Exp ${session.experiment_number}, Sem ${session.semester}): Student flagged: ${conductIssues.join('; ')}.`
    );
  }


  // If there are flags, log verification events and create system alerts
  if (flags.length > 0) {
    for (const flag of flags) {
      let severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
      if (flag === 'ATTENDANCE_MISSING' || flag === 'OUTSIDE_GEOFENCE' || flag === 'LOCATION_ANOMALY') {
        severity = 'HIGH';
      } else if (flag === 'REPEATED_VERIFICATION_FAILURE') {
        severity = 'CRITICAL';
      }

      db.prepare(`
        INSERT INTO verification_events (
          student_id, lab_session_id, feedback_id,
          event_type, severity, rule_code, reason, payload_details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        student.id,
        session.id,
        feedbackId,
        'RULE_TRIGGERED',
        severity,
        flag,
        reasons.join(' | '),
        JSON.stringify({
          studentUsn: student.usn,
          studentName: student.name,
          distance: geoEval.distance,
          accuracy: req.accuracy,
          hasAttendance: !!attendance
        })
      );
    }

    // Create high-level alert for Admin / HOD
    if (finalStatus === VERIFICATION_STATUS.SUSPICIOUS || finalStatus === VERIFICATION_STATUS.MISMATCH || finalStatus === VERIFICATION_STATUS.INVALID) {
      let alertMsg = '';
      if (flags.includes('ATTENDANCE_MISSING')) {
        alertMsg = `Feedback submitted without matching attendance by ${student.name} (${student.usn}) for ${session.lab_name} Exp ${session.experiment_number}.`;
      } else if (flags.includes('OUTSIDE_GEOFENCE')) {
        alertMsg = `Student ${student.name} (${student.usn}) attempted feedback submission outside laboratory geofence (${Math.round(geoEval.distance)}m away).`;
      } else if (flags.includes('EXPIRED_QR')) {
        alertMsg = `Expired QR token submission detected from ${student.name} (${student.usn}) in ${session.lab_name}.`;
      } else {
        alertMsg = `Verification mismatch detected for student ${student.name} (${student.usn}) in ${session.lab_name}: ${flags.join(', ')}`;
      }

      db.prepare(`
        INSERT INTO alerts (
          type, severity, student_id, lab_session_id, message, status
        ) VALUES (?, ?, ?, ?, ?, 'UNRESOLVED')
      `).run(
        finalStatus,
        finalStatus === VERIFICATION_STATUS.SUSPICIOUS ? 'HIGH' : 'MEDIUM',
        student.id,
        session.id,
        alertMsg
      );
    }
  }

  // Provide user-friendly response message
  let userMessage = 'Your feedback has been successfully recorded.';
  if (finalStatus === VERIFICATION_STATUS.VERIFIED) {
    userMessage = 'Your feedback has been successfully verified and recorded.';
  } else if (finalStatus === VERIFICATION_STATUS.SUSPICIOUS || finalStatus === VERIFICATION_STATUS.PENDING_REVIEW) {
    userMessage = 'Verification mismatch detected. Manual review required.';
  } else if (finalStatus === VERIFICATION_STATUS.INVALID) {
    userMessage = reasons[0] || 'Verification failed. Submission violates validation constraints.';
  }

  return {
    isAccepted: finalStatus === VERIFICATION_STATUS.VERIFIED || finalStatus === VERIFICATION_STATUS.PENDING_REVIEW || finalStatus === VERIFICATION_STATUS.SUSPICIOUS,
    status: finalStatus,
    flags,
    reasons,
    attendanceRecord: attendance,
    labSession: session,
    geofenceResult: geoEval,
    feedbackId,
    message: userMessage
  };
}
