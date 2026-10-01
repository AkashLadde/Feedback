import { db } from '../models/db.js';

export function logAudit(
  userId: number | null,
  userEmail: string | null,
  userRole: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  details: string | null,
  ipAddress: string | null = '127.0.0.1'
) {
  try {
    db.prepare(`
      INSERT INTO audit_logs (
        user_id, user_email, user_role, action, entity_type, entity_id, details, ip_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      userEmail,
      userRole,
      action,
      entityType,
      entityId,
      details,
      ipAddress
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
