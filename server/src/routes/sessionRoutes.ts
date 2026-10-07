import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../models/db.js';
import { authenticateJWT, requireRoles, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { generateDynamicQR } from '../services/qrService.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

// POST /api/sessions/start - Faculty/Admin/HOD starts a new lab session
router.post('/start', authenticateJWT, requireRoles('FACULTY', 'ADMIN', 'HOD'), async (req: AuthenticatedRequest, res) => {
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
router.post('/:id/end', authenticateJWT, requireRoles('FACULTY', 'ADMIN', 'HOD'), (req: AuthenticatedRequest, res) => {
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

// Helper functions to parse timetable slot ranges (e.g. '09.00 AM - 12.00 PM')
function parseTimeToMinutes(timeStr: string): number {
  const clean = timeStr.trim().toUpperCase().replace(/\./g, ':');
  const match = clean.match(/(\d+):(\d+)\s*(AM|PM)/);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3];
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function parseTimeRange(rangeStr: string): { startMin: number; endMin: number } {
  const parts = rangeStr.split('-');
  if (parts.length < 2) return { startMin: 0, endMin: 1440 };
  return {
    startMin: parseTimeToMinutes(parts[0]),
    endMin: parseTimeToMinutes(parts[1])
  };
}

// POST /api/sessions/:id/unlock-window - Faculty or Admin unlocks/forces open the 10-minute attendance & feedback window
router.post('/:id/unlock-window', authenticateJWT, requireRoles('FACULTY', 'ADMIN', 'HOD'), (req: AuthenticatedRequest, res) => {
  try {
    const session = db.prepare('SELECT * FROM lab_sessions WHERE id = ?').get(req.params.id) as any;
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }

    db.prepare(`
      UPDATE lab_sessions 
      SET status = 'ACTIVE'
      WHERE id = ?
    `).run(req.params.id);

    logAudit(req.user!.id, req.user!.email, req.user!.role, 'UNLOCK_ATTENDANCE_WINDOW', 'LAB_SESSION', req.params.id, `Unlocked attendance and feedback window for session ${session.session_code}`);

    return res.json({ success: true, message: 'Attendance & Feedback submission window is now active and unlocked.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to unlock attendance window.' });
  }
});

// GET /api/sessions/student-status - Live semester-isolated lab schedule & 10-minute window check for logged in student
router.get('/student-status', authenticateJWT, requireRoles('STUDENT'), (req: AuthenticatedRequest, res) => {
  try {
    const student = db.prepare(`
      SELECT s.*, u.name, u.email 
      FROM students s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.user_id = ?
    `).get(req.user!.id) as any;

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student record not found.' });
    }

    const semNum = student.semester || 3;
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const now = new Date();
    const currentDay = days[now.getDay()];
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentMinutesOfDay = currentHour * 60 + currentMinute;
    const currentTimeFormatted = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    // 1. Fetch Today's scheduled timetable labs for this student's semester ONLY
    const todayLabs = db.prepare(`
      SELECT te.*, l.id as laboratory_id, l.latitude, l.longitude, l.geofence_radius, l.room_number, l.location
      FROM timetable_entries te
      LEFT JOIN laboratories l ON l.code = te.subject_code
      WHERE te.semester = ? AND upper(te.day_of_week) = ?
      ORDER BY te.slot_index ASC
    `).all(semNum, currentDay) as any[];

    // Fetch full weekly timetable for this semester (Monday to Saturday)
    const allWeeklyLabs = db.prepare(`
      SELECT te.*, l.id as laboratory_id, l.latitude, l.longitude, l.geofence_radius, l.room_number, l.location
      FROM timetable_entries te
      LEFT JOIN laboratories l ON l.code = te.subject_code
      WHERE te.semester = ?
      ORDER BY 
        CASE upper(te.day_of_week)
          WHEN 'MONDAY' THEN 1
          WHEN 'TUESDAY' THEN 2
          WHEN 'WEDNESDAY' THEN 3
          WHEN 'THURSDAY' THEN 4
          WHEN 'FRIDAY' THEN 5
          WHEN 'SATURDAY' THEN 6
          ELSE 7
        END,
        te.slot_index ASC
    `).all(semNum) as any[];

    // 2. Fetch Active Faculty-Started Session for this Semester (if any)
    const activeFacultySession = db.prepare(`
      SELECT ls.*, 
             l.name as lab_name, l.code as lab_code, l.room_number, l.location, l.latitude, l.longitude, l.geofence_radius,
             e.experiment_number, e.title as experiment_title, e.description as experiment_description,
             u.name as faculty_name, f.employee_id as faculty_emp_id
      FROM lab_sessions ls
      JOIN laboratories l ON ls.laboratory_id = l.id
      JOIN experiments e ON ls.experiment_id = e.id
      JOIN faculty f ON ls.faculty_id = f.id
      JOIN users u ON f.user_id = u.id
      WHERE ls.semester = ? AND ls.status = 'ACTIVE'
      ORDER BY ls.started_at DESC LIMIT 1
    `).get(semNum) as any;

    // 3. Determine if student is currently within scheduled lab timing & 5-minute submission window
    let matchingSlot: any = null;
    let isWithinTimetableTime = false;
    let is5MinWindowActive = false;
    let isBeforeWindow = false;
    let isWindowExpired = false;
    let minutesUntilWindowOpens = 0;
    let minutesRemainingInWindow = 0;
    let windowOpenTimeStr = '';
    let windowCloseTimeStr = '';

    const formatMinutesToTime = (totalMin: number) => {
      const h24 = Math.floor(totalMin / 60) % 24;
      const m = totalMin % 60;
      const period = h24 >= 12 ? 'PM' : 'AM';
      const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
      return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
    };

    for (const slot of todayLabs) {
      const { startMin, endMin } = parseTimeRange(slot.time_range || '');
      if (currentMinutesOfDay >= startMin && currentMinutesOfDay <= endMin) {
        matchingSlot = slot;
        isWithinTimetableTime = true;

        // The window opens 10 mins before end of lab, and stays visible for ONLY 5 mins (from endMin - 10 to endMin - 5)
        const windowOpenMin = endMin - 10;
        const windowCloseMin = endMin - 5;

        windowOpenTimeStr = formatMinutesToTime(windowOpenMin);
        windowCloseTimeStr = formatMinutesToTime(windowCloseMin);

        if (currentMinutesOfDay >= windowOpenMin && currentMinutesOfDay <= windowCloseMin) {
          is5MinWindowActive = true;
          isBeforeWindow = false;
          isWindowExpired = false;
          minutesRemainingInWindow = windowCloseMin - currentMinutesOfDay;
          minutesUntilWindowOpens = 0;
        } else if (currentMinutesOfDay < windowOpenMin) {
          is5MinWindowActive = false;
          isBeforeWindow = true;
          isWindowExpired = false;
          minutesUntilWindowOpens = windowOpenMin - currentMinutesOfDay;
        } else {
          is5MinWindowActive = false;
          isBeforeWindow = false;
          isWindowExpired = true;
        }
        break;
      }
    }

    // If an active session is live from admin/faculty, permit active access and unlock submission window
    const isLabActive = !!activeFacultySession || isWithinTimetableTime;
    
    if (activeFacultySession) {
      is5MinWindowActive = true;
      isBeforeWindow = false;
      isWindowExpired = false;
      if (!minutesRemainingInWindow || minutesRemainingInWindow <= 0) {
        minutesRemainingInWindow = 15;
      }
      if (!windowCloseTimeStr) {
        windowCloseTimeStr = formatMinutesToTime(currentMinutesOfDay + 15);
      }
    }

    // 4. Find Next Upcoming Scheduled Lab for THIS SEMESTER ONLY if not currently in lab
    let nextScheduledLab: any = null;
    if (!isLabActive) {
      for (const slot of todayLabs) {
        const { startMin } = parseTimeRange(slot.time_range || '');
        if (startMin > currentMinutesOfDay) {
          nextScheduledLab = { ...slot, when: `Today at ${slot.time_range.split('-')[0].trim()}` };
          break;
        }
      }

      if (!nextScheduledLab) {
        const allUpcoming = db.prepare(`
          SELECT * FROM timetable_entries 
          WHERE semester = ? 
          ORDER BY CASE day_of_week 
            WHEN 'MONDAY' THEN 1 
            WHEN 'TUESDAY' THEN 2 
            WHEN 'WEDNESDAY' THEN 3 
            WHEN 'THURSDAY' THEN 4 
            WHEN 'FRIDAY' THEN 5 
            WHEN 'SATURDAY' THEN 6 
            ELSE 7 END, slot_index ASC
        `).all(semNum) as any[];

        if (allUpcoming.length > 0) {
          nextScheduledLab = { ...allUpcoming[0], when: `${allUpcoming[0].day_of_week} (${allUpcoming[0].time_range})` };
        }
      }
    }

    // 5. Check if student has ALREADY submitted attendance & feedback for this active session
    let hasSubmitted = false;
    let submissionRecord: any = null;

    if (activeFacultySession) {
      const existing = db.prepare(`
        SELECT a.id as attendance_id, a.timestamp as attendance_time, a.distance_to_lab,
               f.id as feedback_id, f.overall_rating, f.submitted_at as feedback_time,
               f.verification_status
        FROM attendance a
        LEFT JOIN feedback f ON (f.student_id = a.student_id AND f.lab_session_id = a.lab_session_id)
        WHERE a.student_id = ? AND a.lab_session_id = ?
      `).get(student.id, activeFacultySession.id) as any;

      if (existing) {
        hasSubmitted = true;
        submissionRecord = existing;
      }
    } else if (matchingSlot) {
      const todayExisting = db.prepare(`
        SELECT a.id as attendance_id, a.timestamp as attendance_time, a.distance_to_lab,
               f.id as feedback_id, f.overall_rating, f.submitted_at as feedback_time,
               f.verification_status
        FROM attendance a
        JOIN lab_sessions ls ON a.lab_session_id = ls.id
        JOIN laboratories l ON ls.laboratory_id = l.id
        LEFT JOIN feedback f ON (f.student_id = a.student_id AND f.lab_session_id = a.lab_session_id)
        WHERE a.student_id = ? AND l.code = ? AND date(a.timestamp) = date('now')
      `).get(student.id, matchingSlot.subject_code) as any;

      if (todayExisting) {
        hasSubmitted = true;
        submissionRecord = todayExisting;
      }
    }

    return res.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        usn: student.usn,
        semester: semNum,
        batch: student.batch || (semNum === 1 ? 'Batch 2026' : semNum === 3 ? 'Batch 2025' : semNum === 5 ? 'Batch 2024' : 'Batch 2023')
      },
      currentDay,
      currentTime: currentTimeFormatted,
      isLabActive,
      is5MinWindowActive,
      isBeforeWindow,
      isWindowExpired,
      minutesUntilWindowOpens,
      minutesRemainingInWindow,
      windowOpenTimeStr,
      windowCloseTimeStr,
      activeSession: activeFacultySession,
      matchingSlot,
      todayScheduledLabs: todayLabs,
      weeklyScheduledLabs: allWeeklyLabs,
      nextScheduledLab,
      hasSubmitted,
      submissionRecord
    });
  } catch (err: any) {
    console.error('Student status check error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve student laboratory status.' });
  }
});

// GET /api/sessions/active - get all currently active lab sessions
router.get('/active', (req, res) => {
  try {
    const sessions = db.prepare(`
      SELECT ls.*, 
             l.name as lab_name, l.code as lab_code, l.room_number, l.location, l.latitude, l.longitude, l.geofence_radius,
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
             l.name as lab_name, l.code as lab_code, l.room_number, l.location, l.latitude, l.longitude, l.geofence_radius,
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
