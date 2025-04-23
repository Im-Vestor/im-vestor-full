import { NotificationType, UserType } from '@prisma/client';
import { addDays, addHours } from 'date-fns';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { createDailyCall } from '~/utils/daily';
import { TRPCError } from '@trpc/server';

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
  scheduleMeeting: protectedProcedure
    .input(
      z.object({
        date: z.date(),
        investorIds: z.array(z.string()),
        entrepreneurId: z.string(),
        projectId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date();

      if (input.date < now) {
        console.error('Validation failed: Meeting time is in the past.', {
          inputDate: input.date,
          now,
        });
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Selected meeting time is in the past. Please select a future time.',
        });
      }

      const { name, url } = await createDailyCall(input.date);

      const meeting = await ctx.db.meeting.create({
        data: {
          name,
          url,
          startDate: input.date,
          endDate: addHours(input.date, 1),
          entrepreneurId: input.entrepreneurId,
          investors: {
            connect: input.investorIds.map(id => ({ id })),
          },
          projectId: input.projectId,
        },
      });

      await ctx.db.notification.create({
        data: {
          userId:
            (
              await ctx.db.entrepreneur.findUnique({
                where: { id: input.entrepreneurId },
                select: { userId: true },
              })
            )?.userId ?? '',
          type: NotificationType.MEETING_CREATED,
        },
      });

      return meeting;
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
  createInstantMeeting: protectedProcedure
    .mutation(async () => {
      const now = new Date();
      const expiryDate = addHours(now, 1);
      try {
        const { url } = await createDailyCall(expiryDate);
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
