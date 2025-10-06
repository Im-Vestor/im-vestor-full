import { NegotiationStage, NotificationType, UserType, type PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { addHours } from 'date-fns';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { createDailyCall } from '~/utils/daily';
import { createNotifications } from './notifications';
import { sendEmail } from '~/utils/email';

export const negotiationRouter = createTRPCRouter({
  getNegotiationByProjectIdAndInvestorIdOrVcGroupId: protectedProcedure
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
          vcGroup: true,
        },
      });

      if (user?.userType === UserType.ENTREPRENEUR) {
        return await ctx.db.negotiation.findFirst({
          where: {
            projectId: input.projectId,
            project: {
              entrepreneurId: user.entrepreneur?.id,
            },
          },
        });
      } else {
        return await ctx.db.negotiation.findFirst({
          where: {
            projectId: input.projectId,
            ...(user?.investor && { investorId: user.investor.id }),
            ...(user?.vcGroup && { vcGroupId: user.vcGroup.id }),
          },
        });
      }
    }),
  createAndSchedulePitchMeeting: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        date: z.date(),
        investorId: z.string().optional(),
        vcGroupId: z.string().optional(),
        entrepreneurId: z.string().optional(),
        incubatorId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if the investor has a negotiation with the entrepreneur
      const existingNegotiation = await ctx.db.negotiation.findFirst({
        where: {
          projectId: input.projectId,
          ...(input.investorId && { investorId: input.investorId }),
          ...(input.vcGroupId && { vcGroupId: input.vcGroupId }),
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
          ...(input.investorId && { investorId: input.investorId }),
          ...(input.vcGroupId && { vcGroupId: input.vcGroupId }),
          entrepreneurActionNeeded: true,
          investorActionNeeded: true,
        },
      });

      const meetingDetails = scheduleMeeting(
        ctx.db,
        input.date,
        input.entrepreneurId ?? null,
        input.incubatorId ?? null,
        input.investorId ? [input.investorId] : [],
        input.vcGroupId ? [input.vcGroupId] : [],
        negotiation.id
      );

      // Fetch all user types with their email information
      const investor = await ctx.db.investor.findUnique({
        where: { id: input.investorId },
        select: {
          userId: true,
          firstName: true,
          user: { select: { email: true } },
        },
      });

      const vcGroup = await ctx.db.vcGroup.findUnique({
        where: { id: input.vcGroupId },
        select: {
          userId: true,
          name: true,
          user: { select: { email: true } },
        },
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

      const incubator = await ctx.db.incubator.findUnique({
        where: { id: input.incubatorId },
        select: {
          userId: true,
          name: true,
          email: true,
        },
      });

      // Collect all relevant emails and prepare meeting details
      const meetingUrl = (await meetingDetails).url;
      const recipientEmails: string[] = [];

      // Add entrepreneur/incubator email (they need to accept/reject the meeting)
      if (entrepreneur?.user.email) {
        recipientEmails.push(entrepreneur.user.email);
      }
      if (incubator?.email) {
        recipientEmails.push(incubator.email);
      }

      // Send email to entrepreneur/incubator about the meeting request
      if (recipientEmails.length > 0) {
        const recipientName = entrepreneur ? entrepreneur.firstName : (incubator?.name ?? '');
        void sendEmail(
          recipientName,
          'New pitch meeting request',
          `An investor has requested a pitch meeting. Please check your dashboard to accept or reject the request.`,
          recipientEmails,
          'New pitch meeting request',
          meetingUrl,
          'View Meeting Details'
        );
      }

      // Send confirmation email to investor/VC group
      const investorEmails: string[] = [];
      if (investor?.user.email) {
        investorEmails.push(investor.user.email);
      }
      if (vcGroup?.user.email) {
        investorEmails.push(vcGroup.user.email);
      }

      if (investorEmails.length > 0) {
        const investorName = investor ? investor.firstName : (vcGroup?.name ?? '');
        void sendEmail(
          investorName,
          'Pitch meeting request sent',
          `Your pitch meeting request has been sent. You will be notified once the entrepreneur responds.`,
          investorEmails,
          'Pitch meeting request sent',
          meetingUrl,
          'View Meeting Details'
        );
      }

      void createNotifications(
        ctx.db,
        [
          investor?.userId ?? vcGroup?.userId ?? '',
          entrepreneur?.userId ?? incubator?.userId ?? '',
        ],
        NotificationType.NEGOTIATION_CREATED
      );

      return negotiation;
    }),
  createAndScheduleOtherStageMeeting: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        date: z.date(),
        investorId: z.string().optional(),
        vcGroupId: z.string().optional(),
        entrepreneurId: z.string().optional(),
        incubatorId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if the investor has a negotiation with the entrepreneur
      const existingNegotiation = await ctx.db.negotiation.findFirst({
        where: {
          projectId: input.projectId,
          ...(input.investorId && { investorId: input.investorId }),
          ...(input.vcGroupId && { vcGroupId: input.vcGroupId }),
        },
      });

      if (!existingNegotiation || existingNegotiation.stage === NegotiationStage.PITCH) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Investor does not have a negotiation with the entrepreneur',
        });
      }

      void ctx.db.negotiation.update({
        where: { id: existingNegotiation.id },
        data: {
          entrepreneurActionNeeded: true,
          investorActionNeeded: true,
        },
      });

      const meetingDetails = scheduleMeeting(
        ctx.db,
        input.date,
        input.entrepreneurId ?? null,
        input.incubatorId ?? null,
        input.investorId ? [input.investorId] : [],
        input.vcGroupId ? [input.vcGroupId] : [],
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

      const incubator = await ctx.db.incubator.findUnique({
        where: { id: input.incubatorId },
        select: {
          userId: true,
          name: true,
          email: true,
        },
      });

      void sendEmail(
        entrepreneur ? (entrepreneur?.firstName ?? '') : (incubator?.name ?? ''),
        'New meeting request',
        `An investor has requested a new meeting. Please check your dashboard to accept or reject the request or use the link below ${(await meetingDetails).url}`,
        [entrepreneur?.user.email ?? '', incubator?.email ?? ''],
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
              Incubator: true,
            },
          },
          investor: true,
          VcGroup: true,
        },
      });

      await createNotifications(
        ctx.db,
        [
          negotiation.investor?.userId ?? negotiation.VcGroup?.userId ?? '',
          negotiation.project.Entrepreneur?.userId ?? negotiation.project.Incubator?.userId ?? '',
        ],
        NotificationType.NEGOTIATION_CANCELLED
      );

      await sendEmail(
        negotiation.project.Entrepreneur
          ? (negotiation.project.Entrepreneur?.firstName ?? '')
          : (negotiation.project.Incubator?.name ?? ''),
        'Negotiation cancelled',
        'The negotiation has been cancelled. Please check your dashboard to see the details.',
        [
          negotiation.project.Entrepreneur
            ? (negotiation.project.Entrepreneur?.user.email ?? '')
            : (negotiation.project.Incubator?.email ?? ''),
        ],
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
          incubator: true,
          investor: true,
          vcGroup: true,
        },
      });

      if (user?.userType === UserType.ENTREPRENEUR || user?.userType === UserType.INCUBATOR) {
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
              Incubator: true,
            },
          },
          VcGroup: true,
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
        negotiation?.project.Entrepreneur
          ? (negotiation?.project.Entrepreneur?.firstName ?? '')
          : (negotiation?.project.Incubator?.name ?? ''),
        'Negotiation went to next stage',
        'The negotiation has gone to the next stage. Please check your dashboard to see the details.',
        [
          negotiation?.project.Entrepreneur
            ? (negotiation?.project.Entrepreneur?.user.email ?? '')
            : (negotiation?.project.Incubator?.email ?? ''),
        ],
        'Negotiation went to next stage'
      );

      await createNotifications(
        ctx.db,
        [
          negotiation?.investor?.userId ?? negotiation?.VcGroup?.userId ?? '',
          negotiation?.project.Entrepreneur?.userId ?? '',
        ],
        NotificationType.NEGOTIATION_GO_TO_NEXT_STAGE
      );

      return negotiation;
    }),
});

async function scheduleMeeting(
  db: PrismaClient,
  date: Date,
  entrepreneurId: string | null,
  incubatorId: string | null,
  investorIds: string[],
  vcGroupIds: string[],
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
      ...(entrepreneurId && { entrepreneurId: entrepreneurId }),
      ...(incubatorId && { incubators: { connect: { id: incubatorId } } }),
      ...(investorIds.length > 0 && {
        investors: {
          connect: investorIds.map(id => ({ id })),
        },
      }),
      ...(vcGroupIds.length > 0 && {
        vcGroups: {
          connect: vcGroupIds.map(id => ({ id })),
        },
      }),
      negotiationId: negotiationId,
    },
  });

  if (entrepreneurId) {
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
  } else if (incubatorId) {
    await db.notification.create({
      data: {
        userId:
          (await db.incubator.findUnique({ where: { id: incubatorId }, select: { userId: true } }))
            ?.userId ?? '',
        type: NotificationType.MEETING_CREATED,
      },
    });
  }

  return meeting;
}
