import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';

/** Users are considered online if seen within the last 2 minutes */
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

export const presenceRouter = createTRPCRouter({
  /** Called periodically by the client to signal the user is still active */
  heartbeat: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.user.update({
      where: { id: ctx.auth.userId },
      data: { lastSeenAt: new Date() },
    });
  }),

  /** Returns online status for a list of user IDs */
  getStatuses: protectedProcedure
    .input(z.object({ userIds: z.array(z.string()).max(100) }))
    .query(async ({ ctx, input }) => {
      if (input.userIds.length === 0) return {};

      const threshold = new Date(Date.now() - ONLINE_THRESHOLD_MS);

      const users = await ctx.db.user.findMany({
        where: { id: { in: input.userIds } },
        select: { id: true, lastSeenAt: true },
      });

      const statuses: Record<string, boolean> = {};
      for (const user of users) {
        statuses[user.id] = !!user.lastSeenAt && user.lastSeenAt > threshold;
      }

      return statuses;
    }),
});
