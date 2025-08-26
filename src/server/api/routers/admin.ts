import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { ProjectViewWithRelations } from "~/types/admin";
import type { NotificationType } from "@prisma/client";

// Helper function to check admin authorization
const checkAdminAuthorization = async (ctx: { auth: { userId: string; sessionClaims?: { publicMetadata?: { userIsAdmin?: boolean } } } }) => {
  // For development, you can temporarily bypass admin check
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_ADMIN_CHECK === 'true') {
    console.log('Development mode: Bypassing admin check');
    return true;
  }

  // Debug logging
  console.log('Checking admin authorization...');
  console.log('User ID:', ctx.auth.userId);
  console.log('Session claims:', ctx.auth.sessionClaims);
  console.log('Public metadata:', ctx.auth.sessionClaims?.publicMetadata);

  // Check specifically for userIsAdmin: true in Clerk public metadata
  const publicMetadata = ctx.auth.sessionClaims?.publicMetadata;
  const isAdminFromClerk = publicMetadata && typeof publicMetadata === 'object' && 'userIsAdmin' in publicMetadata && publicMetadata.userIsAdmin === true;

  if (isAdminFromClerk) {
    console.log('Admin access granted via Clerk public metadata (userIsAdmin: true)');
    return true;
  }

  console.log('Admin access denied. userIsAdmin not found or not true in public metadata');
  console.log('Public metadata content:', JSON.stringify(publicMetadata, null, 2));
  throw new Error("Unauthorized - Admin access required. userIsAdmin must be true in Clerk public metadata.");
};

export const adminRouter = createTRPCRouter({
  getProjectViews: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        perPage: z.number().default(10),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Ensure user is admin
      await checkAdminAuthorization(ctx);

      const skip = (input.page - 1) * input.perPage;

      const where = input.search
        ? {
          OR: [
            {
              project: {
                name: {
                  contains: input.search,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              investor: {
                firstName: {
                  contains: input.search,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              investor: {
                lastName: {
                  contains: input.search,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
        : {};

      const [projectViews, total] = await Promise.all([
        ctx.db.projectView.findMany({
          skip,
          take: input.perPage,
          where,
          orderBy: { createdAt: "desc" },
          include: {
            investor: {
              select: {
                firstName: true,
                lastName: true,
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
            project: {
              select: {
                name: true,
                Entrepreneur: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        }),
        ctx.db.projectView.count({ where }),
      ]);

      return {
        items: projectViews as ProjectViewWithRelations[],
        total,
        pages: Math.ceil(total / input.perPage),
      };
    }),

  getNotificationLogs: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        perPage: z.number().default(20),
        type: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Ensure user is admin
      await checkAdminAuthorization(ctx);

      const skip = (input.page - 1) * input.perPage;

      const where: {
        type?: NotificationType;
        createdAt?: {
          gte?: Date;
          lte?: Date;
        };
      } = {};

      if (input.type) {
        where.type = input.type as NotificationType;
      }

      if (input.dateFrom || input.dateTo) {
        where.createdAt = {};
        if (input.dateFrom) {
          where.createdAt.gte = new Date(input.dateFrom);
        }
        if (input.dateTo) {
          where.createdAt.lte = new Date(input.dateTo);
        }
      }

      const [notifications, total] = await Promise.all([
        ctx.db.notification.findMany({
          skip,
          take: input.perPage,
          where,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                email: true,
                userType: true,
              },
            },
          },
        }),
        ctx.db.notification.count({ where }),
      ]);

      return {
        items: notifications,
        total,
        pages: Math.ceil(total / input.perPage),
      };
    }),

  getPlatformActivitySummary: protectedProcedure
    .input(
      z.object({
        days: z.number().default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Ensure user is admin
        await checkAdminAuthorization(ctx);

        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - input.days);

        // Simplified version - just get basic counts without complex queries
        const projectViewsCount = await ctx.db.projectView.count();
        const newProjectsCount = await ctx.db.project.count();
        const meetingsCount = await ctx.db.meeting.count();
        const supportTicketsCount = await ctx.db.supportTicket.count();
        const negotiationsCount = await ctx.db.negotiation.count();
        const notificationCount = await ctx.db.notification.count();

        // For now, return a simplified structure
        return {
          notificationCounts: [
            { type: 'TOTAL_NOTIFICATIONS', _count: { type: notificationCount } }
          ],
          projectViewsCount,
          newUsersCount: 0, // User model doesn't have createdAt
          newProjectsCount,
          meetingsCount,
          supportTicketsCount,
          negotiationsCount,
          period: {
            from: dateFrom,
            to: new Date(),
            days: input.days,
          },
        };
      } catch (error) {
        console.error('Error in getPlatformActivitySummary:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Failed to fetch platform activity summary: ${errorMessage}`);
      }
    }),
});