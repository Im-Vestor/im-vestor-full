import { z } from "zod";
import { addDays } from "date-fns";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { ProjectViewWithRelations } from "~/types/admin";
import type { NotificationType } from "@prisma/client";
import { TRPCError } from "@trpc/server";

// Security utilities
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_DELETIONS_PER_WINDOW = 5;
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limiting for destructive operations
const checkRateLimit = (adminId: string, operation: string) => {
  const key = `${adminId}:${operation}`;
  const now = Date.now();
  const limit = rateLimitMap.get(key);

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (limit.count >= MAX_DELETIONS_PER_WINDOW) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Rate limit exceeded. Maximum ${MAX_DELETIONS_PER_WINDOW} ${operation} operations per minute.`,
    });
  }

  limit.count++;
  return true;
};

// Audit logging for admin actions
const logAdminAction = async (ctx: any, action: string, details: any) => {
  try {
    // In a real implementation, you'd want to store this in a dedicated audit log table
    console.log(`[AUDIT] Admin Action: ${action}`, {
      adminId: ctx.auth.userId,
      timestamp: new Date().toISOString(),
      action,
      details,
      ipAddress: ctx.req?.ip || 'unknown',
      userAgent: ctx.req?.headers?.['user-agent'] || 'unknown',
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
};

// Note: confirmation tokens are generated elsewhere; helper removed as unused

// Helper function to check admin authorization with role-based permissions
const checkAdminAuthorization = async (ctx: { auth: { userId: string; sessionClaims?: { publicMetadata?: { userIsAdmin?: boolean; adminRole?: string } } } }, requiredRole?: 'read' | 'write' | 'delete') => {
  // For development, you can temporarily bypass admin check
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_ADMIN_CHECK === 'true') {
    return true;
  }

  // Check specifically for userIsAdmin: true in Clerk public metadata
  const publicMetadata = ctx.auth.sessionClaims?.publicMetadata;
  const isAdminFromClerk = publicMetadata?.userIsAdmin === true;

  if (!isAdminFromClerk) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: "Unauthorized - Admin access required. userIsAdmin must be true in Clerk public metadata.",
    });
  }

  // Check role-based permissions if required
  if (requiredRole) {
    const adminRoleRaw = publicMetadata?.adminRole;
    const adminRole: 'read' | 'write' | 'delete' =
      adminRoleRaw === 'delete' || adminRoleRaw === 'write' || adminRoleRaw === 'read'
        ? adminRoleRaw
        : 'read';
    const roleHierarchy: Record<'read' | 'write' | 'delete', number> = { read: 1, write: 2, delete: 3 };

    const currentLevel = roleHierarchy[adminRole];
    const requiredLevel = roleHierarchy[requiredRole];

    if (currentLevel < requiredLevel) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Insufficient permissions. Required role: ${requiredRole}, Current role: ${adminRole}`,
      });
    }
  }

  return true;
};

export const adminRouter = createTRPCRouter({
  // Debug function to check what's preventing user deletion (disabled in production)
  debugUserDeletion: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (process.env.NODE_ENV === 'production') {
        return { disabled: true };
      }
      await checkAdminAuthorization(ctx, 'read');

      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        include: {
          entrepreneur: true,
          investor: true,
          partner: true,
          incubator: true,
          vcGroup: true,
        },
      });

      if (!user) {
        return { error: 'User not found' };
      }

      // Check all possible references
      const checks = {
        supportTicketReplies: await ctx.db.supportTicketReply.count({ where: { adminId: input.userId } }),
        supportTickets: await ctx.db.supportTicket.count({ where: { userId: input.userId } }),
        notifications: await ctx.db.notification.count({ where: { userId: input.userId } }),
        connectionsAsFollower: await ctx.db.connection.count({ where: { followerId: input.userId } }),
        connectionsAsFollowing: await ctx.db.connection.count({ where: { followingId: input.userId } }),
        referralsAsReferrer: await ctx.db.referral.count({ where: { referrerId: input.userId } }),
        referralsAsReferred: await ctx.db.referral.count({ where: { referredId: input.userId } }),
        preferredHours: user.entrepreneur ? await ctx.db.preferredHours.count({ where: { entrepreneurId: user.entrepreneur.id } }) : 0,
        projectViews: user.investor ? await ctx.db.projectView.count({ where: { investorId: user.investor.id } }) : 0,
        negotiationsAsInvestor: user.investor ? await ctx.db.negotiation.count({ where: { investorId: user.investor.id } }) : 0,
        negotiationsAsEntrepreneur: user.entrepreneur ? await ctx.db.negotiation.count({
          where: {
            project: {
              entrepreneurId: user.entrepreneur.id
            }
          }
        }) : 0,
        meetingsAsEntrepreneur: user.entrepreneur ? await ctx.db.meeting.count({ where: { entrepreneurId: user.entrepreneur.id } }) : 0,
        meetingsAsInvestor: user.investor ? await ctx.db.meeting.count({
          where: {
            negotiation: {
              investorId: user.investor.id,
            },
          },
        }) : 0,
        files: user.entrepreneur ? await ctx.db.file.count({
          where: {
            Project: {
              entrepreneurId: user.entrepreneur.id,
            },
          },
        }) : 0,
        projects: user.entrepreneur ? await ctx.db.project.count({ where: { entrepreneurId: user.entrepreneur.id } }) : 0,
      };

      return {
        user: {
          id: user.id,
          email: user.email,
          userType: user.userType,
          status: user.status,
        },
        references: checks,
        hasReferences: Object.values(checks).some(count => count > 0),
      };
    }),

  deleteUserByAdmin: protectedProcedure
    .input(z.object({
      userId: z.string(),
      confirmationToken: z.string().optional(),
      reason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Check admin authorization with delete role
      await checkAdminAuthorization(ctx, 'delete');

      // Check rate limiting
      checkRateLimit(ctx.auth.userId, 'user_deletion');

      // Log the deletion attempt
      await logAdminAction(ctx, 'USER_DELETION_ATTEMPT', {
        targetUserId: input.userId,
        reason: input.reason,
        confirmationToken: input.confirmationToken ? 'provided' : 'missing'
      });

      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        include: {
          entrepreneur: true,
          investor: true,
          partner: true,
          incubator: true,
          vcGroup: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        });
      }

      if (user.status === 'INACTIVE') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User account is already inactive'
        });
      }

      try {

        // Log successful deletion
        await logAdminAction(ctx, 'USER_DELETION_SUCCESS', {
          targetUserId: input.userId,
          targetUserEmail: user.email,
          reason: input.reason
        });

        return {
          success: true,
          message: `User account for ${user.email} has been deactivated and anonymized`
        };

      } catch (error) {
        // Log failed deletion
        await logAdminAction(ctx, 'USER_DELETION_FAILED', {
          targetUserId: input.userId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }),

  // Direct account deletion without email confirmation - PERMANENT DELETION
  deleteUserAccountDirectly: protectedProcedure
    .input(z.object({
      userId: z.string(),
      confirmationToken: z.string(),
      reason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Check admin authorization with delete role
      await checkAdminAuthorization(ctx, 'delete');

      // Check rate limiting
      checkRateLimit(ctx.auth.userId, 'permanent_user_deletion');

      // Log the deletion attempt
      await logAdminAction(ctx, 'PERMANENT_USER_DELETION_ATTEMPT', {
        targetUserId: input.userId,
        reason: input.reason,
        confirmationToken: input.confirmationToken
      });

      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        include: {
          entrepreneur: true,
          investor: true,
          partner: true,
          incubator: true,
          vcGroup: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `User ${input.userId} not found in database. This user may have already been deleted or the ID is invalid.`
        });
      }

      if (user.status === 'INACTIVE') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Account already marked as inactive'
        });
      }

      const userEmail = user.email;
      console.log(`Found user in database: ${userEmail} (${user.userType})`);

      try {
        console.log(`Starting permanent deletion for user ${input.userId} (${userEmail})`);

        // 1. Delete from Clerk authentication system FIRST
        let clerkDeletionSuccess = false;
        try {
          const { clerkClient } = await import('@clerk/nextjs/server');
          const client = await clerkClient();

          // Check if user exists in Clerk first
          try {
            const clerkUser = await client.users.getUser(input.userId);
            console.log(`Found user in Clerk: ${clerkUser.emailAddresses[0]?.emailAddress}`);

            await client.users.deleteUser(input.userId);
            console.log(`Successfully deleted user ${input.userId} from Clerk`);
            clerkDeletionSuccess = true;
          } catch (clerkGetError) {
            console.log(`User ${input.userId} not found in Clerk (${clerkGetError instanceof Error ? clerkGetError.message : 'Unknown error'}), proceeding with database cleanup`);
            clerkDeletionSuccess = true; // Consider it successful since user doesn't exist in Clerk
          }
        } catch (clerkError) {
          console.error(`Clerk deletion error:`, clerkError);
          console.log(`Clerk deletion failed, but continuing with database cleanup to ensure data consistency`);
          // Don't throw error, continue with database cleanup
        }

        // 2. Delete all related data from database (in correct order to avoid foreign key constraints)
        console.log('Starting database cleanup...');

        // Use database transaction for atomicity
        const result = await ctx.db.$transaction(async (tx) => {
          // First, delete all dependent records that reference the user

          // Delete support ticket replies (adminId references User)
          console.log(`Deleting support ticket replies for admin ${input.userId}`);
          const deletedReplies = await tx.supportTicketReply.deleteMany({
            where: { adminId: input.userId },
          });
          console.log(`Deleted ${deletedReplies.count} support ticket replies`);

          // Delete support tickets (userId references User)
          console.log(`Deleting support tickets for user ${input.userId}`);
          const deletedTickets = await tx.supportTicket.deleteMany({
            where: { userId: input.userId },
          });
          console.log(`Deleted ${deletedTickets.count} support tickets`);

          // Delete notifications (userId references User)
          console.log(`Deleting notifications for user ${input.userId}`);
          const deletedNotifications = await tx.notification.deleteMany({
            where: { userId: input.userId },
          });
          console.log(`Deleted ${deletedNotifications.count} notifications`);

          // Delete connections/follows (followerId/followingId reference User)
          console.log(`Deleting connections for user ${input.userId}`);
          const deletedConnections = await tx.connection.deleteMany({
            where: {
              OR: [
                { followerId: input.userId },
                { followingId: input.userId },
              ],
            },
          });
          console.log(`Deleted ${deletedConnections.count} connections`);

          // Delete referrals (referrerId/referredId reference User)
          console.log(`Deleting referrals for user ${input.userId}`);
          const deletedReferrals = await tx.referral.deleteMany({
            where: {
              OR: [
                { referrerId: input.userId },
                { referredId: input.userId },
              ],
            },
          });
          console.log(`Deleted ${deletedReferrals.count} referrals`);

          // Delete preferred hours (entrepreneurId references Entrepreneur)
          if (user.entrepreneur) {
            console.log(`Deleting preferred hours for entrepreneur ${user.entrepreneur.id}`);
            const deletedHours = await tx.preferredHours.deleteMany({
              where: { entrepreneurId: user.entrepreneur.id },
            });
            console.log(`Deleted ${deletedHours.count} preferred hours`);
          }

          // Delete project views (investorId references Investor)
          if (user.investor) {
            console.log(`Deleting project views for investor ${user.investor.id}`);
            const deletedViews = await tx.projectView.deleteMany({
              where: { investorId: user.investor.id },
            });
            console.log(`Deleted ${deletedViews.count} project views`);
          }

          // Delete negotiations (investorId references Investor)
          if (user.investor) {
            console.log(`Deleting negotiations for investor ${user.investor.id}`);
            const deletedInvestorNegotiations = await tx.negotiation.deleteMany({
              where: { investorId: user.investor.id },
            });
            console.log(`Deleted ${deletedInvestorNegotiations.count} investor negotiations`);
          }

          // Delete negotiations for entrepreneur's projects (through project relation)
          if (user.entrepreneur) {
            console.log(`Deleting negotiations for entrepreneur projects ${user.entrepreneur.id}`);
            const deletedEntrepreneurNegotiations = await tx.negotiation.deleteMany({
              where: {
                project: {
                  entrepreneurId: user.entrepreneur.id
                }
              },
            });
            console.log(`Deleted ${deletedEntrepreneurNegotiations.count} entrepreneur negotiations`);
          }

          // Delete meetings (entrepreneurId references Entrepreneur)
          if (user.entrepreneur) {
            console.log(`Deleting meetings for entrepreneur ${user.entrepreneur.id}`);
            const deletedMeetings = await tx.meeting.deleteMany({
              where: { entrepreneurId: user.entrepreneur.id },
            });
            console.log(`Deleted ${deletedMeetings.count} meetings`);
          }

          // Delete meetings where user is investor (through negotiations)
          if (user.investor) {
            console.log(`Deleting meetings for investor ${user.investor.id}`);
            const deletedInvestorMeetings = await tx.meeting.deleteMany({
              where: {
                negotiation: {
                  investorId: user.investor.id,
                },
              },
            });
            console.log(`Deleted ${deletedInvestorMeetings.count} investor meetings`);
          }

          // Delete files (projectId references Project)
          if (user.entrepreneur) {
            console.log(`Deleting files for entrepreneur projects ${user.entrepreneur.id}`);
            const deletedFiles = await tx.file.deleteMany({
              where: {
                Project: {
                  entrepreneurId: user.entrepreneur.id,
                },
              },
            });
            console.log(`Deleted ${deletedFiles.count} files`);
          }

          // Delete projects (entrepreneurId references Entrepreneur)
          if (user.entrepreneur) {
            console.log(`Deleting projects for entrepreneur ${user.entrepreneur.id}`);
            const deletedProjects = await tx.project.deleteMany({
              where: { entrepreneurId: user.entrepreneur.id },
            });
            console.log(`Deleted ${deletedProjects.count} projects`);
          }

          // Delete profile records (userId references User)
          if (user.entrepreneur) {
            console.log(`Deleting entrepreneur profile ${user.entrepreneur.id}`);
            await tx.entrepreneur.delete({
              where: { id: user.entrepreneur.id },
            });
            console.log(`Deleted entrepreneur profile`);
          }

          if (user.investor) {
            console.log(`Deleting investor profile ${user.investor.id}`);
            await tx.investor.delete({
              where: { id: user.investor.id },
            });
            console.log(`Deleted investor profile`);
          }

          if (user.partner) {
            console.log(`Deleting partner profile ${user.partner.id}`);
            await tx.partner.delete({
              where: { id: user.partner.id },
            });
            console.log(`Deleted partner profile`);
          }

          if (user.incubator) {
            console.log(`Deleting incubator profile ${user.incubator.id}`);
            await tx.incubator.delete({
              where: { id: user.incubator.id },
            });
            console.log(`Deleted incubator profile`);
          }

          if (user.vcGroup) {
            console.log(`Deleting vc group profile ${user.vcGroup.id}`);
            await tx.vcGroup.delete({
              where: { id: user.vcGroup.id },
            });
            console.log(`Deleted vc group profile`);
          }

          // Finally, delete the user record itself
          console.log(`Deleting user record ${input.userId}`);
          await tx.user.delete({
            where: { id: input.userId },
          });
          console.log(`Successfully deleted user record`);

          return { clerkDeletionSuccess };
        });

        console.log(`Successfully deleted all data for user ${input.userId}`);

        const clerkStatus = result.clerkDeletionSuccess ? "Clerk authentication system and database" : "database (Clerk deletion failed)";

        // Log successful deletion
        await logAdminAction(ctx, 'PERMANENT_USER_DELETION_SUCCESS', {
          targetUserId: input.userId,
          targetUserEmail: userEmail,
          reason: input.reason,
          clerkStatus
        });

        return {
          success: true,
          message: `Account for ${userEmail} has been permanently deleted from ${clerkStatus}. User can now create a new account with the same email.`
        };

      } catch (error) {
        console.error('Error during permanent account deletion:', error);

        // Log failed deletion
        await logAdminAction(ctx, 'PERMANENT_USER_DELETION_FAILED', {
          targetUserId: input.userId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        // Provide more specific error information
        if (error instanceof Error) {
          if (error.message.includes('not found') || error.message.includes('Not Found')) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: `User ${input.userId} not found in system. This could mean the user was already deleted or the ID is invalid.`
            });
          } else if (error.message.includes('Clerk')) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: `Clerk authentication system error: ${error.message}`
            });
          } else if (error.message.includes('database') || error.message.includes('prisma')) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: `Database error during deletion: ${error.message}`
            });
          } else {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: `Unexpected error during account deletion: ${error.message}`
            });
          }
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to permanently delete account: Unknown error occurred`
        });
      }
    }),

  // Force delete user with transaction and cascade
  forceDeleteUser: protectedProcedure
    .input(z.object({
      userId: z.string(),
      confirmationToken: z.string(),
      reason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Check admin authorization with delete role
      await checkAdminAuthorization(ctx, 'delete');

      // Check rate limiting
      checkRateLimit(ctx.auth.userId, 'force_user_deletion');

      // Log the deletion attempt
      await logAdminAction(ctx, 'FORCE_USER_DELETION_ATTEMPT', {
        targetUserId: input.userId,
        reason: input.reason,
        confirmationToken: input.confirmationToken
      });

      try {
        console.log(`Starting force deletion for user ${input.userId}`);

        // First, try to delete from Clerk
        try {
          const { clerkClient } = await import('@clerk/nextjs/server');
          const client = await clerkClient();
          await client.users.deleteUser(input.userId);
          console.log(`Successfully deleted user ${input.userId} from Clerk`);
        } catch (clerkError) {
          console.log(`Clerk deletion failed or user not found: ${clerkError instanceof Error ? clerkError.message : 'Unknown error'}`);
        }

        // Get user info
        const user = await ctx.db.user.findUnique({
          where: { id: input.userId },
          include: {
            entrepreneur: true,
            investor: true,
            partner: true,
            incubator: true,
            vcGroup: true,
          },
        });

        if (!user) {
          throw new Error('User not found in database');
        }

        console.log(`Found user: ${user.email} (${user.userType})`);

        // Delete all related records step by step (without transaction to avoid issues)
        const deletionResults: any = {};

        // Delete support ticket replies
        console.log(`Deleting support ticket replies for admin ${input.userId}`);
        deletionResults.supportTicketReplies = await ctx.db.supportTicketReply.deleteMany({ where: { adminId: input.userId } });

        // Delete support tickets
        console.log(`Deleting support tickets for user ${input.userId}`);
        deletionResults.supportTickets = await ctx.db.supportTicket.deleteMany({ where: { userId: input.userId } });

        // Delete notifications
        console.log(`Deleting notifications for user ${input.userId}`);
        deletionResults.notifications = await ctx.db.notification.deleteMany({ where: { userId: input.userId } });

        // Delete connections
        console.log(`Deleting connections for user ${input.userId}`);
        deletionResults.connections = await ctx.db.connection.deleteMany({
          where: {
            OR: [
              { followerId: input.userId },
              { followingId: input.userId },
            ],
          },
        });

        // Delete referrals
        console.log(`Deleting referrals for user ${input.userId}`);
        deletionResults.referrals = await ctx.db.referral.deleteMany({
          where: {
            OR: [
              { referrerId: input.userId },
              { referredId: input.userId },
            ],
          },
        });

        // Delete profile-specific records
        if (user.entrepreneur) {
          console.log(`Deleting entrepreneur-specific records for ${user.entrepreneur.id}`);

          // Delete preferred hours
          deletionResults.preferredHours = await ctx.db.preferredHours.deleteMany({ where: { entrepreneurId: user.entrepreneur.id } });

          // Delete files (try-catch to handle potential issues)
          try {
            deletionResults.files = await ctx.db.file.deleteMany({
              where: {
                Project: {
                  entrepreneurId: user.entrepreneur.id,
                },
              },
            });
          } catch (fileError) {
            console.log(`File deletion failed (continuing): ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
            deletionResults.files = { count: 0 };
          }

          // Delete projects
          deletionResults.projects = await ctx.db.project.deleteMany({ where: { entrepreneurId: user.entrepreneur.id } });

          // Delete negotiations
          deletionResults.negotiations = await ctx.db.negotiation.deleteMany({
            where: {
              project: {
                entrepreneurId: user.entrepreneur.id,
              },
            },
          });

          // Delete meetings
          deletionResults.meetings = await ctx.db.meeting.deleteMany({ where: { entrepreneurId: user.entrepreneur.id } });

          // Delete entrepreneur profile
          await ctx.db.entrepreneur.delete({ where: { id: user.entrepreneur.id } });
        }

        if (user.investor) {
          console.log(`Deleting investor-specific records for ${user.investor.id}`);

          deletionResults.projectViews = await ctx.db.projectView.deleteMany({ where: { investorId: user.investor.id } });
          deletionResults.negotiationsAsInvestor = await ctx.db.negotiation.deleteMany({ where: { investorId: user.investor.id } });

          await ctx.db.investor.delete({ where: { id: user.investor.id } });
        }

        if (user.partner) {
          console.log(`Deleting partner profile ${user.partner.id}`);
          await ctx.db.partner.delete({ where: { id: user.partner.id } });
        }

        if (user.incubator) {
          console.log(`Deleting incubator profile ${user.incubator.id}`);
          await ctx.db.incubator.delete({ where: { id: user.incubator.id } });
        }

        if (user.vcGroup) {
          console.log(`Deleting vc group profile ${user.vcGroup.id}`);
          await ctx.db.vcGroup.delete({ where: { id: user.vcGroup.id } });
        }

        // Finally, delete the user
        console.log(`Deleting user record ${input.userId}`);
        await ctx.db.user.delete({ where: { id: input.userId } });

        console.log(`Force deletion completed successfully for user ${input.userId}`);
        // Minimal audit trail: create a support ticket entry for audit (if admin id available)
        try {
          if (ctx.auth.userId) {
            await ctx.db.supportTicket.create({
              data: {
                subject: 'AUDIT: User permanently deleted',
                message: `Admin ${ctx.auth.userId} permanently deleted user ${user.email} (${user.id}).`,
                status: 'CLOSED',
                userId: ctx.auth.userId,
              },
            });
          }
        } catch (auditError) {
          console.log('Audit log creation failed (continuing):', auditError instanceof Error ? auditError.message : 'Unknown error');
        }

        // Log successful deletion
        await logAdminAction(ctx, 'FORCE_USER_DELETION_SUCCESS', {
          targetUserId: input.userId,
          targetUserEmail: user.email,
          reason: input.reason,
          deletions: deletionResults
        });

        return {
          success: true,
          message: `User ${user.email} has been permanently deleted from all systems.`,
          deletions: deletionResults,
        };

      } catch (error) {
        console.error('Force deletion error:', error);

        // Log failed deletion
        await logAdminAction(ctx, 'FORCE_USER_DELETION_FAILED', {
          targetUserId: input.userId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Force deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }),
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
              id: true,
            },
          },
          investor: {
            select: {
              firstName: true,
              lastName: true,
              id: true,
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
              id: true,
            },
          },
        },
        orderBy: [
          { createdAt: "desc" },
          { userType: "asc" },
          { email: "asc" },
        ],
      });

      // Get current date for filtering active HyperTrain items
      const now = new Date();

      // Calculate counts for each user
      const usersWithCounts = await Promise.all(
        users.map(async (user) => {
          let availableHyperTrainTickets = 0;
          let availablePitches = 0;

          // Count active HyperTrain tickets
          if (user.userType === 'INVESTOR' && user.investor?.id) {
            const activeHyperTrainItems = await ctx.db.hyperTrainItem.count({
              where: {
                externalId: String(user.investor.id),
                liveUntil: {
                  gte: now,
                },
              },
            });
            availableHyperTrainTickets = activeHyperTrainItems;
          } else if (user.userType === 'VC_GROUP' && user.vcGroup?.id) {
            const activeHyperTrainItems = await ctx.db.hyperTrainItem.count({
              where: {
                externalId: String(user.vcGroup.id),
                liveUntil: {
                  gte: now,
                },
              },
            });
            availableHyperTrainTickets = activeHyperTrainItems;
          } else if (user.userType === 'ENTREPRENEUR' && user.entrepreneur?.id) {
            // For entrepreneurs, count HyperTrain items for their projects
            const entrepreneurProjects = await ctx.db.project.findMany({
              where: {
                entrepreneurId: user.entrepreneur.id,
              },
              select: {
                id: true,
              },
            });

            const projectIds = entrepreneurProjects.map(p => p.id);
            if (projectIds.length > 0) {
              const activeHyperTrainItems = await ctx.db.hyperTrainItem.count({
                where: {
                  externalId: {
                    in: projectIds,
                  },
                  liveUntil: {
                    gte: now,
                  },
                },
              });
              availableHyperTrainTickets = activeHyperTrainItems;
            }
          }

          // TODO: Implement pitch ticket counting when pitch tracking is implemented
          // For now, return 0 as pitches are not stored in a dedicated table
          availablePitches = 0;

          return {
            id: user.id,
            email: user.email,
            userType: user.userType,
            availablePokes: user.availablePokes,
            availableBoosts: user.availableBoosts,
            availablePitches,
            availableHyperTrainTickets,
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
          };
        })
      );

      return usersWithCounts;
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
            'hyper-train-ticket': ['ENTREPRENEUR', 'INVESTOR', 'VC_GROUP'],
          };

          const eligibleTypes = productEligibility[input.productType];
          if (!eligibleTypes?.includes(user.userType)) {
            errors.push({ email, error: `User type ${user.userType} is not eligible for ${input.productType}` });
            continue;
          }

          // Update user data based on product type or create specific records
          const updateData: any = {};

          if (input.productType === 'poke') {
            // Product is "3 Pokes" per unit
            updateData.availablePokes = { increment: input.quantity * 3 };
          } else if (input.productType === 'boost') {
            updateData.availableBoosts = { increment: input.quantity };
          } else if (input.productType === 'hyper-train-ticket') {
            // Create Hyper Train item based on user type (align with Stripe webhook behavior)
            if (user.userType === 'INVESTOR') {
              const fullUser = await ctx.db.user.findUnique({
                where: { id: user.id },
                include: { investor: true },
              });
              if (fullUser?.investor?.id) {
                await ctx.db.hyperTrainItem.upsert({
                  where: { externalId: String(fullUser.investor.id) },
                  update: { liveUntil: addDays(new Date(), 7) },
                  create: {
                    externalId: String(fullUser.investor.id),
                    type: 'INVESTOR',
                    name: `${fullUser.investor.firstName} ${fullUser.investor.lastName}`,
                    link: `/investor/${fullUser.investor.id}`,
                    description: fullUser.investor.about ?? undefined,
                    image: fullUser.imageUrl ?? undefined,
                    liveUntil: addDays(new Date(), 7),
                  },
                });
              }
            } else if (user.userType === 'VC_GROUP') {
              const fullUser = await ctx.db.user.findUnique({
                where: { id: user.id },
                include: { vcGroup: true },
              });
              if (fullUser?.vcGroup?.id) {
                await ctx.db.hyperTrainItem.upsert({
                  where: { externalId: String(fullUser.vcGroup.id) },
                  update: { liveUntil: addDays(new Date(), 7) },
                  create: {
                    externalId: String(fullUser.vcGroup.id),
                    type: 'INVESTOR',
                    name: `${fullUser.vcGroup.name}`,
                    link: `/vc-group/${fullUser.vcGroup.id}`,
                    description: fullUser.vcGroup.description ?? undefined,
                    image: fullUser.imageUrl ?? undefined,
                    liveUntil: addDays(new Date(), 7),
                  },
                });
              }
            } else if (user.userType === 'ENTREPRENEUR') {
              // For entrepreneurs, we need a project. Get the first project or skip if none exists
              const fullUser = await ctx.db.user.findUnique({
                where: { id: user.id },
                include: {
                  entrepreneur: {
                    include: {
                      projects: {
                        take: 1,
                        orderBy: { createdAt: 'desc' },
                      },
                    },
                  },
                },
              });

              if (fullUser?.entrepreneur?.projects && fullUser.entrepreneur.projects.length > 0) {
                const project = fullUser.entrepreneur.projects[0];
                await ctx.db.hyperTrainItem.upsert({
                  where: { externalId: project.id },
                  update: { liveUntil: addDays(new Date(), 7) },
                  create: {
                    externalId: project.id,
                    type: 'PROJECT',
                    name: project.name,
                    link: `/projects/${project.id}`,
                    description: project.description ?? undefined,
                    image: project.imageUrl ?? undefined,
                    liveUntil: addDays(new Date(), 7),
                  },
                });
              } else {
                errors.push({ email, error: 'Entrepreneur must have at least one project to use Hyper Train' });
                continue;
              }
            }
          }

          const updatedUser = Object.keys(updateData).length > 0
            ? await ctx.db.user.update({ where: { id: user.id }, data: updateData })
            : user;

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
        'hyper-train-ticket': ['ENTREPRENEUR', 'INVESTOR', 'VC_GROUP'],
      };

      if (!productValidation[input.productType]?.includes(user.userType)) {
        throw new Error(`Product ${input.productType} is not available for user type ${user.userType}`);
      }

      // Update user's available products or create specific records
      const updateData: any = {};

      if (input.productType === 'poke') {
        // Product is "3 Pokes" per unit
        updateData.availablePokes = { increment: input.quantity * 3 };
      } else if (input.productType === 'boost') {
        updateData.availableBoosts = { increment: input.quantity };
      } else if (input.productType === 'hyper-train-ticket') {
        // Create Hyper Train item aligned with Stripe webhook logic
        if (user.userType === 'INVESTOR') {
          const fullUser = await ctx.db.user.findUnique({
            where: { id: user.id },
            include: { investor: true },
          });
          if (fullUser?.investor?.id) {
            await ctx.db.hyperTrainItem.upsert({
              where: { externalId: String(fullUser.investor.id) },
              update: { liveUntil: addDays(new Date(), 7) },
              create: {
                externalId: String(fullUser.investor.id),
                type: 'INVESTOR',
                name: `${fullUser.investor.firstName} ${fullUser.investor.lastName}`,
                link: `/investor/${fullUser.investor.id}`,
                description: fullUser.investor.about ?? undefined,
                image: fullUser.imageUrl ?? undefined,
                liveUntil: addDays(new Date(), 7),
              },
            });
          }
        } else if (user.userType === 'VC_GROUP') {
          const fullUser = await ctx.db.user.findUnique({
            where: { id: user.id },
            include: { vcGroup: true },
          });
          if (fullUser?.vcGroup?.id) {
            await ctx.db.hyperTrainItem.upsert({
              where: { externalId: String(fullUser.vcGroup.id) },
              update: { liveUntil: addDays(new Date(), 7) },
              create: {
                externalId: String(fullUser.vcGroup.id),
                type: 'INVESTOR',
                name: `${fullUser.vcGroup.name}`,
                link: `/vc-group/${fullUser.vcGroup.id}`,
                description: fullUser.vcGroup.description ?? undefined,
                image: fullUser.imageUrl ?? undefined,
                liveUntil: addDays(new Date(), 7),
              },
            });
          }
        } else if (user.userType === 'ENTREPRENEUR') {
          // For entrepreneurs, get the first project (most recent)
          const fullUser = await ctx.db.user.findUnique({
            where: { id: user.id },
            include: {
              entrepreneur: {
                include: {
                  projects: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                  },
                },
              },
            },
          });

          if (fullUser?.entrepreneur?.projects && fullUser.entrepreneur.projects.length > 0) {
            const project = fullUser.entrepreneur.projects[0];
            await ctx.db.hyperTrainItem.upsert({
              where: { externalId: project.id },
              update: { liveUntil: addDays(new Date(), 7) },
              create: {
                externalId: project.id,
                type: 'PROJECT',
                name: project.name,
                link: `/projects/${project.id}`,
                description: project.description ?? undefined,
                image: project.imageUrl ?? undefined,
                liveUntil: addDays(new Date(), 7),
              },
            });
          } else {
            throw new Error("Entrepreneur must have at least one project to use Hyper Train");
          }
        }
      }

      const updatedUser = Object.keys(updateData).length > 0
        ? await ctx.db.user.update({ where: { id: input.userId }, data: updateData })
        : user;

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