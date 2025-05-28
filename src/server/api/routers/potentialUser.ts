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
  getAll: publicProcedure
    .input(z.object({
      page: z.number().min(1),
      limit: z.number().min(1),
    }))
    .query(async ({ ctx, input }) => {
      const [items, total] = await Promise.all([
        ctx.db.potentialUser.findMany({
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          orderBy: { createdAt: 'desc' },
        }),
        ctx.db.potentialUser.count(),
      ]);

      return {
        items,
        total,
        hasMore: (input.page * input.limit) < total,
      };
    }),
});