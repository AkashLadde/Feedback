import { Router } from 'express';
import { db } from '../models/db.js';

const router = Router();

// GET /api/timetable - get all timetable entries grouped by semester
router.get('/', (_req, res) => {
  try {
    const entries = db.prepare(`
      SELECT t.*, f.employee_id as faculty_emp_id, f.designation as faculty_designation
      FROM timetable_entries t
      LEFT JOIN faculty f ON (f.employee_id LIKE '%' || t.faculty_abbr || '%' OR lower(t.faculty_name) LIKE '%' || lower(t.faculty_name) || '%')
      ORDER BY t.semester ASC, t.day_of_week ASC, t.slot_index ASC
    `).all();

    // Group by semester
    const grouped: Record<number, any[]> = { 3: [], 5: [], 7: [] };
    for (const entry of entries) {
      if (!grouped[(entry as any).semester]) {
        grouped[(entry as any).semester] = [];
      }
      grouped[(entry as any).semester].push(entry);
    }

    return res.json({ success: true, timetables: grouped, allEntries: entries });
  } catch (err: any) {
    console.error('Error fetching timetable:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch timetable data.' });
  }
});

// GET /api/timetable/:semester - get timetable for specific semester (3, 5, or 7)
router.get('/:semester', (req, res) => {
  try {
    const sem = parseInt(req.params.semester, 10);
    const entries = db.prepare(`
      SELECT * FROM timetable_entries
      WHERE semester = ?
      ORDER BY 
        CASE day_of_week
          WHEN 'MONDAY' THEN 1
          WHEN 'TUESDAY' THEN 2
          WHEN 'WEDNESDAY' THEN 3
          WHEN 'THURSDAY' THEN 4
          WHEN 'FRIDAY' THEN 5
          WHEN 'SATURDAY' THEN 6
          ELSE 7
        END,
        slot_index ASC
    `).all(sem);

    return res.json({ success: true, semester: sem, entries });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch semester timetable.' });
  }
});

export default router;
