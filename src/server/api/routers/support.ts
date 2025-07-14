import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { SupportTicketStatus, NotificationType } from '@prisma/client';
import { createNotifications } from './notifications';
import { TRPCError } from '@trpc/server';
import type { Context } from '~/server/context';
import { sendEmail } from '~/utils/email';

const checkAdmin = (ctx: Context) => {
  if (!ctx.auth.sessionClaims?.publicMetadata?.userIsAdmin) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Only admins can perform this action',
    });
  }
};

export const supportRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    checkAdmin(ctx);
    return await ctx.db.supportTicket.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        replies: {
          include: {
            admin: {
              select: {
                id: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        subject: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.supportTicket.create({
        data: {
          subject: input.subject,
          message: input.message,
          userId: ctx.auth.userId,
          status: SupportTicketStatus.OPEN,
        },
      });
    }),

  addReply: protectedProcedure
    .input(
      z.object({
        ticketId: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      checkAdmin(ctx);
      const reply = await ctx.db.supportTicketReply.create({
        data: {
          message: input.message,
          ticketId: input.ticketId,
          adminId: ctx.auth.userId,
        },
      });

      const ticket = await ctx.db.supportTicket.findUnique({
        where: { id: input.ticketId },
        select: {
          userId: true,
          subject: true,
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      if (!ticket) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ticket not found',
        });
      }

      // Send notification
      await createNotifications(ctx.db, [ticket.userId], NotificationType.SUPPORT_TICKET_REPLY);

      // Send email notification
      await sendEmail(
        'User',
        'Support Ticket Reply',
        'Your support ticket has received a reply. Please check your dashboard to view the response.',
        ticket.user.email,
        `Re: ${ticket.subject}`,
      );

      return reply;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        ticketId: z.string(),
        status: z.nativeEnum(SupportTicketStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      checkAdmin(ctx);
      return await ctx.db.supportTicket.update({
        where: {
          id: input.ticketId,
        },
        data: {
          status: input.status,
        },
      });
    }),

  getMyTickets: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.supportTicket.findMany({
      where: {
        userId: ctx.auth.userId,
      },
      include: {
        replies: {
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            admin: {
              select: {
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }),

  addUserReply: protectedProcedure
    .input(
      z.object({
        ticketId: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if ticket exists and belongs to the user
      const ticket = await ctx.db.supportTicket.findFirst({
        where: {
          id: input.ticketId,
          userId: ctx.auth.userId,
          status: 'OPEN' // Only allow replies to open tickets
        },
      });

      if (!ticket) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ticket not found or closed',
        });
      }

      const reply = await ctx.db.supportTicketReply.create({
        data: {
          message: input.message,
          ticketId: input.ticketId,
          adminId: ctx.auth.userId, // Using adminId for consistency, but it's the user in this case
        },
      });

      // Notify admins about the new reply
      const admins = await ctx.db.user.findMany({
        where: {
          userType: 'ADMIN'
        },
      });

      await createNotifications(
        ctx.db,
        admins.map(admin => admin.id),
        NotificationType.SUPPORT_TICKET_CREATED
      );

      return reply;
    }),
});
