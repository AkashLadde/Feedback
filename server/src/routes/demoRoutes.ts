import { Router } from 'express';
import { db } from '../models/db.js';
import { generateDynamicQR } from '../services/qrService.js';
import { verifyFeedbackSubmission } from '../services/verificationEngine.js';
import { seedDatabase, cleanDatabase } from '../seed/seed.js';

const router = Router();

function cleanPreviousStudentSubmission(studentId: number, sessionId: number) {
  db.prepare(`
    DELETE FROM verification_events WHERE feedback_id IN (
      SELECT id FROM feedback WHERE student_id = ? AND lab_session_id = ?
    )
  `).run(studentId, sessionId);

  db.prepare(`
    DELETE FROM alerts WHERE student_id = ? AND lab_session_id = ?
  `).run(studentId, sessionId);

  db.prepare(`
    DELETE FROM feedback WHERE student_id = ? AND lab_session_id = ?
  `).run(studentId, sessionId);
}

// POST /api/demo/run-scenario
router.post('/run-scenario', async (req, res) => {
  const { scenario } = req.body;

  try {
    // Find active VAPT Lab session
    let session = db.prepare(`
      SELECT ls.*, l.name as lab_name, l.latitude as lab_lat, l.longitude as lab_lng, l.geofence_radius,
             e.experiment_number, e.title as experiment_title
      FROM lab_sessions ls
      JOIN laboratories l ON ls.laboratory_id = l.id
      JOIN experiments e ON ls.experiment_id = e.id
      WHERE l.code = 'CYB-701' AND ls.status = 'ACTIVE'
      LIMIT 1
    `).get() as any;

    if (!session) {
      session = db.prepare(`
        SELECT ls.*, l.name as lab_name, l.latitude as lab_lat, l.longitude as lab_lng, l.geofence_radius,
               e.experiment_number, e.title as experiment_title
        FROM lab_sessions ls
        JOIN laboratories l ON ls.laboratory_id = l.id
        JOIN experiments e ON ls.experiment_id = e.id
        WHERE l.code = 'CYB-701'
        ORDER BY ls.id DESC LIMIT 1
      `).get() as any;
    }

    if (!session) {
      return res.status(404).json({ success: false, error: 'Demo session not found. Please re-seed demo data.' });
    }

    // Generate fresh dynamic QR
    const qrResult = await generateDynamicQR(session.id, session.session_code, session.experiment_id, 60);

    // Scenario 1: Student A (Rahul Verma) - Legitimate Attendee
    if (scenario === 'SCENARIO_A') {
      const studentA = db.prepare(`SELECT * FROM users WHERE email = 'rahul.verma@student.edu'`).get() as any;
      const studentAProfile = db.prepare(`SELECT * FROM students WHERE user_id = ?`).get(studentA.id) as any;

      // Ensure attendance exists
      db.prepare(`
        INSERT OR REPLACE INTO attendance (
          student_id, lab_session_id, experiment_id,
          latitude, longitude, accuracy, distance_to_lab,
          geofence_status, verification_status, timestamp
        ) VALUES (?, ?, ?, ?, ?, 8.5, 12.0, 'INSIDE', 'PRESENT', datetime('now', '-30 minutes'))
      `).run(studentAProfile.id, session.id, session.experiment_id, session.lab_lat + 0.00005, session.lab_lng + 0.00005);

      // Clean existing feedback & foreign keys
      cleanPreviousStudentSubmission(studentAProfile.id, session.id);

      const result = verifyFeedbackSubmission({
        studentUserId: studentA.id,
        qrToken: qrResult.token,
        latitude: session.lab_lat + 0.00008,
        longitude: session.lab_lng + 0.00008,
        accuracy: 10.0,
        teachingBasics: 'Excellent',
        handsOn: 'Yes',
        viva: 'Yes',
        understanding: 'Completely understood',
        comments: 'Lab concepts clearly demonstrated with Burp Suite and Metasploit.'
      });

      return res.json({
        success: true,
        scenario: 'Scenario A: Genuine In-Lab Feedback',
        student: 'Rahul Verma (1RV23CY001)',
        result,
        expectedOutcome: 'VERIFIED'
      });
    }

    // Scenario 2: Student B (Pooja Kulkarni) - Scammer! Gets QR from friend, but has NO attendance
    if (scenario === 'SCENARIO_B') {
      const studentB = db.prepare(`SELECT * FROM users WHERE email = 'pooja.kulkarni@student.edu'`).get() as any;
      const studentBProfile = db.prepare(`SELECT * FROM students WHERE user_id = ?`).get(studentB.id) as any;

      // Explicitly DELETE attendance to simulate missed class
      db.prepare(`DELETE FROM attendance WHERE student_id = ? AND lab_session_id = ?`).run(studentBProfile.id, session.id);
      cleanPreviousStudentSubmission(studentBProfile.id, session.id);

      const result = verifyFeedbackSubmission({
        studentUserId: studentB.id,
        qrToken: qrResult.token,
        latitude: session.lab_lat + 0.0001,
        longitude: session.lab_lng + 0.0001,
        accuracy: 12.0,
        teachingBasics: 'Good',
        handsOn: 'Partially',
        viva: 'No',
        understanding: 'Mostly understood',
        comments: 'Submitted remotely via QR link forwarded by classmate.'
      });

      return res.json({
        success: true,
        scenario: 'Scenario B: Remote Proxy Feedback (Missing Attendance)',
        student: 'Pooja Kulkarni (1RV23CY002)',
        result,
        expectedOutcome: 'SUSPICIOUS / ATTENDANCE_MISSING (Alert created)'
      });
    }

    // Scenario 3: Student C (Amit Shah) - Expired QR Code
    if (scenario === 'SCENARIO_C') {
      const studentC = db.prepare(`SELECT * FROM users WHERE email = 'amit.shah@student.edu'`).get() as any;
      const studentCProfile = db.prepare(`SELECT * FROM students WHERE user_id = ?`).get(studentC.id) as any;

      // Mark attendance
      db.prepare(`
        INSERT OR REPLACE INTO attendance (
          student_id, lab_session_id, experiment_id,
          latitude, longitude, accuracy, distance_to_lab,
          geofence_status, verification_status, timestamp
        ) VALUES (?, ?, ?, ?, ?, 10.0, 15.0, 'INSIDE', 'PRESENT', datetime('now', '-40 minutes'))
      `).run(studentCProfile.id, session.id, session.experiment_id, session.lab_lat, session.lab_lng);

      cleanPreviousStudentSubmission(studentCProfile.id, session.id);

      // Create an expired QR token (expired 2 hours ago)
      const expiredPayload = {
        sessionId: session.id,
        sessionCode: session.session_code,
        experimentId: session.experiment_id,
        section: session.section,
        issuedAt: Date.now() - 7200000,
        expiresAt: Date.now() - 7140000, // Expired 2 hours ago
        nonce: 'expired_demo_nonce'
      };
      const crypto = await import('node:crypto');
      const payloadStr = Buffer.from(JSON.stringify(expiredPayload)).toString('base64url');
      const signature = crypto.default
        .createHmac('sha256', process.env.QR_TOKEN_SECRET || 'labguard_hmac_dynamic_qr_secret_key_9981')
        .update(payloadStr)
        .digest('base64url');
      const expiredToken = `${payloadStr}.${signature}`;

      const result = verifyFeedbackSubmission({
        studentUserId: studentC.id,
        qrToken: expiredToken,
        latitude: session.lab_lat,
        longitude: session.lab_lng,
        accuracy: 10.0,
        teachingBasics: 'Average',
        handsOn: 'Yes',
        viva: 'Yes',
        understanding: 'Partially understood',
        comments: 'Tried submitting with yesterday/stale QR screenshot.'
      });

      return res.json({
        success: true,
        scenario: 'Scenario C: Expired Dynamic QR Code',
        student: 'Amit Shah (1RV23CY003)',
        result,
        expectedOutcome: 'INVALID - EXPIRED_QR'
      });
    }

    // Scenario 4: Student D (Sneha Reddy) - Outside Geofence (e.g. 450m away in cafeteria)
    if (scenario === 'SCENARIO_D') {
      const studentD = db.prepare(`SELECT * FROM users WHERE email = 'sneha.reddy@student.edu'`).get() as any;
      const studentDProfile = db.prepare(`SELECT * FROM students WHERE user_id = ?`).get(studentD.id) as any;

      // Mark attendance earlier
      db.prepare(`
        INSERT OR REPLACE INTO attendance (
          student_id, lab_session_id, experiment_id,
          latitude, longitude, accuracy, distance_to_lab,
          geofence_status, verification_status, timestamp
        ) VALUES (?, ?, ?, ?, ?, 8.0, 10.0, 'INSIDE', 'PRESENT', datetime('now', '-50 minutes'))
      `).run(studentDProfile.id, session.id, session.experiment_id, session.lab_lat, session.lab_lng);

      cleanPreviousStudentSubmission(studentDProfile.id, session.id);

      // Coordinates ~450m away from lab
      const outsideLat = session.lab_lat + 0.0040;
      const outsideLng = session.lab_lng + 0.0035;

      const result = verifyFeedbackSubmission({
        studentUserId: studentD.id,
        qrToken: qrResult.token,
        latitude: outsideLat,
        longitude: outsideLng,
        accuracy: 15.0,
        teachingBasics: 'Good',
        handsOn: 'Yes',
        viva: 'No',
        understanding: 'Mostly understood',
        comments: 'Attempting submission while walking towards campus canteen.'
      });

      return res.json({
        success: true,
        scenario: 'Scenario D: Outside Geofence Perimeter',
        student: 'Sneha Reddy (1RV23CY004)',
        result,
        expectedOutcome: 'INVALID - OUTSIDE_GEOFENCE'
      });
    }

    return res.status(400).json({ success: false, error: 'Unknown scenario. Choose SCENARIO_A, SCENARIO_B, SCENARIO_C, or SCENARIO_D.' });
  } catch (err: any) {
    console.error('Run scenario error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to run scenario.' });
  }
});

// POST /api/demo/reset-db
router.post('/reset-db', async (_req, res) => {
  try {
    seedDatabase();
    return res.json({ success: true, message: 'Database successfully re-seeded with realistic demo data.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to reset demo data.' });
  }
});

// POST /api/demo/clean-db - Clear all fake data and leave clean system
router.post('/clean-db', async (_req, res) => {
  try {
    cleanDatabase();
    return res.json({ success: true, message: 'All demo and fake data cleared. Semesters 1-8 and Admin ready.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to clean database.' });
  }
});

export default router;
