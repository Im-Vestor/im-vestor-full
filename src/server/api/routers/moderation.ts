import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { adminProcedure, createTRPCRouter } from '~/server/api/trpc';

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

export const moderationRouter = createTRPCRouter({
  // ─── Banned Words ────────────────────────────────────────────────────────

  getBannedWords: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.bannedWord.findMany({ orderBy: { createdAt: 'desc' } });
  }),

  addBannedWord: adminProcedure
    .input(z.object({ word: z.string().min(1).max(100).trim().toLowerCase() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.bannedWord.findUnique({ where: { word: input.word } });
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Word already banned' });
      }
      return ctx.db.bannedWord.create({
        data: { word: input.word, createdBy: ctx.auth.userId },
      });
    }),

  removeBannedWord: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.bannedWord.delete({ where: { id: input.id } });
    }),

  // ─── Conversations (admin view) ──────────────────────────────────────────

  getAllConversations: adminProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit, search } = input;

      const conversations = await ctx.db.conversation.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { updatedAt: 'desc' },
        where: search
          ? {
              OR: [
                {
                  participants: {
                    some: {
                      entrepreneur: {
                        OR: [
                          { firstName: { contains: search, mode: 'insensitive' } },
                          { lastName: { contains: search, mode: 'insensitive' } },
                        ],
                      },
                    },
                  },
                },
                {
                  participants: {
                    some: {
                      investor: {
                        OR: [
                          { firstName: { contains: search, mode: 'insensitive' } },
                          { lastName: { contains: search, mode: 'insensitive' } },
                        ],
                      },
                    },
                  },
                },
              ],
            }
          : undefined,
        include: {
          participants: { select: participantSelect },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, content: true, createdAt: true, senderId: true },
          },
          _count: { select: { messages: true } },
        },
      });

      let nextCursor: string | undefined;
      if (conversations.length > limit) {
        nextCursor = conversations[limit]?.id;
        conversations.splice(limit, 1);
      }

      return { conversations, nextCursor };
    }),

  getConversationMessages: adminProcedure
    .input(
      z.object({
        conversationId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const { conversationId, cursor, limit } = input;

      const conversation = await ctx.db.conversation.findUnique({
        where: { id: conversationId },
        include: { participants: { select: participantSelect } },
      });

      if (!conversation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' });
      }

      const messages = await ctx.db.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        include: { sender: { select: participantSelect } },
      });

      let nextCursor: string | undefined;
      if (messages.length > limit) {
        nextCursor = messages[limit]?.id;
        messages.splice(limit, 1);
      }

      return { conversation, messages: messages.reverse(), nextCursor };
    }),

  deleteMessage: adminProcedure
    .input(z.object({ messageId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.message.delete({ where: { id: input.messageId } });
    }),
});
