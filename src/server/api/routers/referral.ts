import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc';

export const referralRouter = createTRPCRouter({
  getReferralDetails: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.user.findUnique({
      where: {
        id: ctx.auth.userId,
      },
      include: {
        referralsAsReferrer: true,
      },
    });
  }),

  getReferrerNameByToken: publicProcedure
    .input(z.object({ referralToken: z.string() }))
    .query(async ({ ctx, input }) => {
      const referrerUser = await ctx.db.user.findUnique({
        where: {
          referralCode: input.referralToken,
        },
        include: {
          entrepreneur: true,
          investor: true,
          partner: true,
          incubator: true,
          vcGroup: true,
        },
      });

      if (!referrerUser) {
        return null;
      }

      // Get the referrer's name based on their type
      switch (referrerUser.userType) {
        case 'ENTREPRENEUR':
          return referrerUser.entrepreneur
            ? `${referrerUser.entrepreneur.firstName} ${referrerUser.entrepreneur.lastName}`
            : null;
        case 'INVESTOR':
          return referrerUser.investor
            ? `${referrerUser.investor.firstName} ${referrerUser.investor.lastName}`
            : null;
        case 'PARTNER':
          return referrerUser.partner
            ? `${referrerUser.partner.firstName} ${referrerUser.partner.lastName}`
            : null;
        case 'INCUBATOR':
          return referrerUser.incubator ? referrerUser.incubator.name : null;
        case 'VC_GROUP':
          return referrerUser.vcGroup ? referrerUser.vcGroup.name : null;
        default:
          return null;
      }
    }),
});
