import { clerkClient } from '@clerk/nextjs/server';
import { type NextApiRequest, type NextApiResponse } from 'next';
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

    // Check if user exists and update email
    await db.user.update({
      where: {
        id: payload.userId,
      },
      data: {
        email: payload.email,
      },
    });

    // Update email in Clerk
    const client = await clerkClient();

    const userInClerk = await client.users.getUser(payload.userId);

    if (userInClerk.emailAddresses.find(email => email.emailAddress === payload.email)) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const oldEmailAddress = userInClerk.emailAddresses[0];

    await client.emailAddresses.createEmailAddress({
      emailAddress: payload.email,
      userId: userInClerk.id,
      primary: true,
      verified: true,
    });

    await client.emailAddresses.deleteEmailAddress(oldEmailAddress?.id ?? '');

    // Redirect to login page with success message
    return res.redirect('/profile');
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
