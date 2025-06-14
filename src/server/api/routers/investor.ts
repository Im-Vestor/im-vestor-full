import { clerkClient } from '@clerk/nextjs/server';
import { UserType, Currency } from '@prisma/client';
import { z } from 'zod';

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc';
import { sendEmail } from '~/utils/email';
import { createReferralLink, generateCode } from '~/utils/referral';

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
  getInvestorsRelatedToEntrepreneur: protectedProcedure
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
      const totalInvestors = await ctx.db.investor.count({
        where: {
          ...(input.searchQuery
            ? {
              OR: [
                { firstName: { contains: input.searchQuery, mode: 'insensitive' } },
                { lastName: { contains: input.searchQuery, mode: 'insensitive' } },
              ],
            }
            : {}),
          ...(input.minInvestment ? { investmentMinValue: { gte: input.minInvestment } } : {}),
          ...(input.maxInvestment ? { investmentMaxValue: { lte: input.maxInvestment } } : {}),
          ...(input.areaIds && input.areaIds.length > 0
            ? {
              areas: {
                some: {
                  id: { in: input.areaIds },
                },
              },
            }
            : {}),
          ...(input.countryId ? { countryId: input.countryId } : {}),
          ...(input.stateId ? { stateId: input.stateId } : {}),
        },
      });

      const investors = await ctx.db.investor.findMany({
        where: {
          ...(input.searchQuery
            ? {
              OR: [
                { firstName: { contains: input.searchQuery, mode: 'insensitive' } },
                { lastName: { contains: input.searchQuery, mode: 'insensitive' } },
              ],
            }
            : {}),
          ...(input.minInvestment ? { investmentMinValue: { gte: input.minInvestment } } : {}),
          ...(input.maxInvestment ? { investmentMaxValue: { lte: input.maxInvestment } } : {}),
          ...(input.areaIds && input.areaIds.length > 0
            ? {
              areas: {
                some: {
                  id: { in: input.areaIds },
                },
              },
            }
            : {}),
          ...(input.countryId ? { countryId: input.countryId } : {}),
          ...(input.stateId ? { stateId: input.stateId } : {}),
        },
        include: {
          country: true,
          state: true,
          areas: true,
        },
        skip: input.page ? input.page * 10 : 0,
        take: 10,
      });

      return { investors, total: totalInvestors };
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
        },
      });

      if (input.referralToken) {
        await createReferralLink(input.referralToken, user.id, input.firstName, input.lastName);
      }

      await sendEmail(
        input.firstName,
        'Welcome to Im-Vestor!',
        'Thank you for signing up to Im-Vestor. We are excited to have you on board.',
        input.email,
        'Welcome to Im-Vestor!'
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
  favoriteOrUnfavorite: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const investor = await ctx.db.investor.findUniqueOrThrow({
        where: { userId: ctx.auth.userId },
        include: {
          favoriteProjects: true,
        },
      });

      const favorite = investor.favoriteProjects.find(favorite => favorite.id === input.projectId);

      if (favorite) {
        await ctx.db.investor.update({
          where: { id: investor.id },
          data: {
            favoriteProjects: {
              disconnect: { id: input.projectId },
            },
          },
        });
      } else {
        await ctx.db.investor.update({
          where: { id: investor.id },
          data: {
            favoriteProjects: { connect: { id: input.projectId } },
          },
        });
      }
    }),
});
