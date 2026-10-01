import crypto from 'node:crypto';
import QRCode from 'qrcode';
import { CONFIG } from '../config/constants.js';
import { db } from '../models/db.js';

export interface QRTokenPayload {
  sessionId: number;
  sessionCode: string;
  experimentId: number;
  section?: string;
  issuedAt: number;
  expiresAt: number;
  nonce: string;
}

export interface DynamicQRResult {
  token: string;
  tokenHash: string;
  qrDataUrl: string;
  issuedAt: string;
  expiresAt: string;
  expiresInSeconds: number;
  sessionCode: string;
}

/**
 * Generate a dynamic, cryptographically signed short-lived QR token
 */
export async function generateDynamicQR(
  sessionId: number,
  sessionCode: string,
  experimentId: number,
  durationSeconds: number = CONFIG.DEFAULT_QR_EXPIRATION_SECONDS
): Promise<DynamicQRResult> {
  const now = Date.now();
  const expiresAtMs = now + durationSeconds * 1000;
  const nonce = crypto.randomBytes(8).toString('hex');

  const payload: QRTokenPayload = {
    sessionId,
    sessionCode,
    experimentId,
    issuedAt: now,
    expiresAt: expiresAtMs,
    nonce
  };

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', CONFIG.QR_TOKEN_SECRET)
    .update(payloadStr)
    .digest('base64url');

  const fullToken = `${payloadStr}.${signature}`;
  const tokenHash = crypto.createHash('sha256').update(fullToken).digest('hex');

  // Deactivate prior active QR sessions for this lab session
  db.prepare(`
    UPDATE qr_sessions 
    SET status = 'EXPIRED' 
    WHERE lab_session_id = ? AND status = 'ACTIVE'
  `).run(sessionId);

  // Store in database
  db.prepare(`
    INSERT INTO qr_sessions (lab_session_id, token_hash, plain_token, expires_at, status)
    VALUES (?, ?, ?, ?, 'ACTIVE')
  `).run(
    sessionId,
    tokenHash,
    fullToken,
    new Date(expiresAtMs).toISOString()
  );

  // Generate QR code DataURL
  const qrPayload = JSON.stringify({
    app: 'LabGuard',
    sessionCode,
    token: fullToken,
    exp: expiresAtMs
  });

  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    color: {
      dark: '#1E293B',
      light: '#FFFFFF'
    },
    width: 320
  });

  return {
    token: fullToken,
    tokenHash,
    qrDataUrl,
    issuedAt: new Date(now).toISOString(),
    expiresAt: new Date(expiresAtMs).toISOString(),
    expiresInSeconds: durationSeconds,
    sessionCode
  };
}

export interface QRValidationResult {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
  payload?: QRTokenPayload;
}

/**
 * Validate dynamic QR token integrity, signature, and expiration
 */
export function validateQRToken(token: string): QRValidationResult {
  if (!token || typeof token !== 'string') {
    return { isValid: false, errorCode: 'INVALID_TOKEN_FORMAT', errorMessage: 'Invalid token format provided.' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { isValid: false, errorCode: 'MALFORMED_TOKEN', errorMessage: 'Malformed token structure.' };
  }

  const [payloadStr, signature] = parts;

  // Verify HMAC signature
  const expectedSignature = crypto
    .createHmac('sha256', CONFIG.QR_TOKEN_SECRET)
    .update(payloadStr)
    .digest('base64url');

  if (signature !== expectedSignature) {
    return { isValid: false, errorCode: 'INVALID_SIGNATURE', errorMessage: 'Token cryptographic signature verification failed.' };
  }

  try {
    const payload: QRTokenPayload = JSON.parse(
      Buffer.from(payloadStr, 'base64url').toString('utf8')
    );

    const now = Date.now();
    if (now > payload.expiresAt) {
      return {
        isValid: false,
        errorCode: 'EXPIRED_QR',
        errorMessage: 'This QR code has expired. Please ask faculty to display the new dynamic QR code.',
        payload
      };
    }

    return { isValid: true, payload };
  } catch (err) {
    return { isValid: false, errorCode: 'PARSE_ERROR', errorMessage: 'Failed to decode token payload.' };
  }
}
