import { Router } from 'express';
import { db } from '../models/db.js';
import { authenticateJWT, requireRoles, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

// GET /api/semesters - list all semesters
router.get('/', (_req, res) => {
  try {
    const semesters = db.prepare(`
      SELECT s.*,
             (SELECT COUNT(*) FROM laboratories WHERE semester = s.number) as lab_count,
             (SELECT COUNT(*) FROM students WHERE semester = s.number) as student_count
      FROM semesters s
      ORDER BY s.number ASC
    `).all();

    return res.json({ success: true, semesters });
  } catch (err) {
    console.error('Error fetching semesters:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch semesters.' });
  }
});

// POST /api/semesters - add new semester (Admin / HOD)
router.post('/', authenticateJWT, requireRoles('ADMIN', 'HOD'), (req: AuthenticatedRequest, res) => {
  const { number, name, academic_year } = req.body;

  if (number === undefined || !name) {
    return res.status(400).json({ success: false, error: 'Semester number and name are required.' });
  }

  try {
    const semNum = parseInt(number, 10);
    const existing = db.prepare('SELECT id FROM semesters WHERE number = ?').get(semNum);
    if (existing) {
      return res.status(400).json({ success: false, error: `Semester ${semNum} already exists in the system.` });
    }

    const result = db.prepare(`
      INSERT INTO semesters (number, name, academic_year, status)
      VALUES (?, ?, ?, 'ACTIVE')
    `).run(semNum, name, academic_year || '2026-2027');

    const newId = Number(result.lastInsertRowid);
    logAudit(req.user!.id, req.user!.email, req.user!.role, 'CREATE_SEMESTER', 'SEMESTER', String(newId), `Created semester: ${name} (Sem ${semNum})`);

    return res.status(201).json({
      success: true,
      message: `Semester ${semNum} successfully added.`,
      semesterId: newId
    });
  } catch (err: any) {
    console.error('Error adding semester:', err);
    return res.status(500).json({ success: false, error: 'Failed to add semester.' });
  }
});

// DELETE /api/semesters/:id - delete semester
router.delete('/:id', authenticateJWT, requireRoles('ADMIN'), (req: AuthenticatedRequest, res) => {
  try {
    const semester = db.prepare('SELECT * FROM semesters WHERE id = ?').get(req.params.id) as any;
    if (!semester) {
      return res.status(404).json({ success: false, error: 'Semester not found.' });
    }

    // Check if any labs or students are assigned to this semester
    const labCount = db.prepare('SELECT COUNT(*) as count FROM laboratories WHERE semester = ?').get(semester.number) as any;
    if (labCount && labCount.count > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete Semester ${semester.number}: ${labCount.count} laboratories are currently mapped to this semester.`
      });
    }

    db.prepare('DELETE FROM semesters WHERE id = ?').run(req.params.id);
    logAudit(req.user!.id, req.user!.email, req.user!.role, 'DELETE_SEMESTER', 'SEMESTER', req.params.id, `Deleted semester ${semester.name}`);

    return res.json({ success: true, message: `Semester ${semester.name} deleted successfully.` });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to delete semester.' });
  }
});

export default router;
