import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';

export const userRouter = createTRPCRouter({
  getUser: protectedProcedure.query(async ({ ctx }) => {
    console.log('getUser');

    return await ctx.db.user.findUnique({
      where: {
        id: ctx.auth.userId,
      },
    });
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
});
