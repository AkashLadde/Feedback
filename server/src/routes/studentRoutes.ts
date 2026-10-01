import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../models/db.js';
import { authenticateJWT, requireRoles, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

// GET /api/students - list students with semester & status filter
router.get('/', (req, res) => {
  const { semester, status, search, limit } = req.query;

  try {
    let query = `
      SELECT s.*, u.name, u.email, u.status, u.created_at,
             (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND verification_status = 'PRESENT') as attendance_count,
             (SELECT COUNT(*) FROM feedback WHERE student_id = s.id) as feedback_count
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (semester && semester !== 'ALL') {
      query += ` AND s.semester = ?`;
      params.push(parseInt(semester as string, 10));
    }

    if (status && status !== 'ALL') {
      query += ` AND u.status = ?`;
      params.push(status as string);
    }

    if (search) {
      query += ` AND (u.name LIKE ? OR s.usn LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY s.semester ASC, s.usn ASC`;

    if (limit) {
      query += ` LIMIT ?`;
      params.push(parseInt(limit as string, 10));
    }

    const students = db.prepare(query).all(...params);

    return res.json({ success: true, students, count: students.length });
  } catch (err) {
    console.error('Error fetching students:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch student profiles.' });
  }
});

// POST /api/students - add new student profile
router.post('/', authenticateJWT, requireRoles('ADMIN', 'HOD', 'FACULTY'), (req: AuthenticatedRequest, res) => {
  const { name, usn, email, semester, batch, department, phone, password } = req.body;

  if (!name || !usn || !email || semester === undefined) {
    return res.status(400).json({ success: false, error: 'Name, USN, Email, and Semester are required.' });
  }

  try {
    const cleanUsn = usn.toUpperCase().trim();
    const cleanEmail = email.toLowerCase().trim();
    const semNum = parseInt(semester, 10);

    const existingUsn = db.prepare('SELECT id FROM students WHERE upper(usn) = ?').get(cleanUsn);
    if (existingUsn) {
      return res.status(400).json({ success: false, error: `A student with USN '${cleanUsn}' already exists.` });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE lower(email) = ?').get(cleanEmail);
    if (existingUser) {
      return res.status(400).json({ success: false, error: `A user with email '${cleanEmail}' already exists.` });
    }

    const passwordHash = bcrypt.hashSync(password || 'Student@123', 10);

    const userResult = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, status)
      VALUES (?, ?, ?, 'STUDENT', 'ACTIVE')
    `).run(name.trim(), cleanEmail, passwordHash);

    const userId = Number(userResult.lastInsertRowid);

    const computedBatch = batch || (semNum === 3 ? '2024-2028' : semNum === 5 ? '2023-2027' : '2022-2026');

    const studentResult = db.prepare(`
      INSERT INTO students (
        user_id, usn, semester, section, batch, department, academic_year, phone
      ) VALUES (?, ?, ?, '', ?, ?, '2026-2027', ?)
    `).run(
      userId,
      cleanUsn,
      semNum,
      computedBatch,
      department || 'CSE in IoT & Cyber Security including Block Chain Technology',
      phone ? phone.trim() : null
    );

    const studentId = Number(studentResult.lastInsertRowid);

    logAudit(req.user!.id, req.user!.email, req.user!.role, 'CREATE_STUDENT', 'STUDENT', String(studentId), `Added student profile: ${name} (${cleanUsn}), Sem ${semester}`);

    return res.status(201).json({
      success: true,
      message: `Student ${name} (${cleanUsn}) registered for Semester ${semester}.`,
      studentId,
      userId
    });
  } catch (err: any) {
    console.error('Error adding student:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to add student profile.' });
  }
});

// PUT /api/students/:id - update student profile
router.put('/:id', authenticateJWT, requireRoles('ADMIN', 'HOD', 'FACULTY'), (req: AuthenticatedRequest, res) => {
  const { name, semester, batch, department, phone, status, password } = req.body;

  try {
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id) as any;
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found.' });
    }

    if (name) {
      db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), student.user_id);
    }
    if (status) {
      db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, student.user_id);
    }
    if (password) {
      const passwordHash = bcrypt.hashSync(password, 10);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, student.user_id);
    }

    db.prepare(`
      UPDATE students
      SET semester = COALESCE(?, semester),
          batch = COALESCE(?, batch),
          department = COALESCE(?, department),
          phone = COALESCE(?, phone)
      WHERE id = ?
    `).run(
      semester !== undefined ? parseInt(semester, 10) : null,
      batch || null,
      department || null,
      phone || null,
      req.params.id
    );

    logAudit(req.user!.id, req.user!.email, req.user!.role, 'UPDATE_STUDENT', 'STUDENT', req.params.id, `Updated student ID ${req.params.id}`);

    return res.json({ success: true, message: 'Student profile updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to update student profile.' });
  }
});

// POST /api/students/:id/verify - Admin/HOD verifies student account
router.post('/:id/verify', authenticateJWT, requireRoles('ADMIN', 'HOD', 'FACULTY'), (req: AuthenticatedRequest, res) => {
  try {
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id) as any;
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student profile not found.' });
    }

    db.prepare("UPDATE users SET status = 'ACTIVE' WHERE id = ?").run(student.user_id);
    logAudit(req.user!.id, req.user!.email, req.user!.role, 'VERIFY_STUDENT', 'STUDENT', req.params.id, `Verified student account ID ${req.params.id} (${student.usn})`);

    return res.json({ success: true, message: `Student account ${student.usn} verified & activated successfully.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to verify student account.' });
  }
});

// POST /api/students/verify-all - Admin/HOD verifies all pending students
router.post('/verify-all', authenticateJWT, requireRoles('ADMIN', 'HOD'), (req: AuthenticatedRequest, res) => {
  try {
    const result = db.prepare(`
      UPDATE users 
      SET status = 'ACTIVE' 
      WHERE role = 'STUDENT' AND status = 'PENDING_VERIFICATION'
    `).run();

    logAudit(req.user!.id, req.user!.email, req.user!.role, 'VERIFY_ALL_STUDENTS', 'STUDENT', 'ALL', `Bulk verified ${result.changes} pending student accounts`);

    return res.json({
      success: true,
      message: `Successfully verified and activated ${result.changes} student accounts.`,
      verifiedCount: result.changes
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to bulk verify students.' });
  }
});

// DELETE /api/students/:id - delete student
router.delete('/:id', authenticateJWT, requireRoles('ADMIN'), (req: AuthenticatedRequest, res) => {
  try {
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id) as any;
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found.' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(student.user_id);
    logAudit(req.user!.id, req.user!.email, req.user!.role, 'DELETE_STUDENT', 'STUDENT', req.params.id, `Removed student ID ${req.params.id}`);

    return res.json({ success: true, message: 'Student profile removed.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to delete student profile.' });
  }
});

export default router;
