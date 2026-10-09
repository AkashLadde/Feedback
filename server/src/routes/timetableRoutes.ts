import { Router } from 'express';
import { db } from '../models/db.js';

const router = Router();

// GET /api/timetable - get all timetable entries grouped by semester
router.get('/', (_req, res) => {
  try {
    const entries = db.prepare(`
      SELECT 
        t.*, 
        f.employee_id as faculty_emp_id, 
        f.designation as faculty_designation, 
        l.location, 
        l.id as laboratory_id
      FROM timetable_entries t
      LEFT JOIN laboratories l ON (l.code = t.subject_code)
      LEFT JOIN faculty f ON (f.employee_id = 'GNDEC-FAC-' || t.faculty_abbr)
      GROUP BY t.id
      ORDER BY 
        t.semester ASC, 
        CASE upper(t.day_of_week)
          WHEN 'MONDAY' THEN 1
          WHEN 'TUESDAY' THEN 2
          WHEN 'WEDNESDAY' THEN 3
          WHEN 'THURSDAY' THEN 4
          WHEN 'FRIDAY' THEN 5
          WHEN 'SATURDAY' THEN 6
          ELSE 7
        END,
        t.slot_index ASC
    `).all();

    // Group by semester
    const grouped: Record<number, any[]> = { 3: [], 5: [], 7: [] };
    for (const entry of entries) {
      const sem = (entry as any).semester;
      if (!grouped[sem]) {
        grouped[sem] = [];
      }
      grouped[sem].push(entry);
    }

    return res.json({ success: true, timetables: grouped, allEntries: entries });
  } catch (err: any) {
    console.error('Error fetching timetable:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch timetable data.' });
  }
});

// GET /api/timetable/:semester - get timetable for specific semester with optional ?day=MONDAY
router.get('/:semester', (req, res) => {
  try {
    const sem = parseInt(req.params.semester, 10);
    const day = req.query.day ? String(req.query.day).toUpperCase() : null;

    let sql = `
      SELECT 
        t.*, 
        l.location, 
        l.id as laboratory_id,
        f.employee_id as faculty_emp_id,
        f.designation as faculty_designation
      FROM timetable_entries t
      LEFT JOIN laboratories l ON (l.code = t.subject_code)
      LEFT JOIN faculty f ON (f.employee_id = 'GNDEC-FAC-' || t.faculty_abbr)
      WHERE t.semester = ?
    `;
    const params: any[] = [sem];

    if (day) {
      sql += ` AND upper(t.day_of_week) = ?`;
      params.push(day);
    }

    sql += `
      GROUP BY t.id
      ORDER BY 
        CASE upper(t.day_of_week)
          WHEN 'MONDAY' THEN 1
          WHEN 'TUESDAY' THEN 2
          WHEN 'WEDNESDAY' THEN 3
          WHEN 'THURSDAY' THEN 4
          WHEN 'FRIDAY' THEN 5
          WHEN 'SATURDAY' THEN 6
          ELSE 7
        END,
        t.slot_index ASC
    `;

    const entries = db.prepare(sql).all(...params);

    return res.json({ success: true, semester: sem, day: day || 'ALL', entries });
  } catch (err: any) {
    console.error('Error fetching semester timetable:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch semester timetable.' });
  }
});

export default router;
