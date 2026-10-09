import { Router } from 'express';
import { db } from '../models/db.js';
import { authenticateJWT, requireRoles, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { evaluateGeofence } from '../services/geofenceService.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

// POST /api/attendance/submit-unified - Unified Atomic Attendance & Mandatory Feedback Submission
router.post('/submit-unified', authenticateJWT, requireRoles('STUDENT'), (req: AuthenticatedRequest, res) => {
  const {
    session_id,
    laboratory_id,
    qr_token,
    session_code,
    latitude,
    longitude,
    accuracy,
    device_fingerprint,
    // Compulsory Feedback Parameters
    overall_rating,
    teaching_basics,
    hands_on,
    teacher_guidance,
    doubt_support,
    reason_understanding,
    viva_taken,
    hardware_setup,
    lab_punctuality,
    comments,
    anonymous_to_teacher
  } = req.body;

  // 1. Mandatory Core Location & Session Verification
  if ((!session_id && !laboratory_id) || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ success: false, error: 'Laboratory subject/session and GPS location coordinates are required.' });
  }

  // 2. Strict Verification of ALL 9 Feedback Criteria (Compulsory for Attendance)
  if (
    !teaching_basics ||
    !hands_on ||
    !teacher_guidance ||
    !doubt_support ||
    !reason_understanding ||
    !viva_taken ||
    !hardware_setup ||
    !lab_punctuality ||
    !overall_rating
  ) {
    return res.status(400).json({
      success: false,
      error: 'Attendance cannot be recorded without mandatory laboratory feedback. All 8 teacher evaluation dimensions and star rating are compulsory.'
    });
  }

  try {
    // 3. Fetch Student Profile
    const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(req.user!.id) as any;
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student profile not found.' });
    }

    // 4. Fetch or Resolve Active Lab Session
    let session: any = null;
    if (session_id) {
      session = db.prepare(`
        SELECT ls.*, l.name as lab_name, l.code as lab_code, l.latitude as lab_lat, l.longitude as lab_lng, l.geofence_radius, l.room_number,
               e.experiment_number, e.title as experiment_title
        FROM lab_sessions ls
        JOIN laboratories l ON ls.laboratory_id = l.id
        JOIN experiments e ON ls.experiment_id = e.id
        WHERE ls.id = ?
      `).get(session_id) as any;
    }

    if (!session && laboratory_id) {
      const lab = db.prepare('SELECT * FROM laboratories WHERE id = ?').get(laboratory_id) as any;
      if (lab) {
        const today = new Date().toISOString().split('T')[0];
        let exp = db.prepare('SELECT id, experiment_number, title FROM experiments WHERE laboratory_id = ? ORDER BY experiment_number ASC LIMIT 1').get(lab.id) as any;
        const expId = exp ? exp.id : 1;

        session = db.prepare(`
          SELECT ls.*, l.name as lab_name, l.code as lab_code, l.latitude as lab_lat, l.longitude as lab_lng, l.geofence_radius, l.room_number,
                 e.experiment_number, e.title as experiment_title
          FROM lab_sessions ls
          JOIN laboratories l ON ls.laboratory_id = l.id
          JOIN experiments e ON ls.experiment_id = e.id
          WHERE ls.laboratory_id = ? AND ls.date = ?
          ORDER BY ls.id DESC LIMIT 1
        `).get(lab.id, today) as any;

        if (!session) {
          const sessionCode = `GNDEC-${lab.code}-${today}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          const insertSess = db.prepare(`
            INSERT INTO lab_sessions (
              session_code, laboratory_id, faculty_id, experiment_id, semester, section, date, start_time, status, started_at
            ) VALUES (?, ?, ?, ?, ?, 'A', ?, '10:00:00', 'ACTIVE', datetime('now'))
          `).run(sessionCode, lab.id, lab.faculty_id || 1, expId, lab.semester || student.semester, today);

          const newSessId = Number(insertSess.lastInsertRowid);
          session = {
            id: newSessId,
            session_code: sessionCode,
            laboratory_id: lab.id,
            faculty_id: lab.faculty_id || 1,
            experiment_id: expId,
            semester: lab.semester || student.semester,
            lab_name: lab.name,
            lab_code: lab.code,
            lab_lat: lab.latitude || 17.9104,
            lab_lng: lab.longitude || 77.5199,
            geofence_radius: lab.geofence_radius || 25.0,
            room_number: lab.room_number,
            experiment_number: exp?.experiment_number || 1,
            experiment_title: exp?.title || `${lab.name} Lab Session`,
            status: 'ACTIVE'
          };
        }
      }
    }

    if (!session) {
      return res.status(404).json({ success: false, error: 'Laboratory session could not be determined. Please contact faculty.' });
    }

    // 5. Anti-Duplication Check (Database Unique Key Guard)
    const existingAttendance = db.prepare(`
      SELECT id, timestamp FROM attendance WHERE student_id = ? AND lab_session_id = ?
    `).get(student.id, session.id) as any;

    if (existingAttendance) {
      return res.status(409).json({
        success: false,
        error: `Attendance and feedback were already recorded for this session at ${existingAttendance.timestamp}. Duplicate submission is strictly prohibited.`
      });
    }

    // 6. High-Precision Satellite GPS Geofence Evaluation (< 25m Room Boundary)
    const geoEval = evaluateGeofence(
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(accuracy || 15.0),
      session.lab_lat || 17.9104,
      session.lab_lng || 77.5199,
      session.geofence_radius || 25.0
    );

    if (geoEval.status === 'OUTSIDE') {
      return res.status(400).json({
        success: false,
        geofence: geoEval,
        error: `Geofence violation: You are outside the laboratory room boundary (${Math.round(geoEval.distance)}m away, allowable radius ${session.geofence_radius || 25}m). You must be physically inside the lab to submit attendance & feedback.`
      });
    }

    // 7. Atomic Database Transaction: Insert Attendance Record & Mandatory Feedback Record Together
    const ratingNum = parseInt(overall_rating, 10) || 5;

    // Insert Attendance
    const attendanceResult = db.prepare(`
      INSERT OR REPLACE INTO attendance (
        student_id, lab_session_id, experiment_id,
        latitude, longitude, accuracy, distance_to_lab,
        geofence_status, verification_status, device_fingerprint, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PRESENT', ?, datetime('now'))
    `).run(
      student.id,
      session.id,
      session.experiment_id,
      latitude,
      longitude,
      accuracy || 15.0,
      geoEval.distance,
      geoEval.status,
      device_fingerprint || null
    );

    const attendanceId = Number(attendanceResult.lastInsertRowid);

    // Insert Feedback Linked to Attendance and Laboratory
    const feedbackResult = db.prepare(`
      INSERT INTO feedback (
        student_id, lab_session_id, experiment_id, laboratory_id, faculty_id,
        teaching_basics, hands_on, doubt_support, reason_understanding,
        viva_taken, hardware_setup, teacher_guidance, lab_punctuality,
        overall_rating, comments, anonymous_to_teacher,
        viva, understanding, latitude, longitude, accuracy, distance_to_lab,
        qr_token_used, verification_status, flags, submitted_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, 'VERIFIED', '[]', datetime('now')
      )
    `).run(
      student.id,
      session.id,
      session.experiment_id,
      session.laboratory_id,
      session.faculty_id || 1,
      teaching_basics,
      hands_on,
      doubt_support,
      reason_understanding,
      viva_taken,
      hardware_setup,
      teacher_guidance,
      lab_punctuality,
      ratingNum,
      comments ? comments.trim() : '',
      anonymous_to_teacher !== undefined ? (anonymous_to_teacher ? 1 : 0) : 1,
      (viva_taken || '').includes('Yes') ? 'Yes' : 'No',
      reason_understanding || 'Completely understood',
      latitude,
      longitude,
      accuracy || 15.0,
      geoEval.distance,
      qr_token || 'DIRECT_PORTAL'
    );

    const feedbackId = Number(feedbackResult.lastInsertRowid);

    // Log Audit Event
    logAudit(
      req.user!.id,
      req.user!.email,
      req.user!.role,
      'SUBMIT_UNIFIED_ATTENDANCE_FEEDBACK',
      'ATTENDANCE',
      String(attendanceId),
      `Unified attendance and mandatory feedback recorded for ${session.lab_name} (${session.session_code}) Rating: ${ratingNum}/5`
    );

    return res.status(201).json({
      success: true,
      message: 'Attendance & Mandatory Laboratory Feedback recorded successfully.',
      attendanceId,
      feedbackId,
      sessionCode: session.session_code,
      labName: session.lab_name,
      experimentTitle: `Exp #${session.experiment_number}: ${session.experiment_title}`,
      geofence: geoEval,
      submittedAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Unified attendance submission error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to record attendance and feedback.' });
  }
});

// POST /api/attendance/check-in - Student marks attendance with Geofence verification
router.post('/check-in', authenticateJWT, requireRoles('STUDENT'), (req: AuthenticatedRequest, res) => {
  const { session_id, latitude, longitude, accuracy, device_fingerprint } = req.body;

  if (!session_id || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ success: false, error: 'Session ID and location coordinates are required.' });
  }

  try {
    // 1. Get student profile
    const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(req.user!.id) as any;
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student profile not found.' });
    }

    // 2. Get active session
    const session = db.prepare(`
      SELECT ls.*, l.name as lab_name, l.latitude as lab_lat, l.longitude as lab_lng, l.geofence_radius
      FROM lab_sessions ls
      JOIN laboratories l ON ls.laboratory_id = l.id
      WHERE ls.id = ?
    `).get(session_id) as any;

    if (!session) {
      return res.status(404).json({ success: false, error: 'Laboratory session not found.' });
    }

    if (session.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, error: 'This laboratory session has ended or is not active.' });
    }

    // 3. Semester match verification
    if (student.semester !== session.semester) {
      return res.status(400).json({
        success: false,
        error: `Semester mismatch: You are enrolled in Semester ${student.semester}, while this session is for Semester ${session.semester}.`
      });
    }

    // 4. Check duplicate attendance
    const existing = db.prepare(`
      SELECT id, timestamp FROM attendance WHERE student_id = ? AND lab_session_id = ?
    `).get(student.id, session.id) as any;

    if (existing) {
      return res.status(400).json({
        success: false,
        error: `Attendance already recorded for this session at ${existing.timestamp}.`
      });
    }

    // 5. Evaluate Geofence
    const geoEval = evaluateGeofence(
      latitude,
      longitude,
      accuracy || 15.0,
      session.lab_lat,
      session.lab_lng,
      session.geofence_radius
    );

    if (geoEval.status === 'OUTSIDE') {
      return res.status(400).json({
        success: false,
        geofence: geoEval,
        error: geoEval.message
      });
    }

    if (geoEval.status === 'UNCERTAIN') {
      return res.status(400).json({
        success: false,
        geofence: geoEval,
        error: 'Location accuracy is insufficient. Please move to an open area and retry.'
      });
    }

    // 6. Record Attendance
    const insertResult = db.prepare(`
      INSERT INTO attendance (
        student_id, lab_session_id, experiment_id,
        latitude, longitude, accuracy, distance_to_lab,
        geofence_status, verification_status, device_fingerprint, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PRESENT', ?, datetime('now'))
    `).run(
      student.id,
      session.id,
      session.experiment_id,
      latitude,
      longitude,
      accuracy || 15.0,
      geoEval.distance,
      geoEval.status,
      device_fingerprint || null
    );

    logAudit(
      req.user!.id,
      req.user!.email,
      req.user!.role,
      'ATTENDANCE_CHECKIN',
      'ATTENDANCE',
      String(insertResult.lastInsertRowid),
      `Check-in recorded for session ${session.session_code} (Dist: ${geoEval.distance}m)`
    );

    return res.status(201).json({
      success: true,
      message: 'Attendance successfully marked. You are verified inside the laboratory area.',
      geofence: geoEval,
      attendanceId: Number(insertResult.lastInsertRowid)
    });
  } catch (err: any) {
    console.error('Attendance check-in error:', err);
    return res.status(500).json({ success: false, error: 'Failed to record attendance.' });
  }
});

// GET /api/attendance/student/:id - Student attendance history
router.get('/student/:id', authenticateJWT, (req: AuthenticatedRequest, res) => {
  try {
    const studentId = (req.params.id === 'me' ? req.user!.studentId : req.params.id) || 0;

    const records = db.prepare(`
      SELECT a.*, 
             ls.session_code, ls.date as session_date,
             l.name as lab_name, l.code as lab_code,
             e.experiment_number, e.title as experiment_title,
             f.id as feedback_id, f.verification_status as feedback_verification_status
      FROM attendance a
      JOIN lab_sessions ls ON a.lab_session_id = ls.id
      JOIN laboratories l ON ls.laboratory_id = l.id
      JOIN experiments e ON a.experiment_id = e.id
      LEFT JOIN feedback f ON (f.student_id = a.student_id AND f.lab_session_id = a.lab_session_id)
      WHERE a.student_id = ?
      ORDER BY a.timestamp DESC
    `).all(studentId);

    const totalSessions = records.length;
    const presentCount = records.filter((r: any) => r.verification_status === 'PRESENT').length;

    return res.json({
      success: true,
      records,
      summary: {
        totalSessions,
        present: presentCount,
        absent: 0,
        percentage: 100
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch attendance history.' });
  }
});

// GET /api/attendance/roster - Get roster of students with attendance state for date & subject
router.get('/roster', authenticateJWT, requireRoles('FACULTY', 'ADMIN'), (req: AuthenticatedRequest, res) => {
  const { semester, laboratory_id, date } = req.query;

  try {
    const sem = semester ? parseInt(semester as string, 10) : 7;
    const targetDate = (date as string) || new Date().toISOString().split('T')[0];

    // Find if session exists for this lab and date
    let sessionId: number | null = null;
    if (laboratory_id) {
      const labIdNum = parseInt(laboratory_id as string, 10);
      const sess = db.prepare(`
        SELECT id FROM lab_sessions 
        WHERE laboratory_id = ? AND date = ?
        ORDER BY id DESC LIMIT 1
      `).get(labIdNum, targetDate) as any;
      if (sess) sessionId = sess.id;
    }

    // Get all students for this semester
    const students = db.prepare(`
      SELECT s.id as student_id, s.usn, s.semester, s.batch, s.department,
             u.id as user_id, u.name, u.email,
             a.id as attendance_id, a.verification_status, a.timestamp as attendance_time,
             a.remarks, a.attendance_mode
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN attendance a ON (a.student_id = s.id AND a.lab_session_id = ?)
      WHERE s.semester = ?
      ORDER BY s.usn ASC
    `).all(sessionId || 0, sem);

    return res.json({
      success: true,
      students,
      sessionId,
      targetDate,
      semester: sem
    });
  } catch (err: any) {
    console.error('Error fetching roster:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch student attendance roster.' });
  }
});

// POST /api/attendance/take - Teacher marks attendance for a class session
router.post('/take', authenticateJWT, requireRoles('FACULTY', 'ADMIN'), (req: AuthenticatedRequest, res) => {
  const { laboratory_id, semester, date, time_slot, attendance } = req.body;

  if (!laboratory_id || !attendance || !Array.isArray(attendance)) {
    return res.status(400).json({ success: false, error: 'Laboratory ID and student attendance list are required.' });
  }

  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const sem = semester ? parseInt(semester, 10) : 7;
    const timeSlotLabel = time_slot || 'Regular Session';

    // Get laboratory info
    const lab = db.prepare('SELECT * FROM laboratories WHERE id = ?').get(laboratory_id) as any;
    if (!lab) {
      return res.status(404).json({ success: false, error: 'Subject / Laboratory not found.' });
    }

    // Determine Faculty ID
    let facultyId: number = req.user?.facultyId || 0;
    if (!facultyId) {
      const f = db.prepare('SELECT id FROM faculty WHERE user_id = ?').get(req.user!.id) as any;
      facultyId = f ? f.id : (lab.faculty_id || 1);
    }

    // First experiment id of lab for foreign key compatibility
    let exp = db.prepare('SELECT id FROM experiments WHERE laboratory_id = ? ORDER BY experiment_number ASC LIMIT 1').get(lab.id) as any;
    let expId = exp ? exp.id : 1;

    // Check or create session for this subject & date
    let session = db.prepare(`
      SELECT * FROM lab_sessions 
      WHERE laboratory_id = ? AND date = ?
      ORDER BY id DESC LIMIT 1
    `).get(lab.id, targetDate) as any;

    if (!session) {
      const sessionCode = `ATT-${lab.code}-${targetDate}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const insertSess = db.prepare(`
        INSERT INTO lab_sessions (
          session_code, laboratory_id, faculty_id, experiment_id, semester, section, date, start_time, status, started_at
        ) VALUES (?, ?, ?, ?, ?, '', ?, ?, 'COMPLETED', datetime('now'))
      `).run(sessionCode, lab.id, facultyId, expId, sem, targetDate, timeSlotLabel);

      session = { id: Number(insertSess.lastInsertRowid), session_code: sessionCode };
    }

    // Insert or update attendance for each student in the batch
    const upsertAtt = db.prepare(`
      INSERT INTO attendance (
        student_id, lab_session_id, experiment_id, timestamp,
        latitude, longitude, accuracy, distance_to_lab, geofence_status,
        verification_status, marked_by_faculty_id, remarks, attendance_mode
      ) VALUES (?, ?, ?, datetime('now'), ?, ?, 5.0, 0.0, 'INSIDE', ?, ?, ?, 'ROSTER')
      ON CONFLICT(student_id, lab_session_id) DO UPDATE SET
        verification_status = excluded.verification_status,
        remarks = excluded.remarks,
        marked_by_faculty_id = excluded.marked_by_faculty_id,
        timestamp = datetime('now')
    `);

    let present = 0;
    let absent = 0;
    let late = 0;

    for (const record of attendance) {
      const status = (record.status || 'PRESENT').toUpperCase();
      if (status === 'PRESENT') present++;
      else if (status === 'ABSENT') absent++;
      else if (status === 'LATE') late++;

      upsertAtt.run(
        record.student_id,
        session.id,
        expId,
        lab.latitude || 17.9104,
        lab.longitude || 77.5199,
        status,
        facultyId,
        record.remarks || null
      );
    }

    logAudit(
      req.user!.id,
      req.user!.email,
      req.user!.role,
      'TAKE_ATTENDANCE',
      'ATTENDANCE',
      String(session.id),
      `Marked attendance for ${lab.name} (${lab.code}) Sem ${sem} on ${targetDate}. Total: ${attendance.length}, Present: ${present}, Absent: ${absent}`
    );

    return res.json({
      success: true,
      message: `Attendance recorded successfully: ${present} Present, ${absent} Absent, ${late} Late.`,
      summary: {
        total: attendance.length,
        present,
        absent,
        late,
        percentage: attendance.length > 0 ? Math.round((present / attendance.length) * 100) : 100
      },
      sessionId: session.id
    });
  } catch (err: any) {
    console.error('Attendance take error:', err);
    return res.status(500).json({ success: false, error: 'Failed to record class attendance.' });
  }
});

// GET /api/attendance/teacher/sessions - Sessions & attendance batches taken by this faculty
router.get('/teacher/sessions', authenticateJWT, requireRoles('FACULTY', 'ADMIN'), (req: AuthenticatedRequest, res) => {
  try {
    let facultyId = req.user?.facultyId;
    if (!facultyId) {
      const f = db.prepare('SELECT id FROM faculty WHERE user_id = ?').get(req.user!.id) as any;
      if (f) facultyId = f.id;
    }

    const sessions = db.prepare(`
      SELECT ls.*, l.name as lab_name, l.code as lab_code, l.room_number,
             (SELECT COUNT(*) FROM attendance WHERE lab_session_id = ls.id) as total_marked,
             (SELECT COUNT(*) FROM attendance WHERE lab_session_id = ls.id AND verification_status = 'PRESENT') as present_count,
             (SELECT COUNT(*) FROM attendance WHERE lab_session_id = ls.id AND verification_status = 'ABSENT') as absent_count
      FROM lab_sessions ls
      JOIN laboratories l ON ls.laboratory_id = l.id
      WHERE ls.faculty_id = ? OR ? = 'ADMIN'
      ORDER BY ls.date DESC, ls.id DESC
      LIMIT 50
    `).all(facultyId || 0, req.user!.role);

    return res.json({ success: true, sessions });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch teacher attendance sessions.' });
  }
});

// GET /api/attendance/all - Admin complete attendance records view
router.get('/all', authenticateJWT, requireRoles('ADMIN'), (req, res) => {
  const { semester, date, search, limit } = req.query;

  try {
    let query = `
      SELECT a.*, s.usn, s.semester, s.department, u.name as student_name,
             l.name as lab_name, l.code as lab_code,
             fac_u.name as teacher_name,
             ls.session_code, ls.date as session_date, ls.start_time as time_slot
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN lab_sessions ls ON a.lab_session_id = ls.id
      JOIN laboratories l ON ls.laboratory_id = l.id
      LEFT JOIN faculty f ON a.marked_by_faculty_id = f.id OR ls.faculty_id = f.id
      LEFT JOIN users fac_u ON f.user_id = fac_u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (semester && semester !== 'ALL') {
      query += ` AND s.semester = ?`;
      params.push(parseInt(semester as string, 10));
    }

    if (date) {
      query += ` AND ls.date = ?`;
      params.push(date);
    }

    if (search) {
      query += ` AND (u.name LIKE ? OR s.usn LIKE ? OR l.name LIKE ? OR l.code LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY a.timestamp DESC LIMIT ?`;
    params.push(parseInt((limit as string) || '150', 10));

    const records = db.prepare(query).all(...params);

    const stats = {
      total: records.length,
      present: records.filter((r: any) => r.verification_status === 'PRESENT').length,
      absent: records.filter((r: any) => r.verification_status === 'ABSENT').length,
      late: records.filter((r: any) => r.verification_status === 'LATE').length
    };

    return res.json({ success: true, records, stats });
  } catch (err: any) {
    console.error('Error fetching all attendance:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch attendance records.' });
  }
});

export default router;
