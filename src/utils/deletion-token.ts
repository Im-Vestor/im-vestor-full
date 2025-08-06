import { createHash } from 'crypto';

const SECRET_KEY = process.env.ACCOUNT_DELETION_SECRET ?? 'default-secret-key';

export function generateDeletionToken(userId: string): string {
  const timestamp = Date.now().toString();
  const signature = createHash('sha256')
    .update(`${userId}.${timestamp}.${SECRET_KEY}`)
    .digest('hex');

  // Combine userId, timestamp, and signature
  const tokenData = `${userId}.${timestamp}.${signature}`;

  // Encode as base64
  return Buffer.from(tokenData).toString('base64');
}

export function createDeletionLink(userId: string, baseUrl: string): string {
  const token = generateDeletionToken(userId);
  return `${baseUrl}/api/delete-account/${token}`;
}
