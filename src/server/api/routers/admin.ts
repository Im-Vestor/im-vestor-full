import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { ProjectViewWithRelations } from "~/types/admin";
import type { NotificationType } from "@prisma/client";

// Helper function to check admin authorization
const checkAdminAuthorization = async (ctx: { auth: { userId: string; sessionClaims?: { publicMetadata?: { userIsAdmin?: boolean } } } }) => {
  // For development, you can temporarily bypass admin check
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_ADMIN_CHECK === 'true') {
    return true;
  }

  // Check specifically for userIsAdmin: true in Clerk public metadata
  const publicMetadata = ctx.auth.sessionClaims?.publicMetadata;
  const isAdminFromClerk = publicMetadata && typeof publicMetadata === 'object' && 'userIsAdmin' in publicMetadata && publicMetadata.userIsAdmin === true;

  if (isAdminFromClerk) {
    return true;
  }

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

  // Get all users for product gifting
  getUsersForGifting: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        userType: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      await checkAdminAuthorization(ctx);

      const where: any = {};

      if (input.search) {
        where.OR = [
          { email: { contains: input.search, mode: "insensitive" as const } },
          { entrepreneur: { firstName: { contains: input.search, mode: "insensitive" as const } } },
          { entrepreneur: { lastName: { contains: input.search, mode: "insensitive" as const } } },
          { investor: { firstName: { contains: input.search, mode: "insensitive" as const } } },
          { investor: { lastName: { contains: input.search, mode: "insensitive" as const } } },
          { incubator: { name: { contains: input.search, mode: "insensitive" as const } } },
          { partner: { companyName: { contains: input.search, mode: "insensitive" as const } } },
          { vcGroup: { name: { contains: input.search, mode: "insensitive" as const } } },
        ];
      }

      if (input.userType) {
        where.userType = input.userType;
      }

      const users = await ctx.db.user.findMany({
        where,
        take: 50, // Limit results for performance
        include: {
          entrepreneur: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          investor: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          incubator: {
            select: {
              name: true,
            },
          },
          partner: {
            select: {
              companyName: true,
            },
          },
          vcGroup: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { email: "asc" },
      });

      return users.map(user => ({
        id: user.id,
        email: user.email,
        userType: user.userType,
        availablePokes: user.availablePokes,
        availableBoosts: user.availableBoosts,
        imageUrl: user.imageUrl,
        name: user.entrepreneur
          ? `${user.entrepreneur.firstName} ${user.entrepreneur.lastName}`
          : user.investor
            ? `${user.investor.firstName} ${user.investor.lastName}`
            : user.incubator?.name
              ? user.incubator.name
              : user.partner?.companyName
                ? user.partner.companyName
                : user.vcGroup?.name
                  ? user.vcGroup.name
                  : 'N/A',
      }));
    }),

  // Gift products to multiple users by email list
  giftProductToUsersByEmail: protectedProcedure
    .input(
      z.object({
        emails: z.array(z.string().email()).min(1, "At least one email is required"),
        productType: z.enum(['poke', 'boost', 'pitch-of-the-week-ticket', 'hyper-train-ticket']),
        quantity: z.number().min(1).max(10),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await checkAdminAuthorization(ctx);

      const results = [];
      const errors = [];

      for (const email of input.emails) {
        try {
          // Find user by email
          const user = await ctx.db.user.findUnique({
            where: { email },
          });

          if (!user) {
            errors.push({ email, error: 'User not found' });
            continue;
          }

          // Check if user type is eligible for the product
          const productEligibility = {
            'poke': ['ENTREPRENEUR', 'INVESTOR', 'INCUBATOR', 'VC_GROUP'],
            'boost': ['ENTREPRENEUR'],
            'pitch-of-the-week-ticket': ['ENTREPRENEUR'],
            'hyper-train-ticket': ['INVESTOR', 'VC_GROUP'],
          };

          const eligibleTypes = productEligibility[input.productType as keyof typeof productEligibility];
          if (!eligibleTypes || !eligibleTypes.includes(user.userType)) {
            errors.push({ email, error: `User type ${user.userType} is not eligible for ${input.productType}` });
            continue;
          }

          // Update user data based on product type
          const updateData: any = {};

          if (input.productType === 'poke') {
            updateData.availablePokes = { increment: input.quantity };
          } else if (input.productType === 'boost') {
            updateData.availableBoosts = { increment: input.quantity };
          }
          // For other product types, we would need to create specific records
          // For now, we'll handle them as special cases

          const updatedUser = await ctx.db.user.update({
            where: { id: user.id },
            data: updateData,
          });

          // Create a notification for the user
          await ctx.db.notification.create({
            data: {
              userId: user.id,
              type: 'POKE',
              read: false,
            },
          });

          results.push({
            email,
            success: true,
            user: {
              id: updatedUser.id,
              email: updatedUser.email,
              availablePokes: updatedUser.availablePokes,
              availableBoosts: updatedUser.availableBoosts,
            },
          });
        } catch (error) {
          errors.push({
            email,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return {
        success: results.length > 0,
        results,
        errors,
        summary: {
          total: input.emails.length,
          successful: results.length,
          failed: errors.length,
        },
      };
    }),

  // Gift a product to a user
  giftProductToUser: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        productType: z.enum(['poke', 'boost', 'pitch-of-the-week-ticket', 'hyper-train-ticket']),
        quantity: z.number().min(1).max(10).default(1),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await checkAdminAuthorization(ctx);

      // Verify user exists
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        include: {
          entrepreneur: true,
          investor: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Validate product type for user type
      const productValidation = {
        'poke': ['ENTREPRENEUR', 'INVESTOR', 'INCUBATOR', 'VC_GROUP'],
        'boost': ['ENTREPRENEUR'],
        'pitch-of-the-week-ticket': ['ENTREPRENEUR'],
        'hyper-train-ticket': ['INVESTOR', 'VC_GROUP'],
      };

      if (!productValidation[input.productType]?.includes(user.userType)) {
        throw new Error(`Product ${input.productType} is not available for user type ${user.userType}`);
      }

      // Update user's available products
      const updateData: any = {};

      if (input.productType === 'poke') {
        updateData.availablePokes = { increment: input.quantity };
      } else if (input.productType === 'boost') {
        updateData.availableBoosts = { increment: input.quantity };
      }

      // For pitch-of-the-week-ticket and hyper-train-ticket, we would need to create specific records
      // For now, we'll handle them as special cases or create a generic product tracking system

      const updatedUser = await ctx.db.user.update({
        where: { id: input.userId },
        data: updateData,
      });

      // Create a notification for the user
      await ctx.db.notification.create({
        data: {
          userId: input.userId,
          type: 'POKE', // Using existing notification type
          read: false,
        },
      });

      return {
        success: true,
        message: `Successfully gifted ${input.quantity} ${input.productType}${input.quantity > 1 ? 's' : ''} to user`,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          availablePokes: updatedUser.availablePokes,
          availableBoosts: updatedUser.availableBoosts,
        },
      };
    }),
});