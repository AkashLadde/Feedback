import { Router } from 'express';
import { db } from '../models/db.js';
import { authenticateJWT, requireRoles, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { verifyFeedbackSubmission } from '../services/verificationEngine.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

// POST /api/feedback/submit - Student submits feedback through the Verification Engine
router.post('/submit', authenticateJWT, requireRoles('STUDENT'), (req: AuthenticatedRequest, res) => {
  const {
    qr_token,
    latitude,
    longitude,
    accuracy,
    teaching_basics,
    hands_on,
    doubt_support,
    reason_understanding,
    viva_taken,
    hardware_setup,
    teacher_guidance,
    lab_punctuality,
    overall_rating,
    anonymous_to_teacher,
    viva,
    understanding,
    comments,
    device_fingerprint
  } = req.body;

  if (!qr_token || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ success: false, error: 'QR token and location coordinates are required.' });
  }

  if (!teaching_basics || !hands_on) {
    return res.status(400).json({ success: false, error: 'Please answer all mandatory laboratory feedback questions.' });
  }

  try {
    const result = verifyFeedbackSubmission({
      studentUserId: req.user!.id,
      qrToken: qr_token,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy: parseFloat(accuracy || 15.0),
      teachingBasics: teaching_basics,
      handsOn: hands_on,
      doubtSupport: doubt_support,
      reasonUnderstanding: reason_understanding || understanding,
      vivaTaken: viva_taken || viva,
      hardwareSetup: hardware_setup,
      teacherGuidance: teacher_guidance,
      labPunctuality: lab_punctuality,
      overallRating: overall_rating ? parseInt(overall_rating, 10) : 5,
      anonymousToTeacher: anonymous_to_teacher !== undefined ? anonymous_to_teacher : 1,
      viva: viva || viva_taken || 'Yes',
      understanding: understanding || reason_understanding || 'Completely understood',
      comments: comments || '',
      deviceFingerprint: device_fingerprint
    });


    logAudit(
      req.user!.id,
      req.user!.email,
      req.user!.role,
      'SUBMIT_FEEDBACK',
      'FEEDBACK',
      String(result.feedbackId || 'N/A'),
      `Feedback evaluated with status: ${result.status}, flags: ${result.flags.join(',') || 'NONE'}`
    );

    if (!result.isAccepted && result.status === 'INVALID') {
      return res.status(400).json({
        success: false,
        status: result.status,
        flags: result.flags,
        reasons: result.reasons,
        error: result.message
      });
    }

    return res.json({
      success: true,
      status: result.status,
      flags: result.flags,
      message: result.message,
      feedbackId: result.feedbackId
    });
  } catch (err: any) {
    console.error('Feedback submission error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while processing feedback.' });
  }
});

// GET /api/feedback/student/:id - Student's feedback records
router.get('/student/:id', authenticateJWT, (req: AuthenticatedRequest, res) => {
  try {
    const studentId = (req.params.id === 'me' ? req.user!.studentId : req.params.id) || 0;

    const feedbacks = db.prepare(`
      SELECT f.*,
             ls.session_code, ls.date as session_date,
             l.name as lab_name, l.code as lab_code,
             e.experiment_number, e.title as experiment_title,
             a.timestamp as attendance_time, a.geofence_status as attendance_geofence
      FROM feedback f
      JOIN lab_sessions ls ON f.lab_session_id = ls.id
      JOIN laboratories l ON ls.laboratory_id = l.id
      JOIN experiments e ON f.experiment_id = e.id
      LEFT JOIN attendance a ON (a.student_id = f.student_id AND a.lab_session_id = f.lab_session_id)
      WHERE f.student_id = ?
      ORDER BY f.submitted_at DESC
    `).all(studentId);

    // Summary counts
    const verified = feedbacks.filter((f: any) => f.verification_status === 'VERIFIED').length;
    const underReview = feedbacks.filter((f: any) => f.verification_status === 'SUSPICIOUS' || f.verification_status === 'PENDING REVIEW').length;
    const invalid = feedbacks.filter((f: any) => f.verification_status === 'INVALID' || f.verification_status === 'MISMATCH').length;

    return res.json({
      success: true,
      feedbacks,
      summary: {
        total: feedbacks.length,
        verified,
        underReview,
        invalid
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch student feedback.' });
  }
});

// GET /api/feedback/session/:id - Feedbacks for a session
router.get('/session/:id', authenticateJWT, (req, res) => {
  try {
    const feedbacks = db.prepare(`
      SELECT f.*, s.usn, u.name as student_name,
             a.timestamp as attendance_time, a.distance_to_lab as attendance_dist
      FROM feedback f
      JOIN students s ON f.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN attendance a ON (a.student_id = f.student_id AND a.lab_session_id = f.lab_session_id)
      WHERE f.lab_session_id = ?
      ORDER BY f.submitted_at DESC
    `).all(req.params.id);

    return res.json({ success: true, feedbacks });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch session feedbacks.' });
  }
});

// POST /api/feedback/submit-direct - Student submits feedback directly for a subject/faculty
router.post('/submit-direct', authenticateJWT, requireRoles('STUDENT'), (req: AuthenticatedRequest, res) => {
  const {
    laboratory_id,
    teaching_basics,
    hands_on,
    teacher_guidance,
    doubt_support,
    reason_understanding,
    viva_taken,
    hardware_setup,
    lab_punctuality,
    overall_rating,
    comments
  } = req.body;

  if (!laboratory_id) {
    return res.status(400).json({ success: false, error: 'Please select a subject or laboratory.' });
  }

  try {
    const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(req.user!.id) as any;
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student profile not found.' });
    }

    const lab = db.prepare('SELECT * FROM laboratories WHERE id = ?').get(laboratory_id) as any;
    if (!lab) {
      return res.status(404).json({ success: false, error: 'Subject / Laboratory not found.' });
    }

    // Determine or find a session for today's feedback
    const today = new Date().toISOString().split('T')[0];
    let exp = db.prepare('SELECT id FROM experiments WHERE laboratory_id = ? ORDER BY experiment_number ASC LIMIT 1').get(lab.id) as any;
    const expId = exp ? exp.id : 1;

    let session = db.prepare(`
      SELECT * FROM lab_sessions WHERE laboratory_id = ? AND date = ? ORDER BY id DESC LIMIT 1
    `).get(lab.id, today) as any;

    if (!session) {
      const sessionCode = `FB-${lab.code}-${today}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const insertSess = db.prepare(`
        INSERT INTO lab_sessions (
          session_code, laboratory_id, faculty_id, experiment_id, semester, section, date, start_time, status, started_at
        ) VALUES (?, ?, ?, ?, ?, '', ?, '10:00:00', 'COMPLETED', datetime('now'))
      `).run(sessionCode, lab.id, lab.faculty_id || 1, expId, student.semester, today);

      session = { id: Number(insertSess.lastInsertRowid), session_code: sessionCode };
    }

    // Check if feedback already submitted for this session
    const existing = db.prepare(`
      SELECT id FROM feedback WHERE student_id = ? AND lab_session_id = ?
    `).get(student.id, session.id);

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'You have already submitted feedback for this subject today.'
      });
    }

    const ratingVal = overall_rating ? parseInt(overall_rating, 10) : 5;

    const insertResult = db.prepare(`
      INSERT INTO feedback (
        student_id, lab_session_id, experiment_id,
        teaching_basics, hands_on, teacher_guidance, doubt_support,
        reason_understanding, viva_taken, hardware_setup, lab_punctuality,
        overall_rating, anonymous_to_teacher, viva, understanding, comments,
        latitude, longitude, accuracy, distance_to_lab,
        qr_token_used, submitted_at, verification_status, flags,
        laboratory_id, faculty_id
      ) VALUES (
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, 1, ?, ?, ?,
        17.9104, 77.5199, 10.0, 5.0,
        'DIRECT_STUDENT_PORTAL', datetime('now'), 'VERIFIED', '[]',
        ?, ?
      )
    `).run(
      student.id,
      session.id,
      expId,
      teaching_basics || 'Thoroughly explained with clear objectives',
      hands_on || 'Yes, performed hands-on individually',
      teacher_guidance || 'Continuously guided and inspected each student desk',
      doubt_support || 'Extremely cooperative, patiently cleared every doubt',
      reason_understanding || 'Yes, fully understand the working principle & reasons',
      viva_taken || 'Yes, detailed one-on-one individual viva conducted',
      hardware_setup || 'Complete working setup (all kits, PCs & software working)',
      lab_punctuality || 'Full scheduled lab duration conducted properly',
      ratingVal,
      (viva_taken || 'Yes').includes('Yes') ? 'Yes' : 'No',
      reason_understanding || 'Completely understood',
      comments || '',
      lab.id,
      lab.faculty_id || null
    );

    logAudit(
      req.user!.id,
      req.user!.email,
      req.user!.role,
      'SUBMIT_FEEDBACK',
      'FEEDBACK',
      String(insertResult.lastInsertRowid),
      `Direct feedback submitted for ${lab.name} (${lab.code}) rating ${ratingVal}/5`
    );

    return res.status(201).json({
      success: true,
      message: 'Your genuine feedback has been submitted successfully and recorded anonymously.',
      status: 'VERIFIED',
      feedbackId: Number(insertResult.lastInsertRowid)
    });
  } catch (err: any) {
    console.error('Direct feedback submit error:', err);
    return res.status(500).json({ success: false, error: 'Failed to submit feedback.' });
  }
});

// GET /api/feedback/all - Admin complete feedback overview
router.get('/all', authenticateJWT, requireRoles('ADMIN'), (req, res) => {
  const { semester, laboratory_id, faculty_id, rating } = req.query;

  try {
    let query = `
      SELECT f.*, 
             s.usn, s.semester, s.department, u.name as student_name,
             l.name as lab_name, l.code as lab_code,
             fac_u.name as teacher_name, fac.employee_id as faculty_emp_id,
             ls.session_code, ls.date as session_date
      FROM feedback f
      JOIN students s ON f.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN lab_sessions ls ON f.lab_session_id = ls.id
      JOIN laboratories l ON ls.laboratory_id = l.id
      LEFT JOIN faculty fac ON (f.faculty_id = fac.id OR ls.faculty_id = fac.id OR l.faculty_id = fac.id)
      LEFT JOIN users fac_u ON fac.user_id = fac_u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (semester && semester !== 'ALL') {
      query += ` AND s.semester = ?`;
      params.push(parseInt(semester as string, 10));
    }

    if (laboratory_id && laboratory_id !== 'ALL') {
      query += ` AND l.id = ?`;
      params.push(parseInt(laboratory_id as string, 10));
    }

    if (faculty_id && faculty_id !== 'ALL') {
      query += ` AND fac.id = ?`;
      params.push(parseInt(faculty_id as string, 10));
    }

    if (rating) {
      query += ` AND f.overall_rating = ?`;
      params.push(parseInt(rating as string, 10));
    }

    query += ` ORDER BY f.submitted_at DESC LIMIT 200`;

    const feedbacks = db.prepare(query).all(...params);

    const total = feedbacks.length;
    const avgRating = total > 0
      ? Number((feedbacks.reduce((acc: number, f: any) => acc + (f.overall_rating || 5), 0) / total).toFixed(2))
      : 5.0;

    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const fb of feedbacks as any[]) {
      const r = fb.overall_rating || 5;
      if (r >= 1 && r <= 5) (ratingCounts as any)[r]++;
    }

    return res.json({
      success: true,
      feedbacks,
      stats: {
        total,
        avgRating,
        ratingCounts
      }
    });
  } catch (err: any) {
    console.error('Error fetching all feedback:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch feedback records.' });
  }
});

export default router;

