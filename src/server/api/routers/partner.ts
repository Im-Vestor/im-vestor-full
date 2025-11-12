import { clerkClient } from '@clerk/nextjs/server';
import { UserType, UserStatus } from '@prisma/client';
import { z } from 'zod';

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc';
import { sendEmail } from '~/utils/email';
import { createReferralLink, generateCode } from '~/utils/referral';
import {
  generateEmailVerificationToken,
  generateVerificationLink,
} from '~/utils/email-verification';
import { TRPCError } from '@trpc/server';

export const partnerRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.partner.findMany({
      where: {
        user: {
          status: {
            in: ['ACTIVE', 'PENDING_EMAIL_VERIFICATION'],
          },
        },
        companyName: {
          not: null,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        companyName: true,
        companyLogoUrl: true,
      },
    });
  }),

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
        throw new Error('Email already in use');
      }

      const phone = input.mobileFone?.trim();
      if (phone) {
        const [existingInvestor, existingEntrepreneur, existingPartner] = await Promise.all([
          ctx.db.investor.findFirst({ where: { mobileFone: phone } }),
          ctx.db.entrepreneur.findFirst({ where: { mobileFone: phone } }),
          ctx.db.partner.findFirst({ where: { mobileFone: phone } }),
        ]);
        if (existingInvestor || existingEntrepreneur || existingPartner) {
          throw new Error('Mobile phone already in use');
        }
      }

      const client = await clerkClient();

      let clerkUser;
      try {
        clerkUser = await client.users.createUser({
          emailAddress: [input.email],
          firstName: input.firstName,
          lastName: input.lastName,
          publicMetadata: {
            userType: UserType.PARTNER,
          },
          password: input.password,
          skipPasswordChecks: true,
        });
      } catch (error: any) {
        console.error('Clerk createUser failed (partner.create):', error);
        const message =
          error?.errors?.[0]?.message ??
          error?.response?.data?.errors?.[0]?.message ??
          error?.message ??
          'Unprocessable Entity';
        throw new TRPCError({ code: 'BAD_REQUEST', message });
      }

      if (!clerkUser) {
        throw new Error('Failed to create user in Clerk.');
      }

      const user = await ctx.db.user.create({
        data: {
          id: clerkUser.id,
          email: input.email,
          referralCode: generateCode(),
          userType: UserType.PARTNER,
          status: UserStatus.ACTIVE,
        },
      });

      if (input.referralToken) {
        try {
          await createReferralLink(input.referralToken, user.id, input.firstName, input.lastName);
        } catch (error) {
          console.error('Failed to create referral link', error);
        }
      }

      // Generate verification token and send verification email
      const verificationToken = generateEmailVerificationToken(user.id, user.email);
      const verificationLink = generateVerificationLink(verificationToken);

      await sendEmail(
        input.firstName,
        'Welcome to Im-Vestor!',
        'Thank you for signing up to Im-Vestor. Please verify your email address to activate your account.',
        [input.email],
        'Verify your email - Im-Vestor',
        verificationLink,
        'Verify Email'
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
