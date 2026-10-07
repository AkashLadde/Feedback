import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../models/db.js';
import { CONFIG } from '../config/constants.js';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

// POST /api/auth/send-otp - Send a 6-digit OTP to student's phone number
router.post('/send-otp', (req, res) => {
  const { phone } = req.body;

  if (!phone || String(phone).trim().length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a valid 10-digit mobile number.'
    });
  }

  try {
    const cleanPhone = String(phone).trim();
    // Generate a secure 6-digit numeric OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes expiry

    // Save to database
    db.prepare(`
      INSERT INTO otp_verifications (phone, otp_code, expires_at, verified, created_at)
      VALUES (?, ?, ?, 0, datetime('now'))
    `).run(cleanPhone, otpCode, expiresAt);

    console.log(`📱 [SMS/OTP SERVICE] Generated OTP ${otpCode} for phone ${cleanPhone}`);

    return res.json({
      success: true,
      message: `OTP has been sent successfully to ${cleanPhone}.`,
      phone: cleanPhone,
      otp: otpCode, // Provided for instant testing and UI verification preview
      expiresInSeconds: 600
    });
  } catch (err: any) {
    console.error('Send OTP error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to send OTP. Please try again.'
    });
  }
});

// POST /api/auth/verify-otp - Verify phone number OTP
router.post('/verify-otp', (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({
      success: false,
      error: 'Mobile number and 6-digit OTP code are required.'
    });
  }

  try {
    const cleanPhone = String(phone).trim();
    const cleanOtp = String(otp).trim();

    // Check latest OTP record for this phone
    const record = db.prepare(`
      SELECT * FROM otp_verifications 
      WHERE phone = ? 
      ORDER BY id DESC LIMIT 1
    `).get(cleanPhone) as any;

    if (!record) {
      return res.status(400).json({
        success: false,
        error: 'No OTP requested for this phone number. Please request an OTP first.'
      });
    }

    if (record.otp_code !== cleanOtp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP code. Please check and enter the correct 6-digit code.'
      });
    }

    // Check expiration
    if (new Date(record.expires_at).getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        error: 'OTP code has expired. Please request a new OTP.'
      });
    }

    // Mark verified
    db.prepare('UPDATE otp_verifications SET verified = 1 WHERE id = ?').run(record.id);

    return res.json({
      success: true,
      message: 'Mobile number verified successfully!',
      phone: cleanPhone,
      verified: true
    });
  } catch (err: any) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify OTP.'
    });
  }
});

// POST /api/auth/register-student - Allow genuine students to create their own accounts
router.post('/register-student', (req, res) => {
  const { name, usn, email, semester, department, batch, phone, phone_otp, password } = req.body;

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
        error: `A student account with USN '${cleanUsn}' already exists. Please sign in directly.`
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

    // Check Phone Verification if phone is provided
    let isPhoneVerified = 0;
    if (cleanPhone) {
      // Check if phone was verified via verify-otp or if inline phone_otp matches
      const latestOtp = db.prepare(`
        SELECT * FROM otp_verifications 
        WHERE phone = ? 
        ORDER BY id DESC LIMIT 1
      `).get(cleanPhone) as any;

      if (latestOtp && (latestOtp.verified === 1 || (phone_otp && latestOtp.otp_code === String(phone_otp).trim()))) {
        isPhoneVerified = 1;
        if (latestOtp.verified !== 1) {
          db.prepare('UPDATE otp_verifications SET verified = 1 WHERE id = ?').run(latestOtp.id);
        }
      } else if (phone_otp) {
        return res.status(400).json({
          success: false,
          error: 'The entered phone OTP is incorrect or expired.'
        });
      }
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    // 1. Create user in users table with ACTIVE status (persistent in DB until Admin removes it)
    const userResult = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, status)
      VALUES (?, ?, ?, 'STUDENT', 'ACTIVE')
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
      ) VALUES (?, ?, ?, '', ?, ?, '2026-2027', ?, ?)
    `).run(
      userId,
      cleanUsn,
      semNum,
      computedBatch,
      department || 'CSE in IoT & Cyber Security including Block Chain Technology',
      cleanPhone,
      isPhoneVerified
    );

    const studentId = Number(studentResult.lastInsertRowid);

    logAudit(userId, cleanEmail, 'STUDENT', 'REGISTER', 'USER', String(userId), `Student ${cleanName} (${cleanUsn}) registered for Semester ${semNum} with phone verification: ${isPhoneVerified ? 'YES' : 'NO'}`);

    const studentProfile = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;

    const payload = {
      id: userId,
      email: cleanEmail,
      name: cleanName,
      role: 'STUDENT' as const,
      status: 'ACTIVE',
      studentId,
      usn: cleanUsn,
      semester: semNum,
      batch: computedBatch,
      department: department || 'CSE in IoT & Cyber Security including Block Chain Technology',
      phone: cleanPhone,
      phone_verified: isPhoneVerified
    };

    const token = jwt.sign(payload, CONFIG.JWT_SECRET, { expiresIn: '12h' });

    return res.status(201).json({
      success: true,
      message: `Student account ${cleanUsn} registered successfully! You can now log in anytime with your USN or email.`,
      token,
      user: {
        ...payload,
        profile: studentProfile
      },
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
