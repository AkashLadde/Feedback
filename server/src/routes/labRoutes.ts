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
router.post('/', authenticateJWT, requireRoles('ADMIN', 'HOD'), (req: AuthenticatedRequest, res) => {
  const { name, code, semester, academic_year, faculty_id, room_number, location, latitude, longitude, geofence_radius } = req.body;

  if (!name || !code || !room_number || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ success: false, error: 'All core laboratory fields are required.' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO laboratories (
        name, code, semester, section, academic_year, faculty_id, room_number, location, latitude, longitude, geofence_radius, status
      ) VALUES (?, ?, ?, '', ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
    `).run(
      name,
      code.toUpperCase(),
      semester || 7,
      academic_year || '2026-2027',
      faculty_id || null,
      room_number,
      location || `${room_number} - CSE & IoT Academic Complex`,
      latitude,
      longitude,
      geofence_radius || 25.0
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

    logAudit(req.user!.id, req.user!.email, req.user!.role, 'CREATE_LAB', 'LABORATORY', String(labId), `Created lab ${name} (${code}) at location ${location || room_number}`);

    return res.status(201).json({ success: true, labId, message: 'Laboratory created with 10 experiments.' });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ success: false, error: 'A laboratory with this code already exists.' });
    }
    return res.status(500).json({ success: false, error: 'Failed to create laboratory.' });
  }
});

// POST /api/labs/calibrate-all - Batch calibrate all labs (or semester labs) to live GPS coordinates
router.post('/calibrate-all', authenticateJWT, requireRoles('ADMIN', 'HOD', 'FACULTY'), (req: AuthenticatedRequest, res) => {
  const { latitude, longitude, geofence_radius, semester, apply_uniform } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ success: false, error: 'Latitude and Longitude are required for geofence calibration.' });
  }

  try {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radius = geofence_radius !== undefined ? parseFloat(geofence_radius) : null;

    let labsToUpdate: { id: number; name: string }[];
    if (semester && semester !== 'ALL') {
      labsToUpdate = db.prepare('SELECT id, name FROM laboratories WHERE semester = ?').all(parseInt(semester as string, 10)) as { id: number; name: string }[];
    } else {
      labsToUpdate = db.prepare('SELECT id, name FROM laboratories').all() as { id: number; name: string }[];
    }

    if (labsToUpdate.length === 0) {
      return res.status(404).json({ success: false, error: 'No laboratories found to calibrate.' });
    }

    const updateStmt = db.prepare(`
      UPDATE laboratories
      SET latitude = ?,
          longitude = ?,
          geofence_radius = COALESCE(?, geofence_radius)
      WHERE id = ?
    `);

    labsToUpdate.forEach((lab, idx) => {
      // If apply_uniform is true or single lab, use exact coords. Otherwise use subtle 2m micro-offset per room
      const offsetLat = apply_uniform ? lat : lat + (idx % 4) * 0.00002;
      const offsetLng = apply_uniform ? lng : lng + (idx % 4) * 0.00002;
      updateStmt.run(offsetLat, offsetLng, radius, lab.id);
    });

    logAudit(
      req.user!.id,
      req.user!.email,
      req.user!.role,
      'CALIBRATE_GEOFENCE',
      'LABORATORIES',
      'ALL',
      `Calibrated ${labsToUpdate.length} laboratories to live GPS (${lat.toFixed(6)}, ${lng.toFixed(6)}) with radius ${radius || 'preserved'}m`
    );

    return res.json({
      success: true,
      updatedCount: labsToUpdate.length,
      latitude: lat,
      longitude: lng,
      message: `Successfully calibrated ${labsToUpdate.length} laboratories to your live GPS coordinates!`
    });
  } catch (err: any) {
    console.error('Error calibrating geofence:', err);
    return res.status(500).json({ success: false, error: 'Failed to calibrate laboratories geofence: ' + err.message });
  }
});

// PUT /api/labs/:id - Admin update lab details & geofence
router.put('/:id', authenticateJWT, requireRoles('ADMIN', 'HOD'), (req: AuthenticatedRequest, res) => {
  const { name, room_number, location, latitude, longitude, geofence_radius, status, faculty_id, semester } = req.body;

  try {
    db.prepare(`
      UPDATE laboratories
      SET name = COALESCE(?, name),
          room_number = COALESCE(?, room_number),
          location = COALESCE(?, location),
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
      location || null,
      latitude !== undefined ? latitude : null,
      longitude !== undefined ? longitude : null,
      geofence_radius !== undefined ? geofence_radius : null,
      status || null,
      faculty_id || null,
      semester !== undefined ? parseInt(semester, 10) : null,
      req.params.id
    );

    logAudit(req.user!.id, req.user!.email, req.user!.role, 'UPDATE_LAB', 'LABORATORY', req.params.id, 'Updated lab configuration / geofence / location');

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

// POST /api/labs/:id/set-location - Update lab GPS coordinates & physical location from inside the lab
router.post('/:id/set-location', authenticateJWT, (req: AuthenticatedRequest, res) => {
  const { latitude, longitude, geofence_radius, location, room_number } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ success: false, error: 'Latitude and Longitude are required to set laboratory location.' });
  }

  try {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radius = geofence_radius !== undefined ? parseFloat(geofence_radius) : 25.0;

    const lab = db.prepare('SELECT * FROM laboratories WHERE id = ?').get(req.params.id) as any;
    if (!lab) {
      return res.status(404).json({ success: false, error: 'Laboratory not found.' });
    }

    db.prepare(`
      UPDATE laboratories
      SET latitude = ?,
          longitude = ?,
          geofence_radius = ?,
          location = COALESCE(?, location),
          room_number = COALESCE(?, room_number)
      WHERE id = ?
    `).run(lat, lng, radius, location || null, room_number || null, req.params.id);

    // Also update matching timetable entries if location/room provided
    if (location || room_number) {
      db.prepare(`
        UPDATE timetable_entries
        SET room = COALESCE(?, room)
        WHERE subject_code = ?
      `).run(room_number || null, lab.code);
    }

    logAudit(
      req.user!.id,
      req.user!.email,
      req.user!.role,
      'UPDATE_LAB_LOCATION',
      'LABORATORY',
      String(lab.id),
      `Set lab ${lab.name} (${lab.code}) location to (${lat.toFixed(6)}, ${lng.toFixed(6)}) with radius ${radius}m`
    );

    return res.json({
      success: true,
      message: `Laboratory ${lab.name} (${lab.code}) location successfully saved to database!`,
      lab: {
        id: lab.id,
        name: lab.name,
        code: lab.code,
        latitude: lat,
        longitude: lng,
        geofence_radius: radius,
        location: location || lab.location,
        room_number: room_number || lab.room_number
      }
    });
  } catch (err: any) {
    console.error('Error updating lab location:', err);
    return res.status(500).json({ success: false, error: 'Failed to update lab location: ' + err.message });
  }
});

// POST /api/labs/calibrate-current - Universal 1-click GPS calibration for any lab
router.post('/calibrate-current', authenticateJWT, (req: AuthenticatedRequest, res) => {
  const { code, id, semester, latitude, longitude, geofence_radius, location, room_number } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ success: false, error: 'Latitude and Longitude are required for calibration.' });
  }

  try {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radius = geofence_radius !== undefined ? parseFloat(geofence_radius) : 25.0;

    let targetLab: any = null;
    if (id) {
      targetLab = db.prepare('SELECT * FROM laboratories WHERE id = ?').get(id);
    } else if (code) {
      targetLab = db.prepare('SELECT * FROM laboratories WHERE upper(code) = upper(?)').get(code);
    } else if (semester) {
      targetLab = db.prepare('SELECT * FROM laboratories WHERE semester = ? ORDER BY id ASC LIMIT 1').get(parseInt(semester, 10));
    }

    if (targetLab) {
      db.prepare(`
        UPDATE laboratories
        SET latitude = ?,
            longitude = ?,
            geofence_radius = ?,
            location = COALESCE(?, location),
            room_number = COALESCE(?, room_number)
        WHERE id = ?
      `).run(lat, lng, radius, location || null, room_number || null, targetLab.id);

      logAudit(
        req.user!.id,
        req.user!.email,
        req.user!.role,
        'CALIBRATE_LAB_LOCATION',
        'LABORATORY',
        String(targetLab.id),
        `Calibrated lab ${targetLab.name} (${targetLab.code}) to GPS (${lat.toFixed(6)}, ${lng.toFixed(6)})`
      );

      return res.json({
        success: true,
        message: `Laboratory "${targetLab.name}" calibrated to your current GPS position!`,
        lab: {
          id: targetLab.id,
          name: targetLab.name,
          code: targetLab.code,
          latitude: lat,
          longitude: lng,
          geofence_radius: radius
        }
      });
    }

    // Fallback: update all labs in student's semester or all labs
    const targetSem = semester || (req.user as any).semester;
    let updateQuery = 'UPDATE laboratories SET latitude = ?, longitude = ?, geofence_radius = ?';
    const params: any[] = [lat, lng, radius];

    if (targetSem) {
      updateQuery += ' WHERE semester = ?';
      params.push(targetSem);
    }

    db.prepare(updateQuery).run(...params);

    return res.json({
      success: true,
      message: `All laboratories ${targetSem ? `for Semester ${targetSem}` : ''} calibrated to your current GPS coordinates!`,
      latitude: lat,
      longitude: lng,
      geofence_radius: radius
    });
  } catch (err: any) {
    console.error('Error in calibrate-current:', err);
    return res.status(500).json({ success: false, error: 'Calibration failed: ' + err.message });
  }
});

// DELETE /api/labs/:id - delete a laboratory (Admin & HOD)
router.delete('/:id', authenticateJWT, requireRoles('ADMIN', 'HOD'), (req: AuthenticatedRequest, res) => {
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
