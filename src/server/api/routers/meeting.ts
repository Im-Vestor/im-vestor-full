import { NotificationType, UserType } from '@prisma/client';
import { addDays } from 'date-fns';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';

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
        },
      });

      const userType = user?.userType;

      const whereClause =
        userType === UserType.ENTREPRENEUR
          ? {
              entrepreneurId: user?.entrepreneur?.id,
            }
          : {
              investors: {
                some: {
                  id: user?.investor?.id,
                },
              },
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
  cancelMeeting: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const meeting = await ctx.db.meeting.delete({
        where: { id: input.id },
        include: {
          investors: true,
          entrepreneur: true,
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

      await ctx.db.notification.createMany({
        data: userIds.map(userId => ({
          userId: userId ?? '',
          type: NotificationType.MEETING_CANCELLED,
        })),
      });

      return meeting;
    }),
});
