import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../models/db.js';
import { CONFIG } from '../config/constants.js';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

// POST /api/auth/register-student - Allow genuine students to create their own accounts (Admin/HOD Verification Required)
router.post('/register-student', (req, res) => {
  const { name, usn, email, semester, department, batch, phone, password } = req.body;

  if (!name || !usn || !email || !semester || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please provide full name, USN, institutional email, semester, and password.'
    });
  }

  try {
    const cleanUsn = usn.toUpperCase().trim();
    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();
    const cleanPhone = phone ? String(phone).trim() : null;
    const semNum = parseInt(semester, 10);

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.'
      });
    }

    // Check if USN already exists
    const existingUsn = db.prepare('SELECT id FROM students WHERE upper(usn) = ?').get(cleanUsn);
    if (existingUsn) {
      return res.status(400).json({
        success: false,
        error: `A student account with USN '${cleanUsn}' already exists. Please sign in directly or await admin approval.`
      });
    }

    // Check if email already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE lower(email) = ?').get(cleanEmail);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: `A user account with email '${cleanEmail}' is already registered. Please sign in.`
      });
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    // 1. Create user in users table with PENDING_VERIFICATION status (Requires Admin Approval before Login)
    const userResult = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, status)
      VALUES (?, ?, ?, 'STUDENT', 'PENDING_VERIFICATION')
    `).run(cleanName, cleanEmail, passwordHash);

    const userId = Number(userResult.lastInsertRowid);

    // 2. Compute correct batch according to semester (1st to 8th sem)
    let computedBatch = batch;
    if (!computedBatch) {
      if (semNum === 1 || semNum === 2) computedBatch = '2026-2030 (Batch 2026)';
      else if (semNum === 3 || semNum === 4) computedBatch = '2025-2029 (Batch 2025)';
      else if (semNum === 5 || semNum === 6) computedBatch = '2024-2028 (Batch 2024)';
      else if (semNum === 7 || semNum === 8) computedBatch = '2023-2027 (Batch 2023)';
      else computedBatch = '2026-2030 (Batch 2026)';
    }

    // 3. Create student profile in students table
    const studentResult = db.prepare(`
      INSERT INTO students (
        user_id, usn, semester, section, batch, department, academic_year, phone, phone_verified
      ) VALUES (?, ?, ?, '', ?, ?, '2026-2027', ?, 1)
    `).run(
      userId,
      cleanUsn,
      semNum,
      computedBatch,
      department || 'CSE in IoT & Cyber Security including Block Chain Technology',
      cleanPhone
    );

    const studentId = Number(studentResult.lastInsertRowid);

    logAudit(userId, cleanEmail, 'STUDENT', 'REGISTER_PENDING', 'USER', String(userId), `New student ${cleanName} (${cleanUsn}) registered for Semester ${semNum}. Pending Administrator verification.`);

    return res.status(201).json({
      success: true,
      requiresVerification: true,
      message: `Registration submitted successfully for ${cleanName} (${cleanUsn})! Your account is currently pending verification by the Administrator. You can log in once approved by the HOD / Admin.`,
      studentId,
      usn: cleanUsn,
      semester: semNum
    });
  } catch (err: any) {
    console.error('Student registration error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Registration failed. Please verify details and try again.'
    });
  }
});

// Alias: POST /api/auth/register
router.post('/register', (req, res, next) => {
  return (router as any).handle({ ...req, url: '/register-student' }, res, next);
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password, usn, identifier: rawId } = req.body;

  try {
    let user: any;
    const identifier = (rawId || usn || email || '').trim();

    // Check if identifier matches a student USN
    const student = db.prepare('SELECT user_id FROM students WHERE upper(usn) = upper(?)').get(identifier) as any;
    if (student) {
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(student.user_id);
    } else if (identifier) {
      // Check if identifier matches email OR phone
      user = db.prepare('SELECT * FROM users WHERE lower(email) = lower(?)').get(identifier);
      if (!user) {
        const studentByPhone = db.prepare('SELECT user_id FROM students WHERE phone = ?').get(identifier) as any;
        if (studentByPhone) {
          user = db.prepare('SELECT * FROM users WHERE id = ?').get(studentByPhone.user_id);
        }
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email, USN, or password.' });
    }

    // Strict Admin Verification Check for Students
    if (user.status === 'PENDING_VERIFICATION' || user.status === 'PENDING') {
      return res.status(403).json({
        success: false,
        isPendingVerification: true,
        error: 'Your student registration is pending verification and approval by the Administrator. Please contact the HOD / Admin office to activate your account.'
      });
    }

    if (user.status === 'REJECTED') {
      return res.status(403).json({
        success: false,
        error: 'Your student registration was rejected by the Administrator. Please contact the department office.'
      });
    }

    if (user.status === 'SUSPENDED' || user.status === 'DEACTIVATED' || user.status === 'INACTIVE') {
      return res.status(403).json({
        success: false,
        error: 'This account has been deactivated or suspended.'
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email, USN, or password.' });
    }

    let studentProfile: any = null;
    let facultyProfile: any = null;

    if (user.role === 'STUDENT') {
      studentProfile = db.prepare('SELECT * FROM students WHERE user_id = ?').get(user.id);
    } else if (user.role === 'FACULTY') {
      facultyProfile = db.prepare('SELECT * FROM faculty WHERE user_id = ?').get(user.id);
    }

    const semNumber = studentProfile?.semester !== undefined && studentProfile?.semester !== null 
      ? Number(studentProfile.semester) 
      : undefined;

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      studentId: studentProfile?.id,
      facultyId: facultyProfile?.id,
      usn: studentProfile?.usn,
      semester: semNumber,
      batch: studentProfile?.batch,
      department: studentProfile?.department,
      phone: studentProfile?.phone,
      phone_verified: studentProfile?.phone_verified || 0
    };

    const token = jwt.sign(payload, CONFIG.JWT_SECRET, { expiresIn: '12h' });

    logAudit(user.id, user.email, user.role, 'LOGIN', 'USER', String(user.id), 'Successful user login');

    return res.json({
      success: true,
      token,
      user: {
        ...payload,
        profile: studentProfile || facultyProfile
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateJWT, (req: AuthenticatedRequest, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, role, status, created_at FROM users WHERE id = ?').get(req.user!.id) as any;
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    let studentProfile: any = null;
    let facultyProfile: any = null;

    if (user.role === 'STUDENT') {
      studentProfile = db.prepare('SELECT * FROM students WHERE user_id = ?').get(user.id);
    } else if (user.role === 'FACULTY') {
      facultyProfile = db.prepare('SELECT * FROM faculty WHERE user_id = ?').get(user.id);
    }

    const semNumber = studentProfile?.semester !== undefined && studentProfile?.semester !== null 
      ? Number(studentProfile.semester) 
      : undefined;

    return res.json({
      success: true,
      user: {
        ...user,
        studentId: studentProfile?.id,
        facultyId: facultyProfile?.id,
        usn: studentProfile?.usn,
        semester: semNumber,
        batch: studentProfile?.batch,
        department: studentProfile?.department,
        phone: studentProfile?.phone,
        phone_verified: studentProfile?.phone_verified || 0,
        profile: studentProfile || facultyProfile
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve profile.' });
  }
});

// PUT /api/auth/profile - Update credentials
router.put('/profile', authenticateJWT, (req: AuthenticatedRequest, res) => {
  const { name, email, password } = req.body;
  const userId = req.user!.id;

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const existing = db.prepare('SELECT id FROM users WHERE lower(email) = ? AND id != ?').get(email.toLowerCase(), userId);
      if (existing) {
        return res.status(400).json({ success: false, error: 'This email address is already in use by another account.' });
      }
      db.prepare('UPDATE users SET email = ? WHERE id = ?').run(email.toLowerCase().trim(), userId);
    }

    if (name) {
      db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), userId);
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
      }
      const passwordHash = bcrypt.hashSync(password, 10);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, userId);
    }

    logAudit(userId, email || user.email, user.role, 'UPDATE_PROFILE', 'USER', String(userId), 'Updated user credentials/profile');

    const updated = db.prepare('SELECT id, name, email, role, status FROM users WHERE id = ?').get(userId) as any;

    return res.json({
      success: true,
      message: 'Credentials updated successfully.',
      user: updated
    });
  } catch (err: any) {
    console.error('Profile update error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to update profile.' });
  }
});

// GET /api/auth/demo-users
router.get('/demo-users', (_req, res) => {
  return res.json({ success: true, demoAccounts: [] });
});

export default router;
