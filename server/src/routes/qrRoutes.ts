import { Router } from 'express';
import { db } from '../models/db.js';
import { authenticateJWT, requireRoles, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { generateDynamicQR, validateQRToken } from '../services/qrService.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

// POST /api/qr/generate - Regenerate dynamic QR code for session
router.post('/generate', authenticateJWT, requireRoles('FACULTY', 'ADMIN'), async (req: AuthenticatedRequest, res) => {
  const { session_id, duration_seconds } = req.body;

  if (!session_id) {
    return res.status(400).json({ success: false, error: 'Session ID is required.' });
  }

  try {
    const session = db.prepare('SELECT * FROM lab_sessions WHERE id = ?').get(session_id) as any;
    if (!session) {
      return res.status(404).json({ success: false, error: 'Laboratory session not found.' });
    }

    if (session.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, error: 'Cannot generate QR code for an inactive session.' });
    }

    const duration = duration_seconds || session.qr_refresh_interval || 45;
    const qrResult = await generateDynamicQR(
      session.id,
      session.session_code,
      session.experiment_id,
      duration
    );

    logAudit(req.user!.id, req.user!.email, req.user!.role, 'GENERATE_QR', 'QR_SESSION', String(session.id), `Generated dynamic QR token expiring in ${duration}s`);

    return res.json({ success: true, qr: qrResult });
  } catch (err) {
    console.error('QR generate error:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate dynamic QR code.' });
  }
});

// POST /api/qr/validate - Preliminary client-side validation of token before rendering form
router.post('/validate', authenticateJWT, (req: AuthenticatedRequest, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, error: 'Token is required.' });
  }

  const result = validateQRToken(token);

  if (!result.isValid) {
    return res.status(400).json({
      success: false,
      errorCode: result.errorCode,
      error: result.errorMessage
    });
  }

  // Check if session is active
  const session = db.prepare(`
    SELECT ls.*, l.name as lab_name, l.code as lab_code, l.latitude as lab_lat, l.longitude as lab_lng, l.geofence_radius,
           e.experiment_number, e.title as experiment_title
    FROM lab_sessions ls
    JOIN laboratories l ON ls.laboratory_id = l.id
    JOIN experiments e ON ls.experiment_id = e.id
    WHERE ls.id = ?
  `).get(result.payload!.sessionId) as any;

  if (!session || session.status !== 'ACTIVE') {
    return res.status(400).json({
      success: false,
      errorCode: 'SESSION_INACTIVE',
      error: 'Laboratory session has ended or is inactive.'
    });
  }

  return res.json({
    success: true,
    session,
    payload: result.payload
  });
});

export default router;
