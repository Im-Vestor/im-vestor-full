import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { z } from "zod";

export const countryRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.country.findMany();
  }),
  getStates: publicProcedure
    .input(z.object({ countryId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.state.findMany({
        where: {
          countryId: parseInt(input.countryId),
        },
      });
    }),
});
