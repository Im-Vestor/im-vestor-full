import { clerkClient } from '@clerk/nextjs/server';
import { ProjectStatus, UserStatus } from '@prisma/client';
import { createHash, timingSafeEqual } from 'crypto';
import { type NextApiRequest, type NextApiResponse } from 'next';
import { db } from '~/server/db';

const SECRET_KEY = process.env.ACCOUNT_DELETION_SECRET ?? 'default-secret-key';

function verifyDeletionToken(token: string): { valid: boolean; userId?: string } {
  try {
    // Decode the token (base64)
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId, timestamp, signature] = decoded.split('.');

    if (!userId || !timestamp || !signature) {
      return { valid: false };
    }

    // Check if token is expired (24 hours)
    const tokenTime = parseInt(timestamp);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (now - tokenTime > twentyFourHours) {
      return { valid: false };
    }

    // Verify signature
    const expectedSignature = createHash('sha256')
      .update(`${userId}.${timestamp}.${SECRET_KEY}`)
      .digest('hex');

    const providedSignature = Buffer.from(signature, 'hex');
    const expectedSignatureBuffer = Buffer.from(expectedSignature, 'hex');

    if (!timingSafeEqual(providedSignature, expectedSignatureBuffer)) {
      return { valid: false };
    }

    return { valid: true, userId };
  } catch (error) {
    console.error('Error verifying deletion token:', error);
    return { valid: false };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const { valid, userId } = verifyDeletionToken(token);

  if (!valid || !userId) {
    return res.status(400).json({ error: 'Invalid or expired deletion token' });
  }

  try {
    // Find the user
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        entrepreneur: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.status === UserStatus.INACTIVE) {
      return res.status(400).json({ error: 'Account already deleted' });
    }

    // Mark user as inactive and anonymize email to free it for reuse
    const anonymizedEmail = `deleted-${userId}-${Date.now()}@deleted.local`;
    await db.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.INACTIVE,
        email: anonymizedEmail,
      },
    });

    // If entrepreneur, set all projects to inactive
    if (user.userType === 'ENTREPRENEUR') {
      await db.project.updateMany({
        where: { entrepreneurId: user.entrepreneur?.id },
        data: { status: ProjectStatus.INACTIVE },
      });
    }

    // Update Clerk metadata
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        inactive: true,
      },
    });

    // Redirect to a success page or login page
    return res.redirect(302, '/login?deleted=true');
  } catch (error) {
    console.error('Error deleting user account:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
