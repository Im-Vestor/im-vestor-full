import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc';
import { type Prisma } from "@prisma/client";

export const userRouter = createTRPCRouter({
  getUser: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: {
        id: ctx.auth.userId,
      },
    });

    return user;
  }),
  getMyReferrals: protectedProcedure
    .input(z.object({ page: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const { page } = input;
      const perPage = 10;
      const skip = (page ?? 1) * perPage;

      // Referrals that the current user referred
      const referrals = await ctx.db.referral.findMany({
        where: { referrerId: ctx.auth.userId },
        skip,
        take: perPage,
        include: {
          referred: true,
        },
        orderBy: {
          joinedAt: 'desc',
        },
      });

      // Get the business (both from investors and entrepreneurs referred)
      const businesses = await ctx.db.project.findMany({
        where: {
          OR: [
            {
              investedInvestors: {
                some: {
                  id: {
                    in: referrals.map(referral => referral.referred.id),
                  },
                },
              },
            },
            {
              Entrepreneur: {
                userId: {
                  in: referrals.map(referral => referral.referred.id),
                },
              },
            },
          ],
        },
        include: {
          investedInvestors: {
            include: {
              user: true,
            },
          },
          Entrepreneur: {
            include: {
              user: true,
            },
          },
        },
      });

      // Match the businesses to the referrals
      const referralsWithBusinesses = referrals.map(referral => {
        const referralBusinesses = businesses.filter(
          business =>
            business.investedInvestors.some(
              investor => investor.user.id === referral.referred.id
            ) || business.Entrepreneur?.userId === referral.referred.id
        );

        return {
          referral,
          businesses: referralBusinesses,
        };
      });

      const total = await ctx.db.referral.count({
        where: { referrerId: ctx.auth.userId },
      });

      return {
        referralsWithBusinesses,
        total,
      };
    }),
  getAll: publicProcedure
    .input(
      z.object({
        page: z.number().min(1),
        limit: z.number().min(1),
        sortBy: z.string().optional(),
        sortDirection: z.enum(["asc", "desc"]).optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, sortBy, sortDirection, search } = input;

      const where: Prisma.UserWhereInput = search ? {
        OR: [
          {
            investor: {
              firstName: { contains: search, mode: 'insensitive' as Prisma.QueryMode },
            },
          },
          {
            investor: {
              lastName: { contains: search, mode: 'insensitive' as Prisma.QueryMode },
            },
          },
          {
            entrepreneur: {
              firstName: { contains: search, mode: 'insensitive' as Prisma.QueryMode },
            },
          },
          {
            entrepreneur: {
              lastName: { contains: search, mode: 'insensitive' as Prisma.QueryMode },
            },
          },
          {
            email: { contains: search, mode: 'insensitive' as Prisma.QueryMode },
          },
        ],
      } : {};

      try {
        const [items, total] = await Promise.all([
          ctx.db.user.findMany({
            where,
            select: {
              id: true,
              email: true,
              userType: true,
              referralCode: true,
              investor: {
                select: {
                  firstName: true,
                  lastName: true,
                }
              },
              entrepreneur: {
                select: {
                  firstName: true,
                  lastName: true,
                }
              },
              partner: {
                select: {
                  firstName: true,
                  lastName: true,
                }
              },
              incubator: {
                select: {
                  name: true,
                }
              },
              vcGroup: {
                select: {
                  name: true,
                }
              },
            },
            orderBy: sortBy ? {
              [sortBy]: sortDirection ?? 'asc'
            } : undefined,
            skip: (page - 1) * limit,
            take: limit,
          }),
          ctx.db.user.count({ where }),
        ]);

        const formattedItems = items.map((user) => ({
          ...user,
          firstName:
            user.investor?.firstName ??
            user.entrepreneur?.firstName ??
            user.partner?.firstName ??
            "",
          lastName:
            user.investor?.lastName ??
            user.entrepreneur?.lastName ??
            user.partner?.lastName ??
            "",
          name:
            user.incubator?.name ??
            user.vcGroup?.name ??
            "",
        }));

        return {
          items: formattedItems,
          total,
          hasMore: (page * limit) < total,
        };
      } catch (error) {
        console.error('Error in getAll query:', error);
        throw error;
      }
    }),
});
