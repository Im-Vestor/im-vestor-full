import { NegotiationStage, NotificationType, UserType, type PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { addHours } from 'date-fns';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { createDailyCall } from '~/utils/daily';
import { sendEmail } from '~/utils/email';
import { generateIcsBuffer } from '~/utils/ics';
import { createNotifications } from './notifications';

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
  scheduleMeeting: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        date: z.date(),
        investorId: z.string().optional(),
        vcGroupId: z.string().optional(),
        entrepreneurId: z.string().optional(),
        incubatorId: z.string().optional(),
        instantMeeting: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingNegotiation = await ctx.db.negotiation.findFirst({
        where: {
          projectId: input.projectId,
          ...(input.investorId && { investorId: input.investorId }),
          ...(input.vcGroupId && { vcGroupId: input.vcGroupId }),
        },
      });

      const isFirstMeeting = !existingNegotiation;

      const negotiation = isFirstMeeting
        ? await ctx.db.negotiation.create({
            data: {
              projectId: input.projectId,
              stage: NegotiationStage.PITCH,
              ...(input.investorId && { investorId: input.investorId }),
              ...(input.vcGroupId && { vcGroupId: input.vcGroupId }),
              entrepreneurActionNeeded: true,
              investorActionNeeded: true,
            },
          })
        : await ctx.db.negotiation.update({
            where: { id: existingNegotiation.id },
            data: { entrepreneurActionNeeded: true, investorActionNeeded: true },
          });

      const meetingDetailsPromise = scheduleMeeting(
        ctx.db,
        input.date,
        input.entrepreneurId ?? null,
        input.incubatorId ?? null,
        input.investorId ? [input.investorId] : [],
        input.vcGroupId ? [input.vcGroupId] : [],
        negotiation.id,
        input.instantMeeting
      );

      const [investor, vcGroup, entrepreneur, incubator, resolvedMeeting] = await Promise.all([
        input.investorId
          ? ctx.db.investor.findUnique({
              where: { id: input.investorId },
              select: { userId: true, firstName: true, user: { select: { email: true } } },
            })
          : null,
        input.vcGroupId
          ? ctx.db.vcGroup.findUnique({
              where: { id: input.vcGroupId },
              select: { userId: true, name: true, user: { select: { email: true } } },
            })
          : null,
        input.entrepreneurId
          ? ctx.db.entrepreneur.findUnique({
              where: { id: input.entrepreneurId },
              select: { userId: true, firstName: true, user: { select: { email: true } } },
            })
          : null,
        input.incubatorId
          ? ctx.db.incubator.findUnique({
              where: { id: input.incubatorId },
              select: { userId: true, name: true, email: true },
            })
          : null,
        meetingDetailsPromise,
      ]);

      const meetingUrl = resolvedMeeting.url;
      const isPitch = isFirstMeeting;

      const icsBuffer = generateIcsBuffer({
        title: isPitch ? 'Im-Vestor Pitch Meeting' : 'Im-Vestor Meeting',
        startDate: input.date,
        endDate: addHours(input.date, 1),
        url: meetingUrl,
        description: isPitch
          ? 'Pitch meeting on Im-Vestor platform.'
          : 'Meeting on Im-Vestor platform.',
      });
      const attachments = [
        { filename: 'meeting.ics', content: icsBuffer, content_type: 'text/calendar' },
      ];

      const recipientEmails: string[] = [];
      if (entrepreneur?.user.email) recipientEmails.push(entrepreneur.user.email);
      if (incubator?.email) recipientEmails.push(incubator.email);

      if (recipientEmails.length > 0) {
        const recipientName = entrepreneur ? entrepreneur.firstName : (incubator?.name ?? '');
        if (input.instantMeeting) {
          void sendEmail(
            recipientName,
            'Meeting starting now',
            'An investor has started an instant meeting. Join now using the link below.',
            recipientEmails,
            'Meeting starting now',
            meetingUrl,
            'Join Meeting',
            attachments
          );
        } else {
          void sendEmail(
            recipientName,
            isPitch ? 'New pitch meeting request' : 'New meeting request',
            isPitch
              ? 'An investor has requested a pitch meeting. Please check your dashboard.'
              : 'An investor has requested a new meeting. Please check your dashboard.',
            recipientEmails,
            isPitch ? 'New pitch meeting request' : 'New meeting request',
            meetingUrl,
            'View Meeting Details',
            attachments
          );
        }
      }

      if (isPitch) {
        const investorEmails: string[] = [];
        if (investor?.user.email) investorEmails.push(investor.user.email);
        if (vcGroup?.user.email) investorEmails.push(vcGroup.user.email);

        if (investorEmails.length > 0) {
          const investorName = investor ? investor.firstName : (vcGroup?.name ?? '');
          if (input.instantMeeting) {
            void sendEmail(
              investorName,
              'Pitch meeting starting now',
              'Your instant pitch meeting has been created. Share the link below with the other participant to join.',
              investorEmails,
              'Pitch meeting starting now',
              meetingUrl,
              'Join Meeting',
              attachments
            );
          } else {
            void sendEmail(
              investorName,
              'Pitch meeting request sent',
              'Your pitch meeting request has been sent. You will be notified once the entrepreneur responds.',
              investorEmails,
              'Pitch meeting request sent',
              meetingUrl,
              'View Meeting Details',
              attachments
            );
          }
        }
      }

      void createNotifications(
        ctx.db,
        [
          investor?.userId ?? vcGroup?.userId ?? '',
          entrepreneur?.userId ?? incubator?.userId ?? '',
        ],
        isPitch ? NotificationType.NEGOTIATION_CREATED : NotificationType.MEETING_CREATED
      );

      return negotiation;
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
  getById: protectedProcedure
    .input(z.object({ negotiationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [user, negotiation] = await Promise.all([
        ctx.db.user.findUnique({
          where: { id: ctx.auth.userId },
          select: {
            userType: true,
            entrepreneur: { select: { id: true } },
            incubator: { select: { id: true, userId: true } },
            investor: { select: { id: true, userId: true } },
            vcGroup: { select: { id: true, userId: true } },
          },
        }),
        ctx.db.negotiation.findUnique({
          where: { id: input.negotiationId },
          include: {
            project: {
              include: {
                Entrepreneur: {
                  select: {
                    id: true,
                    userId: true,
                    firstName: true,
                    lastName: true,
                    photo: true,
                    user: { select: { email: true } },
                  },
                },
                Incubator: {
                  select: {
                    id: true,
                    userId: true,
                    name: true,
                    logo: true,
                    email: true,
                  },
                },
                country: true,
                sector: true,
                state: true,
              },
            },
            investor: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
                photo: true,
                about: true,
              },
            },
            VcGroup: {
              select: {
                userId: true,
                name: true,
                logo: true,
                description: true,
              },
            },
            meetings: {
              orderBy: { startDate: 'desc' },
              take: 50,
            },
            files: {
              orderBy: { createdAt: 'desc' },
              take: 100,
            },
          },
        }),
      ]);

      if (!negotiation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Negotiation not found' });
      }

      const isEntrepreneurSide =
        user?.userType === UserType.ENTREPRENEUR || user?.userType === UserType.INCUBATOR;

      if (isEntrepreneurSide) {
        const isOwner =
          negotiation.project.Entrepreneur?.userId === ctx.auth.userId ||
          negotiation.project.Incubator?.userId === ctx.auth.userId;
        if (!isOwner) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
      } else {
        const isParticipant =
          negotiation.investor?.userId === ctx.auth.userId ||
          negotiation.VcGroup?.userId === ctx.auth.userId;
        if (!isParticipant) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
      }

      return { negotiation, userType: user?.userType };
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
            investorActionNeeded: false,
            entrepreneurActionNeeded: false,
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
  addDocument: protectedProcedure
    .input(
      z.object({
        negotiationId: z.string(),
        name: z.string(),
        type: z.string(),
        size: z.number(),
        url: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertNegotiationParticipant(ctx.db, input.negotiationId, ctx.auth.userId);

      const file = await ctx.db.file.create({
        data: {
          name: input.name,
          type: input.type,
          size: input.size,
          url: input.url,
          negotiationId: input.negotiationId,
          uploadedBy: ctx.auth.userId,
        },
      });
      return file;
    }),
  removeDocument: protectedProcedure
    .input(z.object({ fileId: z.string(), negotiationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertNegotiationParticipant(ctx.db, input.negotiationId, ctx.auth.userId);

      await ctx.db.file.delete({
        where: { id: input.fileId, negotiationId: input.negotiationId },
      });
    }),
});

async function assertNegotiationParticipant(
  db: PrismaClient,
  negotiationId: string,
  userId: string
) {
  // Use a single count query: check if this negotiation exists AND the user
  // is one of its participants (investor, VC group owner, entrepreneur, or incubator).
  const count = await db.negotiation.count({
    where: {
      id: negotiationId,
      OR: [
        { investor: { userId } },
        { VcGroup: { userId } },
        { project: { Entrepreneur: { userId } } },
        { project: { Incubator: { userId } } },
      ],
    },
  });

  if (count === 0) {
    // Distinguish 404 from 403 to avoid leaking negotiation existence
    const exists = await db.negotiation.count({ where: { id: negotiationId } });
    if (exists === 0) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Negotiation not found' });
    }
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
  }
}

async function scheduleMeeting(
  db: PrismaClient,
  date: Date,
  entrepreneurId: string | null,
  incubatorId: string | null,
  investorIds: string[],
  vcGroupIds: string[],
  negotiationId: string,
  instantMeeting?: boolean
) {
  const now = new Date();

  if (!instantMeeting && date < now) {
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
