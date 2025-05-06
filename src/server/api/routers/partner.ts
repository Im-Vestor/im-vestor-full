import { clerkClient } from '@clerk/nextjs/server';
import { UserType } from '@prisma/client';
import { z } from 'zod';

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc';
import { createReferralLink, generateCode } from '~/utils/referral';

export const partnerRouter = createTRPCRouter({
  getByUserId: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.partner.findUnique({
      where: { userId: ctx.auth.userId },
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.partner.update({
        where: { userId: ctx.auth.userId },
        data: input,
      });
    }),
});
