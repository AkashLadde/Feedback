import { Router } from 'express';
import { db } from '../models/db.js';
import { authenticateJWT, requireRoles, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

// GET /api/labs - list all laboratories
router.get('/', (req, res) => {
  const { semester } = req.query;

  try {
    let query = `
      SELECT l.*, 
             u.name as faculty_name, f.employee_id as faculty_emp_id,
             (SELECT COUNT(*) FROM experiments WHERE laboratory_id = l.id) as experiment_count,
             (SELECT COUNT(*) FROM lab_sessions WHERE laboratory_id = l.id AND status = 'ACTIVE') as active_sessions_count
      FROM laboratories l
      LEFT JOIN faculty f ON l.faculty_id = f.id
      LEFT JOIN users u ON f.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (semester && semester !== 'ALL') {
      query += ` AND l.semester = ?`;
      params.push(parseInt(semester as string, 10));
    }

    query += ` ORDER BY l.semester ASC, l.name ASC`;

    const labs = db.prepare(query).all(...params);

    return res.json({ success: true, labs });
  } catch (err) {
    console.error('Error fetching labs:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch laboratories.' });
  }
});

// GET /api/labs/:id - get single laboratory details
router.get('/:id', (req, res) => {
  try {
    const lab = db.prepare(`
      SELECT l.*, u.name as faculty_name, f.employee_id as faculty_emp_id
      FROM laboratories l
      LEFT JOIN faculty f ON l.faculty_id = f.id
      LEFT JOIN users u ON f.user_id = u.id
      WHERE l.id = ?
    `).get(req.params.id);

    if (!lab) {
      return res.status(404).json({ success: false, error: 'Laboratory not found.' });
    }

    const experiments = db.prepare(`
      SELECT * FROM experiments WHERE laboratory_id = ? ORDER BY experiment_number ASC
    `).all(req.params.id);

    return res.json({ success: true, lab, experiments });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch laboratory details.' });
  }
});

// POST /api/labs - Admin create new lab
router.post('/', authenticateJWT, requireRoles('ADMIN'), (req: AuthenticatedRequest, res) => {
  const { name, code, semester, academic_year, faculty_id, room_number, latitude, longitude, geofence_radius } = req.body;

  if (!name || !code || !room_number || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ success: false, error: 'All core laboratory fields are required.' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO laboratories (
        name, code, semester, section, academic_year, faculty_id, room_number, latitude, longitude, geofence_radius, status
      ) VALUES (?, ?, ?, '', ?, ?, ?, ?, ?, ?, 'ACTIVE')
    `).run(
      name,
      code.toUpperCase(),
      semester || 7,
      academic_year || '2026-2027',
      faculty_id || null,
      room_number,
      latitude,
      longitude,
      geofence_radius || 50.0
    );

    const labId = Number(result.lastInsertRowid);

    // Auto-create 10 curriculum experiments for this lab
    const insertExp = db.prepare(`
      INSERT INTO experiments (laboratory_id, experiment_number, title, description)
      VALUES (?, ?, ?, ?)
    `);

    for (let i = 1; i <= 10; i++) {
      insertExp.run(labId, i, `${name} - Practical Module ${i}`, `Laboratory module ${i} curriculum workflow.`);
    }

    logAudit(req.user!.id, req.user!.email, req.user!.role, 'CREATE_LAB', 'LABORATORY', String(labId), `Created lab ${name} (${code})`);

    return res.status(201).json({ success: true, labId, message: 'Laboratory created with 10 experiments.' });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ success: false, error: 'A laboratory with this code already exists.' });
    }
    return res.status(500).json({ success: false, error: 'Failed to create laboratory.' });
  }
});

// PUT /api/labs/:id - Admin update lab details & geofence
router.put('/:id', authenticateJWT, requireRoles('ADMIN', 'HOD'), (req: AuthenticatedRequest, res) => {
  const { name, room_number, latitude, longitude, geofence_radius, status, faculty_id, semester } = req.body;

  try {
    db.prepare(`
      UPDATE laboratories
      SET name = COALESCE(?, name),
          room_number = COALESCE(?, room_number),
          latitude = COALESCE(?, latitude),
          longitude = COALESCE(?, longitude),
          geofence_radius = COALESCE(?, geofence_radius),
          status = COALESCE(?, status),
          faculty_id = COALESCE(?, faculty_id),
          semester = COALESCE(?, semester)
      WHERE id = ?
    `).run(
      name || null,
      room_number || null,
      latitude !== undefined ? latitude : null,
      longitude !== undefined ? longitude : null,
      geofence_radius !== undefined ? geofence_radius : null,
      status || null,
      faculty_id || null,
      semester !== undefined ? parseInt(semester, 10) : null,
      req.params.id
    );

    logAudit(req.user!.id, req.user!.email, req.user!.role, 'UPDATE_LAB', 'LABORATORY', req.params.id, 'Updated lab configuration / geofence');

    return res.json({ success: true, message: 'Laboratory details updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to update laboratory.' });
  }
});

// GET /api/labs/:id/experiments - list experiments for a lab
router.get('/:id/experiments', (req, res) => {
  try {
    const experiments = db.prepare(`
      SELECT * FROM experiments WHERE laboratory_id = ? ORDER BY experiment_number ASC
    `).all(req.params.id);

    return res.json({ success: true, experiments });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch experiments.' });
  }
});

// PUT /api/labs/experiments/:id - update experiment details
router.put('/experiments/:id', authenticateJWT, requireRoles('ADMIN', 'FACULTY'), (req: AuthenticatedRequest, res) => {
  const { title, description, objectives, tools_required } = req.body;

  try {
    db.prepare(`
      UPDATE experiments
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          objectives = COALESCE(?, objectives),
          tools_required = COALESCE(?, tools_required)
      WHERE id = ?
    `).run(title || null, description || null, objectives || null, tools_required || null, req.params.id);

    logAudit(req.user!.id, req.user!.email, req.user!.role, 'UPDATE_EXPERIMENT', 'EXPERIMENT', req.params.id, `Updated experiment: ${title}`);

    return res.json({ success: true, message: 'Experiment updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to update experiment.' });
  }
});

// DELETE /api/labs/:id - delete a laboratory
router.delete('/:id', authenticateJWT, requireRoles('ADMIN'), (req: AuthenticatedRequest, res) => {
  try {
    const lab = db.prepare('SELECT * FROM laboratories WHERE id = ?').get(req.params.id) as any;
    if (!lab) {
      return res.status(404).json({ success: false, error: 'Laboratory not found.' });
    }

    // Delete associated experiments
    db.prepare('DELETE FROM experiments WHERE laboratory_id = ?').run(req.params.id);
    db.prepare('DELETE FROM laboratories WHERE id = ?').run(req.params.id);

    logAudit(req.user!.id, req.user!.email, req.user!.role, 'DELETE_LAB', 'LABORATORY', req.params.id, `Deleted lab ${lab.name} (${lab.code})`);

    return res.json({ success: true, message: `Laboratory ${lab.name} deleted successfully.` });
  } catch (err: any) {
    console.error('Error deleting lab:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete laboratory.' });
  }
});

export default router;
