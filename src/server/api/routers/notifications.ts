import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';

export const notificationsRouter = createTRPCRouter({
  getUnreadNotifications: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.notification.findMany({
      where: {
        userId: ctx.auth.userId,
        read: false,
      },
    });
  }),
  readNotification: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.notification.update({
        where: { id: input.id },
        data: {
          read: true,
        },
      });
    }),
  readAllNotifications: protectedProcedure.mutation(async ({ ctx }) => {
    return await ctx.db.notification.updateMany({
      where: { userId: ctx.auth.userId },
      data: { read: true },
    });
  }),
});
