import { NegotiationStage, NotificationType, UserType } from '@prisma/client';
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
      const user = await ctx.db.user.findUnique({
        where: {
          id: ctx.auth.userId,
        },
        select: {
          userType: true,
          entrepreneur: true,
          investor: true,
          vcGroup: true,
          incubator: true,
        },
      });

      const userType = user?.userType;

      const whereClause =
        userType === UserType.ENTREPRENEUR
          ? {
            entrepreneurId: user?.entrepreneur?.id,
          }
          : userType === UserType.INCUBATOR
            ? {
              incubators: {
                some: {
                  id: user?.incubator?.id,
                },
              },
            }
            : {
              ...(user?.investor && {
                investors: {
                  some: {
                    id: user?.investor?.id,
                  },
                },
              }),
              ...(user?.vcGroup && {
                vcGroups: {
                  some: {
                    id: user?.vcGroup?.id,
                  },
                },
              }),
            };

      const meetings = await ctx.db.meeting.findMany({
        where: {
          ...whereClause,
          startDate: {
            gte: input.date,
            lte: addDays(input.date, 1),
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
          entrepreneur: true,
          incubators: true,
          investors: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          startDate: 'desc',
        },
      });

      return meetings;
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
          stage: NegotiationStage.CANCELLED,
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
