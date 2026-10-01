import { Router } from 'express';
import { db } from '../models/db.js';
import { authenticateJWT, requireRoles } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/reports/attendance - Attendance Report
router.get('/attendance', authenticateJWT, requireRoles('ADMIN', 'HOD', 'FACULTY'), (req, res) => {
  const { lab_id, semester, date_from, date_to } = req.query;

  try {
    let query = `
      SELECT a.id, a.timestamp, a.geofence_status, a.distance_to_lab, a.verification_status,
             s.usn, s.semester, s.department, u.name as student_name,
             l.name as lab_name, l.code as lab_code,
             e.experiment_number, e.title as experiment_title,
             ls.session_code, ls.date as session_date
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN lab_sessions ls ON a.lab_session_id = ls.id
      JOIN laboratories l ON ls.laboratory_id = l.id
      JOIN experiments e ON a.experiment_id = e.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (lab_id && lab_id !== 'ALL') {
      query += ` AND l.id = ?`;
      params.push(lab_id);
    }
    if (semester && semester !== 'ALL') {
      query += ` AND s.semester = ?`;
      params.push(semester);
    }
    if (date_from) {
      query += ` AND ls.date >= ?`;
      params.push(date_from);
    }
    if (date_to) {
      query += ` AND ls.date <= ?`;
      params.push(date_to);
    }

    query += ` ORDER BY a.timestamp DESC`;

    const records = db.prepare(query).all(...params);

    if (req.query.format === 'csv') {
      let csv = 'ID,Date,Time,Student USN,Student Name,Semester,Lab Code,Lab Name,Experiment #,Experiment Title,Geofence Status,Distance (m),Status\n';
      records.forEach((r: any) => {
        csv += `"${r.id}","${r.session_date}","${r.timestamp}","${r.usn}","${r.student_name}","${r.semester}","${r.lab_code}","${r.lab_name}","${r.experiment_number}","${r.experiment_title.replace(/"/g, '""')}","${r.geofence_status}","${r.distance_to_lab}","${r.verification_status}"\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="gndec_attendance_report.csv"');
      return res.send(csv);
    }

    return res.json({ success: true, records, count: records.length });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to generate attendance report.' });
  }
});

// GET /api/reports/verification - Verification Report (Semester & Lab wise)
router.get('/verification', authenticateJWT, requireRoles('ADMIN', 'HOD', 'FACULTY'), (req, res) => {
  const { lab_id, semester, status } = req.query;

  try {
    let query = `
      SELECT f.id, f.submitted_at, f.verification_status, f.flags, f.distance_to_lab,
             f.teaching_basics, f.hands_on, f.doubt_support, f.reason_understanding,
             f.viva_taken, f.hardware_setup, f.teacher_guidance, f.lab_punctuality,
             f.overall_rating, f.anonymous_to_teacher, f.viva, f.understanding, f.comments,
             s.usn, s.semester, s.department, u.name as student_name,
             l.code as lab_code, l.name as lab_name,
             e.experiment_number, e.title as experiment_title,
             fac_u.name as faculty_name,
             a.id as attendance_id, a.timestamp as attendance_time, a.geofence_status as attendance_geo
      FROM feedback f
      JOIN students s ON f.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN lab_sessions ls ON f.lab_session_id = ls.id
      JOIN laboratories l ON ls.laboratory_id = l.id
      JOIN experiments e ON f.experiment_id = e.id
      LEFT JOIN faculty fac ON ls.faculty_id = fac.id
      LEFT JOIN users fac_u ON fac.user_id = fac_u.id
      LEFT JOIN attendance a ON (a.student_id = f.student_id AND a.lab_session_id = f.lab_session_id)
      WHERE 1=1
    `;
    const params: any[] = [];

    if (semester && semester !== 'ALL') {
      query += ` AND s.semester = ?`;
      params.push(parseInt(semester as string, 10));
    }
    if (lab_id && lab_id !== 'ALL') {
      query += ` AND l.id = ?`;
      params.push(lab_id);
    }
    if (status && status !== 'ALL') {
      query += ` AND f.verification_status = ?`;
      params.push(status);
    }

    query += ` ORDER BY f.submitted_at DESC`;

    const records = db.prepare(query).all(...params);

    if (req.query.format === 'csv') {
      let csv = 'Feedback ID,Submitted At,Student USN,Student Name,Semester,Lab,Faculty,Exp #,Rating,Basics Taught,Hands-On Done,Doubt Support,Reason Understood,Viva Taken,Hardware Setup,Teacher Guidance,Lab Punctuality,Attendance Exists,Geofence Dist (m),Verification Status,Flags,Student Comments\n';
      records.forEach((r: any) => {
        csv += `"${r.id}","${r.submitted_at}","${r.usn}","${r.student_name}","${r.semester}","${r.lab_code}","${r.faculty_name || 'N/A'}","${r.experiment_number}","${r.overall_rating || 5}","${r.teaching_basics || ''}","${r.hands_on || ''}","${r.doubt_support || ''}","${r.reason_understanding || r.understanding || ''}","${r.viva_taken || r.viva || ''}","${r.hardware_setup || ''}","${r.teacher_guidance || ''}","${r.lab_punctuality || ''}","${r.attendance_id ? 'YES' : 'NO'}","${r.distance_to_lab}","${r.verification_status}","${(r.flags || '').replace(/"/g, '""')}","${(r.comments || '').replace(/"/g, '""')}"\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="gndec_verification_report.csv"');
      return res.send(csv);
    }

    return res.json({ success: true, records, count: records.length });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to generate verification report.' });
  }
});

// GET /api/reports/experiments - Experiment completion rate across labs
router.get('/experiments', authenticateJWT, requireRoles('ADMIN', 'HOD', 'FACULTY'), (_req, res) => {
  try {
    const records = db.prepare(`
      SELECT l.id as lab_id, l.name as lab_name, l.code as lab_code,
             e.id as experiment_id, e.experiment_number, e.title as experiment_title,
             COUNT(DISTINCT a.student_id) as students_completed,
             COUNT(DISTINCT f.id) as feedbacks_submitted
      FROM experiments e
      JOIN laboratories l ON e.laboratory_id = l.id
      LEFT JOIN attendance a ON a.experiment_id = e.id AND a.verification_status = 'PRESENT'
      LEFT JOIN feedback f ON f.experiment_id = e.id
      GROUP BY e.id
      ORDER BY l.id ASC, e.experiment_number ASC
    `).all();

    return res.json({ success: true, records });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to generate experiment report.' });
  }
});

export default router;
