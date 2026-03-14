/* eslint-disable @typescript-eslint/no-unsafe-return */
import { NotificationType } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { createNotifications } from './notifications';

const participantSelect = {
  id: true,
  imageUrl: true,
  userType: true,
  entrepreneur: { select: { firstName: true, lastName: true } },
  investor: { select: { firstName: true, lastName: true } },
  incubator: { select: { name: true } },
  partner: { select: { firstName: true, lastName: true } },
  vcGroup: { select: { name: true } },
} as const;

export const messagesRouter = createTRPCRouter({
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId;

    const conversations = await ctx.db.conversation.findMany({
      where: { participants: { some: { id: userId } } },
      orderBy: { updatedAt: 'desc' },
      include: {
        participants: {
          where: { id: { not: userId } },
          select: participantSelect,
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
            readAt: true,
          },
        },
      },
    });

    const conversationIds = conversations.map(c => c.id);

    const unreadCounts =
      conversationIds.length > 0
        ? await ctx.db.message.groupBy({
            by: ['conversationId'],
            where: {
              conversationId: { in: conversationIds },
              senderId: { not: userId },
              readAt: null,
            },
            _count: { id: true },
          })
        : [];

    const unreadMap = new Map(unreadCounts.map(r => [r.conversationId, r._count.id]));

    return conversations.map(conv => ({
      ...conv,
      unreadCount: unreadMap.get(conv.id) ?? 0,
    }));
  }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId;
    const count = await ctx.db.message.count({
      where: {
        conversation: { participants: { some: { id: userId } } },
        senderId: { not: userId },
        readAt: null,
      },
    });
    return { count };
  }),

  getOrCreateConversation: protectedProcedure
    .input(z.object({ targetUserId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;
      const { targetUserId } = input;

      if (userId === targetUserId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot message yourself' });
      }

      const targetUser = await ctx.db.user.findUnique({ where: { id: targetUserId } });
      if (!targetUser) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      return ctx.db.$transaction(async tx => {
        const existing = await tx.conversation.findFirst({
          where: {
            AND: [
              { participants: { some: { id: userId } } },
              { participants: { some: { id: targetUserId } } },
            ],
          },
          include: { participants: { select: { id: true } } },
        });

        if (existing && existing.participants.length === 2) {
          return { conversationId: existing.id };
        }

        const created = await tx.conversation.create({
          data: {
            participants: { connect: [{ id: userId }, { id: targetUserId }] },
          },
        });

        return { conversationId: created.id };
      });
    }),

  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;
      const { conversationId, cursor, limit } = input;

      const conversation = await ctx.db.conversation.findFirst({
        where: { id: conversationId, participants: { some: { id: userId } } },
      });
      if (!conversation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' });
      }

      const messages = await ctx.db.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          sender: { select: participantSelect },
        },
      });

      let nextCursor: string | undefined;
      if (messages.length > limit) {
        nextCursor = messages[limit]?.id;
        messages.splice(limit, 1);
      }

      return { messages: messages.reverse(), nextCursor };
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        content: z.string().min(1).max(4000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;
      const { conversationId, content } = input;

      const conversation = await ctx.db.conversation.findFirst({
        where: { id: conversationId, participants: { some: { id: userId } } },
        include: { participants: { select: { id: true } } },
      });
      if (!conversation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' });
      }

      const [message] = await Promise.all([
        ctx.db.message.create({
          data: { content, senderId: userId, conversationId },
        }),
        ctx.db.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        }),
      ]);

      const recipientIds = conversation.participants.map(p => p.id).filter(id => id !== userId);
      if (recipientIds.length > 0) {
        void createNotifications(
          ctx.db,
          recipientIds,
          NotificationType.MESSAGE_RECEIVED,
          content.length > 100 ? content.slice(0, 100) + '…' : content,
          userId
        );
      }

      return message;
    }),

  markAsRead: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;
      const { conversationId } = input;

      const conversation = await ctx.db.conversation.findFirst({
        where: { id: conversationId, participants: { some: { id: userId } } },
      });
      if (!conversation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' });
      }

      await ctx.db.message.updateMany({
        where: { conversationId, senderId: { not: userId }, readAt: null },
        data: { readAt: new Date() },
      });
    }),
});
