import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc';
import { createDailyCall } from '~/utils/daily';
import { TRPCError } from '@trpc/server';
import { addDays } from 'date-fns';

export const pitchRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        projectId: z.string().optional(),
        image: z.string(),
        video: z.string().optional(),
        date1: z.date(),
        date2: z.date(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
      });

      if (!user || user.availablePublicPitchTickets < 1) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have any Public Pitch tickets available.',
        });
      }

      // Create Daily rooms for both dates
      const room1 = await createDailyCall(input.date1);
      const room2 = await createDailyCall(input.date2);

      if (!room1 || !room2) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create Daily.co rooms.',
        });
      }

      // Create the pitch record
      const pitch = await ctx.db.pitchOfTheWeek.create({
        data: {
          userId: ctx.auth.userId,
          projectId: input.projectId,
          image: input.image,
          video: input.video,
          date1: input.date1,
          date2: input.date2,
          dailyRoomName1: room1.name,
          dailyRoomUrl1: room1.url,
          dailyRoomName2: room2.name,
          dailyRoomUrl2: room2.url,
          status: 'SCHEDULED',
        },
      });

      // Decrement ticket count
      await ctx.db.user.update({
        where: { id: ctx.auth.userId },
        data: {
          availablePublicPitchTickets: {
            decrement: 1,
          },
        },
      });

      // Create HyperTrain item
      const hyperTrainItem = await ctx.db.hyperTrainItem.create({
        data: {
          externalId: pitch.id,
          type: 'PUBLIC_PITCH',
          name: input.description || 'Pitch of the Week',
          description: `Live Pitch: ${input.date1.toLocaleDateString()} & ${input.date2.toLocaleDateString()}`,
          image: input.image,
          link: '/public-pitch',
          liveUntil: addDays(input.date2, 1),
          pitchOfTheWeeks: {
            connect: { id: pitch.id },
          },
        },
      });

      // Store the HyperTrain item ID on the pitch record
      await ctx.db.pitchOfTheWeek.update({
        where: { id: pitch.id },
        data: { hyperTrainItemId: hyperTrainItem.id },
      });

      return pitch;
    }),

  getMyPitches: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.pitchOfTheWeek.findMany({
      where: {
        userId: ctx.auth.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        project: true,
      },
    });
  }),

  getScheduledPitches: publicProcedure.query(async ({ ctx }) => {
    const now = new Date();
    return ctx.db.pitchOfTheWeek.findMany({
      where: {
        status: 'SCHEDULED',
        date2: {
          gte: addDays(now, -1),
        },
      },
      orderBy: {
        date1: 'asc',
      },
      include: {
        project: true,
        hyperTrainItem: true,
        user: {
          select: {
            imageUrl: true,
            entrepreneur: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }),
});
