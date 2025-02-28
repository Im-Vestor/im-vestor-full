import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const areaRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.area.findMany();
  }),
});
