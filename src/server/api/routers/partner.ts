import { clerkClient } from '@clerk/nextjs/server';
import { UserType } from '@prisma/client';
import { z } from 'zod';

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc';
import { sendEmail } from '~/utils/email';
import { createReferralLink, generateCode } from '~/utils/referral';

export const partnerRouter = createTRPCRouter({
  getByUserId: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.partner.findUnique({
      where: { userId: ctx.auth.userId },
    });
  }),

  getByUserIdForAdmin: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const isOwnProfile = ctx.auth.userId === input.userId;

      if (!isOwnProfile) {
        // Check if current user is admin using Clerk metadata
        const clerk = await clerkClient();
        const currentUser = await clerk.users.getUser(ctx.auth.userId);
        const userMetadata = currentUser.publicMetadata as {
          userIsAdmin?: boolean;
        };

        if (!userMetadata?.userIsAdmin) {
          throw new Error('Unauthorized: Only admins can view other users profiles');
        }
      }

      return ctx.db.partner.findUnique({
        where: { userId: input.userId },
      });
    }),

  create: publicProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        mobileFone: z.string().min(1),
        companyName: z.string().min(1),
        referralToken: z.string().optional(),
        email: z.string().email(),
        password: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userToCheck = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (userToCheck) {
        throw new Error('User already exists');
      }

      const client = await clerkClient();

      const clerkUser = await client.users.createUser({
        emailAddress: [input.email],
        firstName: input.firstName,
        lastName: input.lastName,
        publicMetadata: {
          userType: UserType.PARTNER,
        },
        password: input.password,
        skipPasswordChecks: true,
      });

      if (!clerkUser) {
        throw new Error('Failed to create user in Clerk.');
      }

      const user = await ctx.db.user.create({
        data: {
          id: clerkUser.id,
          email: input.email,
          referralCode: generateCode(),
          userType: UserType.PARTNER,
        },
      });

      if (input.referralToken) {
        try {
          await createReferralLink(input.referralToken, user.id, input.firstName, input.lastName);
        } catch (error) {
          console.error('Failed to create referral link', error);
        }
      }

      await sendEmail(
        input.firstName,
        'Welcome to Im-Vestor!',
        'Thank you for signing up to Im-Vestor. We are excited to have you on board.',
        input.email,
        'Welcome to Im-Vestor!'
      );

      return ctx.db.partner.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          mobileFone: input.mobileFone,
          companyName: input.companyName,
          userId: user.id,
        },
      });
    }),
  update: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        mobileFone: z.string().min(1),
        companyName: z.string().min(1),
        photo: z.string().optional(),
        companyLogoUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.partner.update({
        where: { userId: ctx.auth.userId },
        data: input,
      });
    }),
});
