import { NotificationType, type PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';

export const notificationsRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        types: z.array(z.nativeEnum(NotificationType)).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit, types } = input;

      const notifications = await ctx.db.notification.findMany({
        where: {
          userId: ctx.auth.userId,
          ...(types && types.length > 0 && { type: { in: types } }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
      });

      let nextCursor: string | undefined;
      if (notifications.length > limit) {
        nextCursor = notifications[limit]?.id;
        notifications.splice(limit, 1);
      }

      return { notifications, nextCursor };
    }),
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.db.notification.count({
      where: { userId: ctx.auth.userId, read: false },
    });
    return { count };
  }),
  getUnreadNotifications: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.notification.findMany({
      where: {
        userId: ctx.auth.userId,
        read: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
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

export const createNotifications = async (
  db: PrismaClient,
  userIds: string[],
  type: NotificationType,
  message?: string,
  senderId?: string
) => {
  await db.notification.createMany({
    data: userIds.map(userId => ({
      userId: userId ?? '',
      type: type,
      ...(message && { message }),
      ...(senderId && { senderId }),
    })),
  });
};
