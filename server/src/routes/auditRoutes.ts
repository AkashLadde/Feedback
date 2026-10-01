import { Router } from 'express';
import { db } from '../models/db.js';
import { authenticateJWT, requireRoles } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/audit-logs
router.get('/', authenticateJWT, requireRoles('ADMIN', 'HOD'), (req, res) => {
  const { limit, action, search } = req.query;

  try {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];

    if (action && action !== 'ALL') {
      query += ' AND action = ?';
      params.push(action);
    }

    if (search) {
      query += ' AND (user_email LIKE ? OR details LIKE ? OR entity_type LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit ? parseInt(limit as string, 10) : 100);

    const logs = db.prepare(query).all(...params);

    return res.json({ success: true, logs });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch audit logs.' });
  }
});

export default router;
