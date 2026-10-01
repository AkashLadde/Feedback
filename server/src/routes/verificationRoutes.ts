import { Router } from 'express';
import { db } from '../models/db.js';
import { authenticateJWT, requireRoles, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

// GET /api/verification - List all verification records for Admin & HOD with deep filters
router.get('/', authenticateJWT, requireRoles('ADMIN', 'HOD', 'FACULTY'), (req, res) => {
  const { status, lab_id, search, limit } = req.query;

  try {
    let query = `
      SELECT f.id as feedback_id, f.verification_status, f.flags, f.submitted_at,
             f.teaching_basics, f.hands_on, f.viva, f.understanding, f.comments,
             f.distance_to_lab as feedback_dist, f.latitude as feedback_lat, f.longitude as feedback_lng, f.accuracy as feedback_accuracy,
             s.id as student_id, s.usn, s.section, s.semester,
             u.name as student_name, u.email as student_email,
             ls.id as session_id, ls.session_code, ls.date as session_date,
             l.id as lab_id, l.name as lab_name, l.code as lab_code, l.room_number,
             e.id as experiment_id, e.experiment_number, e.title as experiment_title,
             a.id as attendance_id, a.timestamp as attendance_time, a.geofence_status as attendance_geofence,
             a.distance_to_lab as attendance_dist, a.latitude as attendance_lat, a.longitude as attendance_lng
      FROM feedback f
      JOIN students s ON f.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN lab_sessions ls ON f.lab_session_id = ls.id
      JOIN laboratories l ON ls.laboratory_id = l.id
      JOIN experiments e ON f.experiment_id = e.id
      LEFT JOIN attendance a ON (a.student_id = f.student_id AND a.lab_session_id = f.lab_session_id)
      WHERE 1=1
    `;

    const params: any[] = [];

    if (status && status !== 'ALL') {
      query += ` AND f.verification_status = ?`;
      params.push(status);
    }

    if (lab_id && lab_id !== 'ALL') {
      query += ` AND l.id = ?`;
      params.push(lab_id);
    }

    if (search) {
      query += ` AND (u.name LIKE ? OR s.usn LIKE ? OR l.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY f.submitted_at DESC LIMIT ?`;
    params.push(limit ? parseInt(limit as string, 10) : 100);

    const records = db.prepare(query).all(...params);

    // Summary aggregates
    const summary = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN verification_status = 'VERIFIED' THEN 1 ELSE 0 END) as verified,
        SUM(CASE WHEN verification_status = 'SUSPICIOUS' THEN 1 ELSE 0 END) as suspicious,
        SUM(CASE WHEN verification_status = 'MISMATCH' THEN 1 ELSE 0 END) as mismatch,
        SUM(CASE WHEN verification_status = 'INVALID' THEN 1 ELSE 0 END) as invalid,
        SUM(CASE WHEN verification_status = 'PENDING REVIEW' THEN 1 ELSE 0 END) as pending_review
      FROM feedback
    `).get() as any;

    return res.json({ success: true, records, summary });
  } catch (err) {
    console.error('Error in verification audit query:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch verification records.' });
  }
});

// GET /api/verification/:feedbackId/detail - Detailed side-by-side comparison modal data
router.get('/:feedbackId/detail', authenticateJWT, requireRoles('ADMIN', 'HOD', 'FACULTY'), (req, res) => {
  try {
    const feedback = db.prepare(`
      SELECT f.*,
             s.usn, s.section, s.semester, s.academic_year,
             u.name as student_name, u.email as student_email,
             ls.session_code, ls.date as session_date, ls.start_time as session_start,
             l.name as lab_name, l.code as lab_code, l.room_number, l.latitude as lab_lat, l.longitude as lab_lng, l.geofence_radius,
             e.experiment_number, e.title as experiment_title,
             fac_u.name as faculty_name
      FROM feedback f
      JOIN students s ON f.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN lab_sessions ls ON f.lab_session_id = ls.id
      JOIN laboratories l ON ls.laboratory_id = l.id
      JOIN experiments e ON f.experiment_id = e.id
      JOIN faculty fac ON ls.faculty_id = fac.id
      JOIN users fac_u ON fac.user_id = fac_u.id
      WHERE f.id = ?
    `).get(req.params.feedbackId) as any;

    if (!feedback) {
      return res.status(404).json({ success: false, error: 'Feedback record not found.' });
    }

    const attendance = db.prepare(`
      SELECT * FROM attendance
      WHERE student_id = ? AND lab_session_id = ?
    `).get(feedback.student_id, feedback.lab_session_id) as any;

    const events = db.prepare(`
      SELECT * FROM verification_events
      WHERE feedback_id = ?
      ORDER BY created_at DESC
    `).all(feedback.id);

    return res.json({
      success: true,
      feedback,
      attendance,
      events
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch verification detail.' });
  }
});

// POST /api/verification/:feedbackId/resolve - Admin / HOD manual resolution
router.post('/:feedbackId/resolve', authenticateJWT, requireRoles('ADMIN', 'HOD'), (req: AuthenticatedRequest, res) => {
  const { decision, notes } = req.body;

  if (!decision || !['VERIFIED', 'INVALID', 'SUSPICIOUS', 'DISMISSED'].includes(decision)) {
    return res.status(400).json({ success: false, error: 'Valid decision (VERIFIED, INVALID, SUSPICIOUS, DISMISSED) is required.' });
  }

  try {
    const feedback = db.prepare('SELECT * FROM feedback WHERE id = ?').get(req.params.feedbackId) as any;
    if (!feedback) {
      return res.status(404).json({ success: false, error: 'Feedback record not found.' });
    }

    db.prepare(`
      UPDATE feedback
      SET verification_status = ?,
          comments = comments || ' [Admin Note: ' || ? || ']'
      WHERE id = ?
    `).run(decision, notes || `Manually reviewed by ${req.user!.name}`, req.params.feedbackId);

    // Resolve associated alerts if any
    db.prepare(`
      UPDATE alerts
      SET status = 'RESOLVED',
          resolution_notes = ?,
          resolved_by = ?,
          resolved_at = datetime('now')
      WHERE student_id = ? AND lab_session_id = ? AND status = 'UNRESOLVED'
    `).run(notes || `Resolved as ${decision} by ${req.user!.name}`, req.user!.id, feedback.student_id, feedback.lab_session_id);

    logAudit(
      req.user!.id,
      req.user!.email,
      req.user!.role,
      'RESOLVE_VERIFICATION',
      'FEEDBACK',
      req.params.feedbackId,
      `Changed status to ${decision}: ${notes || ''}`
    );

    return res.json({ success: true, message: `Verification status updated to ${decision}.` });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to resolve verification status.' });
  }
});

export default router;
