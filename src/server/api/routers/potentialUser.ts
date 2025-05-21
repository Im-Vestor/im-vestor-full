import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const potentialUserRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email'),
        phone: z.string().optional(),
        event: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.potentialUser.create({
        data: input,
      });
    }),
});