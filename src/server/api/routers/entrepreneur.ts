import { clerkClient } from '@clerk/nextjs/server';
import { TRPCError } from '@trpc/server';
import { ProjectStatus, UserType, UserStatus } from '@prisma/client';
import { z } from 'zod';

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc';
import { sendEmail } from '~/utils/email';
import { createReferralLink, generateCode } from '~/utils/referral';
import {
  generateEmailVerificationToken,
  generateVerificationLink,
} from '~/utils/email-verification';

export const entrepreneurRouter = createTRPCRouter({
  getByUserId: protectedProcedure.query(async ({ ctx }) => {
    // First check if the user is an entrepreneur
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.auth.userId },
      select: { userType: true }
    });

    if (!user || user.userType !== 'ENTREPRENEUR') {
      throw new Error('Unauthorized: Only entrepreneurs can access this resource');
    }

    return ctx.db.entrepreneur.findUnique({
      where: { userId: ctx.auth.userId },
      include: {
        projects: {
          where: {
            status: ProjectStatus.ACTIVE,
          },
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
        user: {
          select: {
            availableBoosts: true,
          },
        },
      },
    });
  }),
  getNegotiationsByUserId: protectedProcedure.query(async ({ ctx }) => {
    // First check if the user is an entrepreneur
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.auth.userId },
      select: { userType: true }
    });

    if (!user || user.userType !== 'ENTREPRENEUR') {
      throw new Error('Unauthorized: Only entrepreneurs can access this resource');
    }

    const negotiations = await ctx.db.negotiation.findMany({
      where: { project: { Entrepreneur: { userId: ctx.auth.userId } } },
      include: {
        project: {
          include: {
            state: true,
            country: true,
            Entrepreneur: true,
          },
        },
        investor: true,
        VcGroup: true,
      },
    });

    return negotiations;
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
            where: {
              status: ProjectStatus.ACTIVE,
            },
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
          user: {
            select: {
              availableBoosts: true,
            },
          },
        },
      });
    }),
  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return ctx.db.entrepreneur.findUniqueOrThrow({
      where: { id: input.id },
      include: {
        projects: {
          where: {
            status: ProjectStatus.ACTIVE,
          },
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
        linkedinUrl: z.string().optional(),
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
            userType: UserType.ENTREPRENEUR,
          },
          password: input.password,
        skipPasswordChecks: false,
        });
      } catch (error: any) {
        console.error('Clerk createUser failed (entrepreneur.create):', error);
        const message =
          error?.errors?.[0]?.message ??
          error?.response?.data?.errors?.[0]?.message ??
          error?.message ??
          'Unprocessable Entity';
        throw new TRPCError({ code: 'BAD_REQUEST', message });
      }

      const user = await ctx.db.user.create({
        data: {
          id: clerkUser.id,
          email: input.email,
          referralCode: generateCode(),
          userType: UserType.ENTREPRENEUR,
          availablePokes: input.referralToken ? 2 : 0,
          status: UserStatus.ACTIVE,
        },
      });

      if (input.referralToken) {
        if (input.referralToken) {
          await createReferralLink(input.referralToken, user.id, input.firstName, input.lastName);
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

      return ctx.db.entrepreneur.create({
        data: {
          userId: user.id,
          firstName: input.firstName,
          lastName: input.lastName,
          mobileFone: input.mobileFone,
          birthDate: input.birthDate,
          linkedinUrl: input.linkedinUrl,
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
      // First check if the user is an entrepreneur
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { userType: true }
      });

      if (!user || user.userType !== 'ENTREPRENEUR') {
        throw new Error('Unauthorized: Only entrepreneurs can access this resource');
      }

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
