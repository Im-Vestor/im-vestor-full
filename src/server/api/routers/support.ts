import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, adminProcedure } from '../trpc'; // Correctly import adminProcedure

export const supportRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        subject: z.string().min(1, 'Subject cannot be empty'),
        message: z.string().min(1, 'Message cannot be empty'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId; // Correctly access userId from auth context

      if (!userId) {
        // This check is redundant due to protectedProcedure, but safe
        throw new Error('User not authenticated');
      }

      const ticket = await ctx.db.supportTicket.create({
        data: {
          subject: input.subject,
          message: input.message,
          userId: userId,
        },
      });

      return ticket;
    }),

  getAll: adminProcedure // Use the new adminProcedure
    .query(async ({ ctx }) => {
      const tickets = await ctx.db.supportTicket.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              // You can add more User fields here if needed for the admin view
            },
          },
        },
      });
      return tickets;
    }),

  // Optional: Add procedures to update status (e.g., mark as closed) or delete tickets later
});
