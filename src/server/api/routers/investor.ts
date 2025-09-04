import { clerkClient } from '@clerk/nextjs/server';
import { UserType, Currency, UserStatus } from '@prisma/client';
import { z } from 'zod';

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc';
import { sendEmail } from '~/utils/email';
import { createReferralLink, generateCode } from '~/utils/referral';
import {
  generateEmailVerificationToken,
  generateVerificationLink,
} from '~/utils/email-verification';

export const investorRouter = createTRPCRouter({
  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return ctx.db.investor.findUnique({
      where: { id: input.id },
      include: {
        country: true,
        state: true,
        areas: true,
        user: true,
      },
    });
  }),
  getByUserId: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.investor.findUnique({
      where: { userId: ctx.auth.userId },
      include: {
        country: true,
        state: true,
        favoriteProjects: {
          select: {
            id: true,
          },
        },
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

      return ctx.db.investor.findUnique({
        where: { userId: input.userId },
        include: {
          country: true,
          state: true,
          favoriteProjects: {
            select: {
              id: true,
            },
          },
        },
      });
    }),
  getInvestorsAndVcGroupsRelatedToEntrepreneur: protectedProcedure
    .input(
      z.object({
        page: z.number().optional(),
        searchQuery: z.string().optional(),
        minInvestment: z.number().optional(),
        maxInvestment: z.number().optional(),
        areaIds: z.array(z.string()).optional(),
        countryId: z.number().optional(),
        stateId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, searchQuery, minInvestment, maxInvestment, areaIds, countryId, stateId } =
        input;

      const users = await ctx.db.user.findMany({
        where: {
          OR: [{ userType: UserType.INVESTOR }, { userType: UserType.VC_GROUP }],
        },
        include: {
          investor: {
            where: {
              ...(searchQuery
                ? {
                    OR: [
                      { firstName: { contains: searchQuery, mode: 'insensitive' } },
                      { lastName: { contains: searchQuery, mode: 'insensitive' } },
                    ],
                  }
                : {}),
              ...(minInvestment ? { investmentMinValue: { gte: minInvestment } } : {}),
              ...(maxInvestment ? { investmentMaxValue: { lte: maxInvestment } } : {}),
              ...(areaIds && areaIds.length > 0
                ? { areas: { some: { id: { in: areaIds } } } }
                : {}),
              ...(countryId ? { countryId: countryId } : {}),
              ...(stateId ? { stateId: stateId } : {}),
            },
            include: {
              state: true,
              country: true,
              areas: true,
            },
          },
          vcGroup: {
            where: {
              ...(searchQuery
                ? {
                    OR: [{ name: { contains: searchQuery, mode: 'insensitive' } }],
                  }
                : {}),
              ...(minInvestment ? { averageInvestmentSize: { gte: minInvestment } } : {}),
              ...(maxInvestment ? { averageInvestmentSize: { lte: maxInvestment } } : {}),
              ...(areaIds && areaIds.length > 0
                ? { interestedAreas: { some: { id: { in: areaIds } } } }
                : {}),
              ...(countryId ? { countryId: countryId } : {}),
              ...(stateId ? { stateId: stateId } : {}),
            },
            include: {
              state: true,
              country: true,
              interestedAreas: true,
            },
          },
        },
        skip: page ? page * 10 : 0,
        take: 10,
      });

      const totalUsers = await ctx.db.user.findMany({
        where: {
          OR: [{ userType: UserType.INVESTOR }, { userType: UserType.VC_GROUP }],
        },
        include: {
          investor: {
            select: {
              id: true,
            },
            where: {
              ...(searchQuery
                ? {
                    OR: [
                      { firstName: { contains: searchQuery, mode: 'insensitive' } },
                      { lastName: { contains: searchQuery, mode: 'insensitive' } },
                    ],
                  }
                : {}),
              ...(minInvestment ? { investmentMinValue: { gte: minInvestment } } : {}),
              ...(maxInvestment ? { investmentMaxValue: { lte: maxInvestment } } : {}),
              ...(areaIds && areaIds.length > 0
                ? { areas: { some: { id: { in: areaIds } } } }
                : {}),
              ...(countryId ? { countryId: countryId } : {}),
              ...(stateId ? { stateId: stateId } : {}),
            },
          },
          vcGroup: {
            select: {
              id: true,
            },
            where: {
              ...(searchQuery
                ? {
                    OR: [{ name: { contains: searchQuery, mode: 'insensitive' } }],
                  }
                : {}),
              ...(minInvestment ? { averageInvestmentSize: { gte: minInvestment } } : {}),
              ...(maxInvestment ? { averageInvestmentSize: { lte: maxInvestment } } : {}),
              ...(areaIds && areaIds.length > 0
                ? { interestedAreas: { some: { id: { in: areaIds } } } }
                : {}),
              ...(countryId ? { countryId: countryId } : {}),
              ...(stateId ? { stateId: stateId } : {}),
            },
          },
        },
      });

      return { users, total: totalUsers.length };
    }),
  create: publicProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        mobileFone: z.string().min(1),
        investmentMinValue: z.number(),
        investmentMaxValue: z.number(),
        birthDate: z.date(),
        referralToken: z.string().optional(),
        email: z.string().email(),
        password: z.string().min(8),
        currency: z.nativeEnum(Currency),
        areas: z.array(z.string()),
        linkedinUrl: z.string().optional(),
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
          userType: UserType.INVESTOR,
        },
        password: input.password,
        skipPasswordChecks: true,
      });

      if (!clerkUser) {
        throw new Error('Failed to create user in Clerk.');
      }

      const user = await ctx.db.user.create({
        data: {
          id: clerkUser ? clerkUser.id : '',
          email: input.email,
          referralCode: generateCode(),
          userType: UserType.INVESTOR,
          status: UserStatus.PENDING_EMAIL_VERIFICATION,
        },
      });

      if (input.referralToken) {
        await createReferralLink(input.referralToken, user.id, input.firstName, input.lastName);
      }

      // Generate verification token and send verification email
      const verificationToken = generateEmailVerificationToken(user.id, user.email);
      const verificationLink = generateVerificationLink(verificationToken);

      await sendEmail(
        input.firstName,
        'Welcome to Im-Vestor!',
        'Thank you for signing up to Im-Vestor. Please verify your email address to activate your account.',
        input.email,
        'Verify your email - Im-Vestor',
        verificationLink,
        'Verify Email'
      );

      return ctx.db.investor.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          mobileFone: input.mobileFone,
          investmentMinValue: input.investmentMinValue,
          investmentMaxValue: input.investmentMaxValue,
          birthDate: input.birthDate,
          currency: input.currency,
          userId: user.id,
          areas: {
            connect: input.areas.map(area => ({
              id: area,
            })),
          },
          linkedinUrl: input.linkedinUrl,
        },
      });
    }),
  update: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        mobileFone: z.string().min(1),
        fiscalCode: z.string().min(1),
        photo: z.string().optional(),
        banner: z.string().optional(),
        about: z.string().optional(),
        state: z.string().min(1),
        country: z.string().min(1),
        currency: z.nativeEnum(Currency).optional(),
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

      return ctx.db.investor.update({
        where: { userId: ctx.auth.userId },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          mobileFone: input.mobileFone,
          fiscalCode: input.fiscalCode,
          photo: input.photo,
          banner: input.banner,
          about: input.about,
          currency: input.currency,
          personalPitchUrl: input.personalPitchUrl,
          state: {
            connect: {
              id: parseInt(input.state),
            },
          },
          country: {
            connect: {
              id: parseInt(input.country),
            },
          },
        },
      });
    }),
});
