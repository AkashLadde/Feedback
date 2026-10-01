import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../models/db.js';
import { authenticateJWT, requireRoles, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { generateDynamicQR } from '../services/qrService.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

// POST /api/sessions/start - Faculty/Admin starts a new lab session
router.post('/start', authenticateJWT, requireRoles('FACULTY', 'ADMIN'), async (req: AuthenticatedRequest, res) => {
  const { laboratory_id, experiment_id, semester, date, start_time } = req.body;

  if (!laboratory_id || !experiment_id) {
    return res.status(400).json({ success: false, error: 'Laboratory and Experiment are required.' });
  }

  try {
    const lab = db.prepare('SELECT * FROM laboratories WHERE id = ?').get(laboratory_id) as any;
    const exp = db.prepare('SELECT * FROM experiments WHERE id = ?').get(experiment_id) as any;

    if (!lab || !exp) {
      return res.status(404).json({ success: false, error: 'Laboratory or Experiment not found.' });
    }

    // Determine Faculty ID
    let facultyId: number = req.user?.facultyId || 0;
    if (!facultyId) {
      const faculty = db.prepare('SELECT id FROM faculty WHERE user_id = ?').get(req.user!.id) as any;
      facultyId = faculty ? faculty.id : (lab.faculty_id || 1);
    }

    const sessionDate = date || new Date().toISOString().split('T')[0];
    const randSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    const expNumStr = String(exp.experiment_number).padStart(2, '0');
    const sessionCode = `${lab.code}-${sessionDate}-E${expNumStr}-${randSuffix}`;

    // End any previously active session for this specific lab
    db.prepare(`
      UPDATE lab_sessions 
      SET status = 'COMPLETED', ended_at = datetime('now')
      WHERE laboratory_id = ? AND status = 'ACTIVE'
    `).run(laboratory_id);

    // Insert new active lab session
    const result = db.prepare(`
      INSERT INTO lab_sessions (
        session_code, laboratory_id, faculty_id, experiment_id,
        semester, section, date, start_time, status, qr_refresh_interval, started_at
      ) VALUES (?, ?, ?, ?, ?, '', ?, ?, 'ACTIVE', 45, datetime('now'))
    `).run(
      sessionCode,
      laboratory_id,
      facultyId,
      experiment_id,
      semester || lab.semester || 7,
      sessionDate,
      start_time || new Date().toLocaleTimeString('en-US', { hour12: false })
    );

    const sessionId = Number(result.lastInsertRowid);

    // Generate initial Dynamic QR Code
    const qrResult = await generateDynamicQR(sessionId, sessionCode, experiment_id, 45);

    logAudit(req.user!.id, req.user!.email, req.user!.role, 'START_SESSION', 'LAB_SESSION', String(sessionId), `Started session ${sessionCode}`);

    return res.status(201).json({
      success: true,
      sessionId,
      sessionCode,
      qr: qrResult,
      message: 'Laboratory session activated successfully.'
    });
  } catch (err: any) {
    console.error('Session start error:', err);
    return res.status(500).json({ success: false, error: 'Failed to start laboratory session.' });
  }
});

// POST /api/sessions/:id/end - End active lab session
router.post('/:id/end', authenticateJWT, requireRoles('FACULTY', 'ADMIN'), (req: AuthenticatedRequest, res) => {
  try {
    const session = db.prepare('SELECT * FROM lab_sessions WHERE id = ?').get(req.params.id) as any;
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }

    db.prepare(`
      UPDATE lab_sessions 
      SET status = 'COMPLETED', ended_at = datetime('now')
      WHERE id = ?
    `).run(req.params.id);

    // Expire active QR sessions
    db.prepare(`
      UPDATE qr_sessions 
      SET status = 'EXPIRED' 
      WHERE lab_session_id = ? AND status = 'ACTIVE'
    `).run(req.params.id);

    logAudit(req.user!.id, req.user!.email, req.user!.role, 'END_SESSION', 'LAB_SESSION', req.params.id, `Ended session ${session.session_code}`);

    return res.json({ success: true, message: 'Laboratory session concluded.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to end session.' });
  }
});

// GET /api/sessions/active - get all currently active lab sessions
router.get('/active', (req, res) => {
  try {
    const sessions = db.prepare(`
      SELECT ls.*, 
             l.name as lab_name, l.code as lab_code, l.room_number, l.latitude, l.longitude, l.geofence_radius,
             e.experiment_number, e.title as experiment_title,
             u.name as faculty_name
      FROM lab_sessions ls
      JOIN laboratories l ON ls.laboratory_id = l.id
      JOIN experiments e ON ls.experiment_id = e.id
      JOIN faculty f ON ls.faculty_id = f.id
      JOIN users u ON f.user_id = u.id
      WHERE ls.status = 'ACTIVE'
      ORDER BY ls.started_at DESC
    `).all();

    return res.json({ success: true, sessions });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch active sessions.' });
  }
});

// GET /api/sessions/:id/live - Live metrics for faculty live session screen
router.get('/:id/live', async (req, res) => {
  try {
    const session = db.prepare(`
      SELECT ls.*, 
             l.name as lab_name, l.code as lab_code, l.room_number, l.latitude, l.longitude, l.geofence_radius,
             e.experiment_number, e.title as experiment_title, e.description as experiment_desc,
             u.name as faculty_name, f.employee_id as faculty_emp_id
      FROM lab_sessions ls
      JOIN laboratories l ON ls.laboratory_id = l.id
      JOIN experiments e ON ls.experiment_id = e.id
      JOIN faculty f ON ls.faculty_id = f.id
      JOIN users u ON f.user_id = u.id
      WHERE ls.id = ?
    `).get(req.params.id) as any;

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }

    // Total eligible students in semester
    const totalEligible = db.prepare(`
      SELECT COUNT(*) as count FROM students
      WHERE semester = ?
    `).get(session.semester) as any;

    // Students present in attendance for this session
    const presentAttendance = db.prepare(`
      SELECT a.*, s.usn, u.name as student_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE a.lab_session_id = ?
      ORDER BY a.timestamp DESC
    `).all(session.id) as any[];

    // Feedback submitted for this session
    const feedbackList = db.prepare(`
      SELECT f.*, s.usn, u.name as student_name
      FROM feedback f
      JOIN students s ON f.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE f.lab_session_id = ?
      ORDER BY f.submitted_at DESC
    `).all(session.id) as any[];

    // Calculate live counters
    const totalStudentsCount = totalEligible?.count || 0;
    const presentCount = presentAttendance.length;
    const feedbackSubmittedCount = feedbackList.length;
    const pendingFeedbackCount = Math.max(0, presentCount - feedbackSubmittedCount);

    const verifiedCount = feedbackList.filter(f => f.verification_status === 'VERIFIED').length;
    const suspiciousCount = feedbackList.filter(f => f.verification_status === 'SUSPICIOUS').length;
    const mismatchCount = feedbackList.filter(f => f.verification_status === 'MISMATCH').length;
    const invalidCount = feedbackList.filter(f => f.verification_status === 'INVALID').length;
    const pendingReviewCount = feedbackList.filter(f => f.verification_status === 'PENDING REVIEW').length;

    // Get current active QR code or auto-generate if expired
    let activeQR = db.prepare(`
      SELECT * FROM qr_sessions 
      WHERE lab_session_id = ? AND status = 'ACTIVE'
      ORDER BY created_at DESC LIMIT 1
    `).get(session.id) as any;

    let qrDetails: any = null;
    if (session.status === 'ACTIVE') {
      const now = Date.now();
      const expiresAtMs = activeQR ? new Date(activeQR.expires_at).getTime() : 0;

      if (!activeQR || now >= expiresAtMs) {
        qrDetails = await generateDynamicQR(session.id, session.session_code, session.experiment_id, 45);
      } else {
        const remainingSeconds = Math.max(0, Math.round((expiresAtMs - now) / 1000));
        const QRCode = (await import('qrcode')).default;
        const qrPayload = JSON.stringify({
          app: 'LabGuard',
          sessionCode: session.session_code,
          token: activeQR.plain_token,
          exp: expiresAtMs
        });
        const qrDataUrl = await QRCode.toDataURL(qrPayload, {
          errorCorrectionLevel: 'M',
          margin: 2,
          color: { dark: '#1E293B', light: '#FFFFFF' },
          width: 320
        });

        qrDetails = {
          token: activeQR.plain_token,
          tokenHash: activeQR.token_hash,
          qrDataUrl,
          issuedAt: activeQR.created_at,
          expiresAt: activeQR.expires_at,
          expiresInSeconds: remainingSeconds,
          sessionCode: session.session_code
        };
      }
    }

    return res.json({
      success: true,
      session,
      liveMetrics: {
        totalStudentsCount,
        presentCount,
        absentCount: Math.max(0, totalStudentsCount - presentCount),
        feedbackSubmittedCount,
        pendingFeedbackCount,
        verifiedCount,
        suspiciousCount,
        mismatchCount,
        invalidCount,
        pendingReviewCount,
        totalVerificationIssues: suspiciousCount + mismatchCount + invalidCount
      },
      activeQR: qrDetails,
      recentAttendance: presentAttendance.slice(0, 15),
      recentFeedback: feedbackList.slice(0, 15)
    });
  } catch (err) {
    console.error('Live session query error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch live session metrics.' });
  }
});

export default router;
