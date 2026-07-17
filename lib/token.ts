import crypto from 'crypto';

const SECRET = process.env.PAYSTACK_SECRET_KEY || 'default-secret-key-32-chars-long-minimum-lyricsnap';

/**
 * Creates a cryptographically signed token for the given email and payment reference.
 */
export function signToken(email: string, reference: string): string {
  const payload = JSON.stringify({ email, reference, timestamp: Date.now() });
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(payload);
  const signature = hmac.digest('hex');
  return Buffer.from(JSON.stringify({ payload, signature })).toString('base64');
}

/**
 * Verifies a token's HMAC signature. Returns the decoded payload if valid, otherwise null.
 */
export function verifyToken(token: string): { email: string; reference: string; timestamp: number } | null {
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const { payload, signature } = JSON.parse(decoded);
    const hmac = crypto.createHmac('sha256', SECRET);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');
    if (signature === expectedSignature) {
      return JSON.parse(payload);
    }
  } catch (e) {
    // Return null on parsing or signature verification failure
  }
  return null;
}
