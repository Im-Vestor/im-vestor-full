import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'fallback-secret-for-dev';

export interface EmailVerificationPayload {
  userId: string;
  email: string;
}

export function generateEmailVerificationToken(userId: string, email: string): string {
  const payload: EmailVerificationPayload = {
    userId,
    email,
  };

  // Token expires in 24 hours
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyEmailVerificationToken(token: string): EmailVerificationPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as EmailVerificationPayload;
    return payload;
  } catch (error) {
    console.error('Email verification token validation failed:', error);
    return null;
  }
}

export function generateVerificationLink(token: string): string {
  const baseUrl = process.env.VERCEL_URL ?? 'http://localhost:3000';
  return `${baseUrl}/api/verify-email?token=${token}`;
}
