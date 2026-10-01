import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config/constants.js';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'HOD' | 'FACULTY' | 'STUDENT';
  studentId?: number;
  facultyId?: number;
  usn?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authorization header missing or invalid format.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, error: 'Session token has expired or is invalid.' });
  }
}

export function requireRoles(...allowedRoles: Array<'ADMIN' | 'HOD' | 'FACULTY' | 'STUDENT'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Role '${req.user.role}' is not authorized for this resource.`
      });
    }

    next();
  };
}
