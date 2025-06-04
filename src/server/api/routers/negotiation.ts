import { NegotiationStage, NotificationType, UserType, type PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { addHours } from 'date-fns';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { createDailyCall } from '~/utils/daily';
import { createNotifications } from './notifications';
import { sendEmail } from '~/utils/email';

export const negotiationRouter = createTRPCRouter({
  getNegotiationByProjectIdAndInvestorId: protectedProcedure
    .input(z.object({ projectId: z.string() }))
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

      if (user?.userType === UserType.ENTREPRENEUR) {
        return await ctx.db.negotiation.findUnique({
          where: {
            projectId: input.projectId,
            project: {
              entrepreneurId: user.entrepreneur?.id,
            },
          },
        });
      } else {
        return await ctx.db.negotiation.findUnique({
          where: {
            projectId: input.projectId,
            investorId: user?.investor?.id,
          },
        });
      }
    }),
  createAndSchedulePitchMeeting: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        date: z.date(),
        investorId: z.string(),
        entrepreneurId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if the investor has a negotiation with the entrepreneur
      const existingNegotiation = await ctx.db.negotiation.findFirst({
        where: {
          projectId: input.projectId,
          investorId: input.investorId,
        },
      });

      if (existingNegotiation) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Investor already has a negotiation with the entrepreneur',
        });
      }

      const negotiation = await ctx.db.negotiation.create({
        data: {
          projectId: input.projectId,
          stage: NegotiationStage.PITCH,
          investorId: input.investorId,
          entrepreneurActionNeeded: true,
          investorActionNeeded: true,
        },
      });

      await scheduleMeeting(
        ctx.db,
        input.date,
        input.entrepreneurId,
        [input.investorId],
        negotiation.id
      );

      const investor = await ctx.db.investor.findUnique({
        where: { id: input.investorId },
        select: { userId: true },
      });

      const entrepreneur = await ctx.db.entrepreneur.findUnique({
        where: { id: input.entrepreneurId },
        select: {
          userId: true,
          firstName: true,
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      await sendEmail(
        entrepreneur?.firstName ?? '',
        'New pitch meeting request',
        'An investor has requested a pitch meeting. Please check your dashboard to accept or reject the request.',
        entrepreneur?.user.email ?? '',
        'New pitch meeting request'
      );

      await createNotifications(
        ctx.db,
        [investor?.userId ?? '', entrepreneur?.userId ?? ''],
        NotificationType.NEGOTIATION_CREATED
      );

      return negotiation;
    }),
  createAndScheduleOtherStageMeeting: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        date: z.date(),
        investorId: z.string(),
        entrepreneurId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if the investor has a negotiation with the entrepreneur
      const existingNegotiation = await ctx.db.negotiation.findFirst({
        where: {
          projectId: input.projectId,
          investorId: input.investorId,
        },
      });

      if (!existingNegotiation || existingNegotiation.stage === NegotiationStage.PITCH) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Investor does not have a negotiation with the entrepreneur',
        });
      }

      await ctx.db.negotiation.update({
        where: { id: existingNegotiation.id },
        data: {
          entrepreneurActionNeeded: true,
          investorActionNeeded: true,
        },
      });

      await scheduleMeeting(
        ctx.db,
        input.date,
        input.entrepreneurId,
        [input.investorId],
        existingNegotiation.id
      );

      const entrepreneur = await ctx.db.entrepreneur.findUnique({
        where: { id: input.entrepreneurId },
        select: {
          userId: true,
          firstName: true,
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      await sendEmail(
        entrepreneur?.firstName ?? '',
        'New meeting request',
        'An investor has requested a new meeting. Please check your dashboard to accept or reject the request.',
        entrepreneur?.user.email ?? '',
        'New meeting request'
      );

      return existingNegotiation;
    }),
  stopNegotiation: protectedProcedure
    .input(z.object({ negotiationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const negotiation = await ctx.db.negotiation.update({
        where: { id: input.negotiationId },
        data: {
          entrepreneurActionNeeded: false,
          investorActionNeeded: false,
          entrepreneurAgreedToGoToNextStage: false,
          investorAgreedToGoToNextStage: false,
          stage: NegotiationStage.CANCELLED,
        },
        include: {
          project: {
            include: {
              Entrepreneur: {
                select: {
                  userId: true,
                  firstName: true,
                  user: {
                    select: {
                      email: true,
                    },
                  },
                },
              },
            },
          },
          investor: true,
        },
      });

      await createNotifications(
        ctx.db,
        [negotiation.investor?.userId ?? '', negotiation.project.Entrepreneur?.userId ?? ''],
        NotificationType.NEGOTIATION_CANCELLED
      );

      await sendEmail(
        negotiation.project.Entrepreneur?.firstName ?? '',
        'Negotiation cancelled',
        'The negotiation has been cancelled. Please check your dashboard to see the details.',
        negotiation.project.Entrepreneur?.user.email ?? '',
        'Negotiation cancelled'
      );

      return negotiation;
    }),
  goToNextStage: protectedProcedure
    .input(z.object({ negotiationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
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

      if (user?.userType === UserType.ENTREPRENEUR) {
        await ctx.db.negotiation.update({
          where: { id: input.negotiationId },
          data: { entrepreneurAgreedToGoToNextStage: true, entrepreneurActionNeeded: false },
        });
      } else {
        await ctx.db.negotiation.update({
          where: { id: input.negotiationId },
          data: { investorAgreedToGoToNextStage: true, investorActionNeeded: false },
        });
      }

      const negotiation = await ctx.db.negotiation.findUnique({
        where: {
          id: input.negotiationId,
        },
        include: {
          investor: true,
          project: {
            include: {
              Entrepreneur: {
                select: {
                  userId: true,
                  firstName: true,
                  user: {
                    select: {
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (
        negotiation?.investorAgreedToGoToNextStage &&
        negotiation?.entrepreneurAgreedToGoToNextStage
      ) {
        await ctx.db.negotiation.update({
          where: { id: input.negotiationId },
          data: {
            investorAgreedToGoToNextStage: false,
            entrepreneurAgreedToGoToNextStage: false,
            stage:
              negotiation.stage === NegotiationStage.PITCH
                ? NegotiationStage.NEGOTIATION
                : negotiation.stage === NegotiationStage.NEGOTIATION
                  ? NegotiationStage.DETAILS
                  : NegotiationStage.CLOSED,
          },
        });
      }

      await sendEmail(
        negotiation?.project.Entrepreneur?.firstName ?? '',
        'Negotiation went to next stage',
        'The negotiation has gone to the next stage. Please check your dashboard to see the details.',
        negotiation?.project.Entrepreneur?.user.email ?? '',
        'Negotiation went to next stage'
      );

      await createNotifications(
        ctx.db,
        [negotiation?.investor?.userId ?? '', negotiation?.project.Entrepreneur?.userId ?? ''],
        NotificationType.NEGOTIATION_GO_TO_NEXT_STAGE
      );

      return negotiation;
    }),
});

async function scheduleMeeting(
  db: PrismaClient,
  date: Date,
  entrepreneurId: string,
  investorIds: string[],
  negotiationId: string
) {
  const now = new Date();

  if (date < now) {
    console.error('Validation failed: Meeting time is in the past.', {
      inputDate: date,
      now,
    });
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Selected meeting time is in the past. Please select a future time.',
    });
  }

  const { name, url } = await createDailyCall(date);

  const meeting = await db.meeting.create({
    data: {
      name,
      url,
      startDate: date,
      endDate: addHours(date, 1),
      entrepreneurId: entrepreneurId,
      investors: {
        connect: investorIds.map(id => ({ id })),
      },
      negotiationId: negotiationId,
    },
  });

  await db.notification.create({
    data: {
      userId:
        (
          await db.entrepreneur.findUnique({
            where: { id: entrepreneurId },
            select: { userId: true },
          })
        )?.userId ?? '',
      type: NotificationType.MEETING_CREATED,
    },
  });

  return meeting;
}
