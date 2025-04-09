import { PreferredHoursPeriod } from '@prisma/client';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';

export const preferredHoursRouter = createTRPCRouter({
  getPreferredHours: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.preferredHours.findMany({
      where: {
        entrepreneur: {
          userId: ctx.auth.userId,
        },
      },
    });
  }),
  getPreferredHoursByEntrepreneurId: protectedProcedure
    .input(z.object({ entrepreneurId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.preferredHours.findMany({
        where: { entrepreneurId: input.entrepreneurId },
      });
    }),
  createPreferredHours: protectedProcedure
    .input(
      z.object({
        period: z.nativeEnum(PreferredHoursPeriod),
        time: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const entrepreneur = await ctx.db.entrepreneur.findUnique({
        where: {
          userId: ctx.auth.userId,
        },
      });

      if (!entrepreneur) {
        throw new Error('Entrepreneur not found');
      }

      const existingPreferredHours = await ctx.db.preferredHours.findFirst({
        where: {
          entrepreneurId: entrepreneur.id,
          period: input.period,
        },
      });

      if (existingPreferredHours) {
        throw new Error('Preferred hour already exists');
      }

      return await ctx.db.preferredHours.create({
        data: {
          period: input.period,
          time: input.time,
          entrepreneur: {
            connect: {
              userId: ctx.auth.userId,
            },
          },
        },
      });
    }),
  deletePreferredHours: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.preferredHours.delete({
        where: { id: input.id },
      });
    }),
});
