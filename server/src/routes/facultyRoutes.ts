import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../models/db.js';
import { authenticateJWT, requireRoles, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

// GET /api/faculty - list all teachers/faculty with their semester-wise assigned labs
router.get('/', (_req, res) => {
  try {
    const faculty = db.prepare(`
      SELECT f.*, u.name, u.email, u.status, u.created_at,
             (SELECT COUNT(*) FROM laboratories WHERE faculty_id = f.id) as assigned_labs_count,
             (SELECT COUNT(*) FROM lab_sessions WHERE faculty_id = f.id) as conducted_sessions_count
      FROM faculty f
      JOIN users u ON f.user_id = u.id
      ORDER BY u.name ASC
    `).all() as any[];

    // Fetch assigned practical labs and timetable slots for each faculty member
    const labStmt = db.prepare(`
      SELECT l.id, l.name, l.code, l.semester, l.room_number, l.status
      FROM laboratories l
      WHERE l.faculty_id = ?
      ORDER BY l.semester ASC, l.name ASC
    `);

    const ttStmt = db.prepare(`
      SELECT te.id, te.semester, te.day_of_week, te.slot_index, te.time_range, te.subject_code, te.subject_abbr, te.subject_name, te.room
      FROM timetable_entries te
      WHERE lower(te.faculty_name) LIKE lower(?) OR upper(te.faculty_abbr) = upper(?)
      ORDER BY te.semester ASC, CASE te.day_of_week 
        WHEN 'MONDAY' THEN 1 
        WHEN 'TUESDAY' THEN 2 
        WHEN 'WEDNESDAY' THEN 3 
        WHEN 'THURSDAY' THEN 4 
        WHEN 'FRIDAY' THEN 5 
        WHEN 'SATURDAY' THEN 6 
        ELSE 7 END, te.slot_index ASC
    `);

    const enrichedFaculty = faculty.map((f) => {
      const assignedLabs = labStmt.all(f.id) as any[];
      const facultyNamePattern = `%${f.name.replace(/^Prof\.\s*|^Dr\.\s*|^Mr\.\s*/i, '').trim()}%`;
      const facultyAbbr = f.employee_id || '';
      const timetableSlots = ttStmt.all(facultyNamePattern, facultyAbbr) as any[];

      // Calculate unique semesters handled
      const semSet = new Set<number>();
      assignedLabs.forEach((l) => semSet.add(l.semester));
      timetableSlots.forEach((t) => semSet.add(t.semester));
      const semestersHandled = Array.from(semSet).sort((a, b) => a - b);

      return {
        ...f,
        assigned_labs: assignedLabs,
        assigned_labs_count: assignedLabs.length,
        timetable_slots: timetableSlots,
        semesters_handled: semestersHandled
      };
    });

    return res.json({ success: true, faculty: enrichedFaculty });
  } catch (err) {
    console.error('Error fetching faculty:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch faculty list.' });
  }
});

// POST /api/faculty - register new teacher / lab instructor
router.post('/', authenticateJWT, requireRoles('ADMIN', 'HOD'), (req: AuthenticatedRequest, res) => {
  const { name, email, designation, specialization, password } = req.body;
  const employee_id = (req.body.employee_id || req.body.employeeId || '').trim();

  if (!name || !email || !employee_id || !designation) {
    return res.status(400).json({ success: false, error: 'Name, email, employee ID, and designation are required.' });
  }

  try {
    // Check if email or employee_id already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE lower(email) = lower(?)').get(email);
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'A user with this email address already exists.' });
    }

    const existingEmp = db.prepare('SELECT id FROM faculty WHERE employee_id = ?').get(employee_id);
    if (existingEmp) {
      return res.status(400).json({ success: false, error: 'A faculty member with this Employee ID already exists.' });
    }

    const passwordHash = bcrypt.hashSync(password || 'Faculty@123', 10);

    const userResult = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, status)
      VALUES (?, ?, ?, 'FACULTY', 'ACTIVE')
    `).run(name, email.toLowerCase(), passwordHash);

    const userId = Number(userResult.lastInsertRowid);

    const facResult = db.prepare(`
      INSERT INTO faculty (user_id, employee_id, designation, specialization)
      VALUES (?, ?, ?, ?)
    `).run(userId, employee_id.toUpperCase(), designation, specialization || 'IoT and Cybersecurity');

    const facultyId = Number(facResult.lastInsertRowid);

    logAudit(req.user!.id, req.user!.email, req.user!.role, 'CREATE_FACULTY', 'FACULTY', String(facultyId), `Added teacher: ${name} (${employee_id})`);

    return res.status(201).json({
      success: true,
      message: `Teacher ${name} successfully registered.`,
      facultyId,
      userId
    });
  } catch (err: any) {
    console.error('Error adding faculty:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to add faculty member.' });
  }
});

// PUT /api/faculty/:id - update teacher details
router.put('/:id', authenticateJWT, requireRoles('ADMIN', 'HOD'), (req: AuthenticatedRequest, res) => {
  const { name, designation, specialization, status, password } = req.body;

  try {
    const faculty = db.prepare('SELECT * FROM faculty WHERE id = ?').get(req.params.id) as any;
    if (!faculty) {
      return res.status(404).json({ success: false, error: 'Faculty record not found.' });
    }

    if (name) {
      db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, faculty.user_id);
    }
    if (status) {
      db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, faculty.user_id);
    }
    if (password) {
      const passwordHash = bcrypt.hashSync(password, 10);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, faculty.user_id);
    }

    db.prepare(`
      UPDATE faculty
      SET designation = COALESCE(?, designation),
          specialization = COALESCE(?, specialization)
      WHERE id = ?
    `).run(designation || null, specialization || null, req.params.id);

    logAudit(req.user!.id, req.user!.email, req.user!.role, 'UPDATE_FACULTY', 'FACULTY', req.params.id, `Updated faculty ID ${req.params.id}`);

    return res.json({ success: true, message: 'Faculty details updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to update faculty member.' });
  }
});

// DELETE /api/faculty/:id - delete teacher
router.delete('/:id', authenticateJWT, requireRoles('ADMIN'), (req: AuthenticatedRequest, res) => {
  try {
    const faculty = db.prepare('SELECT * FROM faculty WHERE id = ?').get(req.params.id) as any;
    if (!faculty) {
      return res.status(404).json({ success: false, error: 'Faculty record not found.' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(faculty.user_id);
    logAudit(req.user!.id, req.user!.email, req.user!.role, 'DELETE_FACULTY', 'FACULTY', req.params.id, `Removed faculty ID ${req.params.id}`);

    return res.json({ success: true, message: 'Faculty member removed successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to delete faculty member.' });
  }
});

export default router;
