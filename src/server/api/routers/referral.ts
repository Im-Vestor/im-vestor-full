import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const referralRouter = createTRPCRouter({
  getReferralDetails: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.user.findUnique({
      where: {
        id: ctx.auth.userId,
      },
      include: {
        referrals: true,
      },
    });
  }),
});
