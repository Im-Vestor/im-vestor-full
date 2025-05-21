import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';

export const offerRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.offer.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }),
});
