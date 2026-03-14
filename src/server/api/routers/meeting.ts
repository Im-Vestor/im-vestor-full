import { NotificationType, UserType } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { addDays } from 'date-fns';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { createDailyCall } from '~/utils/daily';
import { createNotifications } from './notifications';

export const meetingRouter = createTRPCRouter({
  getMeetingsByDate: protectedProcedure
    .input(z.object({ date: z.date() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;
      const userType = ctx.auth.sessionClaims?.publicMetadata?.userType;

      const whereClause =
        userType === UserType.ENTREPRENEUR
          ? { entrepreneur: { userId } }
          : userType === UserType.INCUBATOR
            ? { incubators: { some: { userId } } }
            : {
              OR: [
                { investors: { some: { userId } } },
                { vcGroups: { some: { userId } } },
              ],
            };

      const startOfDay = new Date(input.date);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const meetings = await ctx.db.meeting.findMany({
        where: {
          ...whereClause,
          startDate: {
            gte: startOfDay,
            lte: addDays(startOfDay, 1),
          },
        },
        include: {
          negotiation: {
            select: {
              project: {
                select: {
                  name: true,
                  logo: true,
                  country: {
                    select: {
                      name: true,
                    },
                  },
                  state: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          entrepreneur: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              user: {
                select: {
                  imageUrl: true,
                },
              },
            },
          },
          investors: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              user: {
                select: {
                  imageUrl: true,
                },
              },
            },
          },
        },
        orderBy: {
          startDate: 'asc',
        },
      });

      return meetings;
    }),
  getUpcomingMeetings: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.auth.userId;
      const userType = ctx.auth.sessionClaims?.publicMetadata?.userType;

      const whereClause =
        userType === UserType.ENTREPRENEUR
          ? { entrepreneur: { userId } }
          : userType === UserType.INCUBATOR
            ? { incubators: { some: { userId } } }
            : {
              OR: [
                { investors: { some: { userId } } },
                { vcGroups: { some: { userId } } },
              ],
            };

      const now = new Date();

      return ctx.db.meeting.findMany({
        where: {
          ...whereClause,
          startDate: { gte: now },
        },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          negotiation: {
            select: {
              project: {
                select: {
                  name: true,
                  logo: true,
                },
              },
            },
          },
          entrepreneur: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          investors: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          vcGroups: {
            select: {
              id: true,
              name: true,
            },
          },
          incubators: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { startDate: 'asc' },
        take: 10,
      });
    }),
  enterMeeting: protectedProcedure
    .input(z.object({ negotiationId: z.string(), meetingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const negotiation = await ctx.db.negotiation.findUnique({
        where: { id: input.negotiationId },
      });

      if (!negotiation) {
        throw new Error('Negotiation not found');
      }

      await ctx.db.negotiation.update({
        where: { id: input.negotiationId },
        data: {
          entrepreneurActionNeeded: true,
          investorActionNeeded: true,
        },
      });

      return negotiation;
    }),
  cancelMeeting: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const meeting = await ctx.db.meeting.delete({
        where: { id: input.meetingId },
        include: {
          investors: true,
          entrepreneur: true,
          negotiation: true,
        },
      });

      await ctx.db.negotiation.update({
        where: { id: meeting?.negotiation?.id },
        data: {
          entrepreneurActionNeeded: false,
          investorActionNeeded: false,
        },
      });

      if (!meeting) {
        throw new Error('Meeting not found');
      }

      const user = await ctx.db.user.findUnique({
        where: {
          id: ctx.auth.userId,
        },
        include: {
          entrepreneur: true,
          investor: true,
        },
      });

      const userType = user?.userType;

      const userIds =
        userType === UserType.INVESTOR
          ? [meeting.entrepreneur?.userId]
          : meeting.investors.map(investor => investor.userId);

      if (!userIds) {
        throw new Error('User IDs not found');
      }

      const userIdsArray = userIds.filter((userId): userId is string => typeof userId === 'string');

      await createNotifications(ctx.db, userIdsArray, NotificationType.MEETING_CANCELLED);

      return meeting;
    }),
  createInstantMeeting: protectedProcedure.mutation(async () => {
    const now = new Date();
    try {
      const { url } = await createDailyCall(now);
      return { url };
    } catch (error) {
      console.error('Failed to create Daily.co instant room:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create instant meeting room.',
        cause: error,
      });
    }
  }),
});
