import { type NextApiRequest, type NextApiResponse } from 'next';
import { UserStatus } from '@prisma/client';
import { db } from '~/server/db';
import { verifyEmailVerificationToken } from '~/utils/email-verification';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ message: 'Invalid verification token' });
  }

  try {
    // Verify the token
    const payload = verifyEmailVerificationToken(token);

    if (!payload) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    // Check if user exists and is pending verification
    const user = await db.user.findUnique({
      where: {
        id: payload.userId,
        email: payload.email,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status === UserStatus.ACTIVE) {
      // User is already verified, redirect to login
      return res.redirect('/login?message=already-verified');
    }

    if (user.status !== UserStatus.PENDING_EMAIL_VERIFICATION) {
      return res.status(400).json({ message: 'User account is not pending verification' });
    }

    // Update user status to ACTIVE
    await db.user.update({
      where: { id: payload.userId },
      data: { status: UserStatus.ACTIVE },
    });

    // Redirect to login page with success message
    return res.redirect('/login?message=email-verified');
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
