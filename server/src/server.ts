// Suppress Node.js ExperimentalWarning for SQLite in terminal logs
const originalEmit = process.emit;
// @ts-ignore
process.emit = function (this: NodeJS.Process, event: any, ...args: any[]): boolean {
  if (event === 'warning' && args[0] && (args[0].name === 'ExperimentalWarning' || String(args[0].message || '').includes('SQLite is an experimental feature'))) {
    return false;
  }
  return (originalEmit as any).apply(this, [event, ...args]);
};

import express from 'express';
import cors from 'cors';
import { CONFIG } from './config/constants.js';
import { initDatabase, db } from './models/db.js';
import { cleanDatabase } from './seed/seed.js';

import authRoutes from './routes/authRoutes.js';
import labRoutes from './routes/labRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import qrRoutes from './routes/qrRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import semesterRoutes from './routes/semesterRoutes.js';
import facultyRoutes from './routes/facultyRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import demoRoutes from './routes/demoRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Initialize Database & check if seeding is needed
initDatabase();
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
if (!userCount || userCount.count === 0) {
  cleanDatabase();
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'HEALTHY',
    system: CONFIG.APP_NAME,
    subtitle: CONFIG.APP_SUBTITLE,
    department: CONFIG.DEPARTMENT_NAME,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/semesters', semesterRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/laboratories', labRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/timetable', timetableRoutes);

// Serve compiled React frontend if client/dist exists
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const possiblePaths = [
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../../../client/dist'),
  path.resolve(__dirname, '../client/dist')
];
const finalDist = possiblePaths.find(p => fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))) || null;

if (finalDist) {
  app.use(express.static(finalDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(finalDist, 'index.html'));
  });
  console.log(`📦 Serving compiled client from: ${finalDist}`);
} else {
  console.log(`⚠️ Client dist not found in paths:`, possiblePaths);
}

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error occurred. Please contact the system administrator.'
  });
});

const PORT = Number(process.env.PORT) || CONFIG.PORT || 5000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`
========================================================================
🛡️  ${CONFIG.APP_NAME} - ${CONFIG.APP_SUBTITLE}
🏛️  ${CONFIG.DEPARTMENT_NAME}
🚀  Backend API server listening on http://${HOST}:${PORT}
🔗  Health endpoint: http://${HOST}:${PORT}/api/health
========================================================================
  `);
});
