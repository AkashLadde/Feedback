import { Router } from 'express';
import { db } from '../models/db.js';
import { authenticateJWT, requireRoles, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

// GET /api/alerts - List alerts
router.get('/', authenticateJWT, requireRoles('ADMIN', 'HOD', 'FACULTY'), (req, res) => {
  const { status, severity, limit } = req.query;

  try {
    let query = `
      SELECT a.*,
             s.usn, u.name as student_name,
             ls.session_code, ls.date as session_date,
             l.name as lab_name, l.code as lab_code,
             e.experiment_number, e.title as experiment_title,
             ru.name as resolved_by_name
      FROM alerts a
      LEFT JOIN students s ON a.student_id = s.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN lab_sessions ls ON a.lab_session_id = ls.id
      LEFT JOIN laboratories l ON ls.laboratory_id = l.id
      LEFT JOIN experiments e ON ls.experiment_id = e.id
      LEFT JOIN users ru ON a.resolved_by = ru.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (status && status !== 'ALL') {
      query += ` AND a.status = ?`;
      params.push(status);
    }

    if (severity && severity !== 'ALL') {
      query += ` AND a.severity = ?`;
      params.push(severity);
    }

    query += ` ORDER BY a.created_at DESC LIMIT ?`;
    params.push(limit ? parseInt(limit as string, 10) : 50);

    const alerts = db.prepare(query).all(...params);

    const counts = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'UNRESOLVED' THEN 1 ELSE 0 END) as unresolved,
        SUM(CASE WHEN severity = 'CRITICAL' AND status = 'UNRESOLVED' THEN 1 ELSE 0 END) as critical_unresolved
      FROM alerts
    `).get() as any;

    return res.json({ success: true, alerts, counts });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch alerts.' });
  }
});

// POST /api/alerts/:id/resolve - Resolve alert
router.post('/:id/resolve', authenticateJWT, requireRoles('ADMIN', 'HOD'), (req: AuthenticatedRequest, res) => {
  const { status, resolution_notes } = req.body;

  try {
    db.prepare(`
      UPDATE alerts
      SET status = ?,
          resolution_notes = ?,
          resolved_by = ?,
          resolved_at = datetime('now')
      WHERE id = ?
    `).run(status || 'RESOLVED', resolution_notes || 'Resolved by administrative review', req.user!.id, req.params.id);

    logAudit(req.user!.id, req.user!.email, req.user!.role, 'RESOLVE_ALERT', 'ALERT', req.params.id, `Resolved alert: ${resolution_notes || ''}`);

    return res.json({ success: true, message: 'Alert updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to update alert.' });
  }
});

export default router;
