import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';

// Define precise types for the connections
export const connectionTypeSchema = z.object({
  connection: z.object({
    id: z.string(),
    followerId: z.string(),
    followingId: z.string(),
    createdAt: z.date(),
  }),
  user: z.object({
    id: z.string(),
    email: z.string(),
    imageUrl: z.string().nullable(),
    userType: z.string(),
    referralCode: z.string(),
    entrepreneur: z
      .object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string(),
      })
      .nullable(),
    investor: z
      .object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string(),
      })
      .nullable(),
    partner: z
      .object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string(),
      })
      .nullable(),
  }),
  type: z.enum(['following', 'follower']),
  mutual: z.boolean(),
});

export type ConnectionResponse = z.infer<typeof connectionTypeSchema>;

export const connectionRouter = createTRPCRouter({
  getMyConnections: protectedProcedure
    .input(z.object({ page: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const { page } = input;
      const perPage = 10;
      const skip = (page ?? 0) * perPage;

      // Get people the user follows
      const following = await ctx.db.connection.findMany({
        where: { followerId: ctx.auth.userId },
        include: {
          following: {
            include: {
              investor: true,
              entrepreneur: true,
              partner: true,
            },
          },
        },
      });

      // Get people following the user
      const followers = await ctx.db.connection.findMany({
        where: { followingId: ctx.auth.userId },
        include: {
          follower: {
            include: {
              investor: true,
              entrepreneur: true,
              partner: true,
            },
          },
        },
      });

      // Create a map of following IDs for quick lookup
      const followingMap = new Map(following.map(conn => [conn.followingId, conn]));

      // Create a map of follower IDs for quick lookup
      const followerMap = new Map(followers.map(conn => [conn.followerId, conn]));

      // Combine and format the connections with mutual follow status
      const connections = [
        ...following.map(conn => ({
          connection: conn,
          user: conn.following,
          type: 'following',
          mutual: followerMap.has(conn.followingId),
        })),
        ...followers
          .filter(conn => !followingMap.has(conn.followerId)) // Skip users already in following list
          .map(conn => ({
            connection: conn,
            user: conn.follower,
            type: 'follower',
            mutual: false,
          })),
      ];

      // Paginate the combined results
      const paginatedConnections = connections.slice(skip, skip + perPage);

      const total = connections.length;

      return {
        total,
        connections: paginatedConnections,
      };
    }),

  connect: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if connection already exists
      const existingConnection = await ctx.db.connection.findUnique({
        where: {
          followerId_followingId: {
            followerId: ctx.auth.userId,
            followingId: input.userId,
          },
        },
      });

      if (existingConnection) {
        // Connection already exists, so we remove it (unfollow)
        await ctx.db.connection.delete({
          where: {
            followerId_followingId: {
              followerId: ctx.auth.userId,
              followingId: input.userId,
            },
          },
        });
        return { connected: false };
      } else {
        // Create new connection (follow)
        await ctx.db.connection.create({
          data: {
            followerId: ctx.auth.userId,
            followingId: input.userId,
          },
        });
        return { connected: true };
      }
    }),
});
