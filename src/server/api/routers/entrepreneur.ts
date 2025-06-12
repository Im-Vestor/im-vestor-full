import { clerkClient } from '@clerk/nextjs/server';
import { UserType } from '@prisma/client';
import { z } from 'zod';

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc';
import { sendEmail } from '~/utils/email';
import { createReferralLink, generateCode } from '~/utils/referral';

export const entrepreneurRouter = createTRPCRouter({
  getByUserId: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.entrepreneur.findUnique({
      where: { userId: ctx.auth.userId },
      include: {
        projects: {
          include: {
            state: true,
            country: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        country: true,
        state: true,
      },
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

      return ctx.db.entrepreneur.findUnique({
        where: { userId: input.userId },
        include: {
          projects: {
            include: {
              state: true,
              country: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          country: true,
          state: true,
        },
      });
    }),
  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return ctx.db.entrepreneur.findUniqueOrThrow({
      where: { id: input.id },
      include: {
        projects: {
          include: {
            state: true,
            country: true,
            sector: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        country: true,
        state: true,
        user: {
          select: {
            id: true,
          },
        },
      },
    });
  }),
  create: publicProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        mobileFone: z.string().min(1),
        birthDate: z.date(),
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
          userType: UserType.ENTREPRENEUR,
        },
        password: input.password,
        skipPasswordChecks: true,
      });

      const user = await ctx.db.user.create({
        data: {
          id: clerkUser.id,
          email: input.email,
          referralCode: generateCode(),
          userType: UserType.ENTREPRENEUR,
        },
      });

      if (input.referralToken) {
        if (input.referralToken) {
          await createReferralLink(input.referralToken, user.id, input.firstName, input.lastName);
        }
      }

      await sendEmail(
        input.firstName,
        'Welcome to Im-Vestor!',
        'Thank you for signing up to Im-Vestor. We are excited to have you on board.',
        input.email,
        'Welcome to Im-Vestor!'
      );

      return ctx.db.entrepreneur.create({
        data: {
          userId: user.id,
          firstName: input.firstName,
          lastName: input.lastName,
          mobileFone: input.mobileFone,
          birthDate: input.birthDate,
        },
      });
    }),
  update: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        country: z.string().min(1),
        state: z.string().min(1),
        companyRole: z.string().min(1),
        companyName: z.string().min(1),
        about: z.string().optional(),
        photo: z.string().optional(),
        banner: z.string().optional(),
        mobileFone: z.string().min(1),
        fiscalCode: z.string().min(1),
        personalPitchUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.photo) {
        await ctx.db.user.update({
          where: { id: ctx.auth.userId },
          data: {
            imageUrl: input.photo,
          },
        });
      }

      return ctx.db.entrepreneur.update({
        where: { userId: ctx.auth.userId },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          country: {
            connect: {
              id: parseInt(input.country),
            },
          },
          state: {
            connect: {
              id: parseInt(input.state),
            },
          },
          companyRole: input.companyRole,
          companyName: input.companyName,
          about: input.about,
          photo: input.photo,
          banner: input.banner,
          mobileFone: input.mobileFone,
          fiscalCode: input.fiscalCode,
          personalPitchUrl: input.personalPitchUrl,
        },
      });
    }),
});
