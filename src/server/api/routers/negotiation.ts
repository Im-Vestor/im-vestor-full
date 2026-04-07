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

  // Phase 1: Investment Amount Proposal & Acceptance
  proposeInvestmentAmount: protectedProcedure
    .input(
      z.object({
        negotiationId: z.string(),
        amount: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertNegotiationParticipant(ctx.db, input.negotiationId, ctx.auth.userId);

      // Get negotiation with user info
      const negotiation = await ctx.db.negotiation.findUniqueOrThrow({
        where: { id: input.negotiationId },
        include: {
          investor: true,
          VcGroup: true,
          project: {
            include: {
              Entrepreneur: true,
            },
          },
        },
      });

      // Verify user is investor or VC group owner
      const isInvestor = negotiation.investor?.userId === ctx.auth.userId;
      const isVcGroup = negotiation.VcGroup?.userId === ctx.auth.userId;

      if (!isInvestor && !isVcGroup) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only investors can propose investment amounts',
        });
      }

      // Update negotiation
      const updated = await ctx.db.negotiation.update({
        where: { id: input.negotiationId },
        data: {
          agreedInvestmentAmount: input.amount,
          investmentAmountProposedAt: new Date(),
          investmentAmountProposedBy: ctx.auth.userId,
          investmentAmountAcceptedAt: null, // Reset acceptance if re-proposing
        },
      });

      // Send email to entrepreneur
      const entrepreneur = negotiation.project.Entrepreneur;
      if (entrepreneur) {
        const entrepreneurUser = await ctx.db.user.findUnique({
          where: { id: entrepreneur.userId },
          select: { email: true },
        });

        const investorName =
          negotiation.investor?.firstName ?? negotiation.VcGroup?.name ?? 'Investor';

        if (entrepreneurUser?.email) {
          void sendEmail(
            entrepreneur.firstName,
            `${investorName} has proposed an investment amount of $${input.amount.toLocaleString()} for your project ${negotiation.project.name}.`,
            'Please review and accept or reject this proposal in the negotiation page.',
            [entrepreneurUser.email],
            'Investment Amount Proposed',
            `${process.env.NEXT_PUBLIC_BASE_URL}/negotiations/${negotiation.id}`,
            'View Negotiation'
          );
        }
      }

      return updated;
    }),

  acceptInvestmentAmount: protectedProcedure
    .input(z.object({ negotiationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertNegotiationParticipant(ctx.db, input.negotiationId, ctx.auth.userId);

      // Get negotiation with user info
      const negotiation = await ctx.db.negotiation.findUniqueOrThrow({
        where: { id: input.negotiationId },
        include: {
          investor: true,
          VcGroup: true,
          project: {
            include: {
              Entrepreneur: true,
            },
          },
        },
      });

      // Verify user is entrepreneur
      const isEntrepreneur = negotiation.project.Entrepreneur?.userId === ctx.auth.userId;

      if (!isEntrepreneur) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only entrepreneurs can accept investment amounts',
        });
      }

      // Verify amount has been proposed
      if (!negotiation.agreedInvestmentAmount || !negotiation.investmentAmountProposedAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No investment amount has been proposed yet',
        });
      }

      // Update negotiation
      const updated = await ctx.db.negotiation.update({
        where: { id: input.negotiationId },
        data: {
          investmentAmountAcceptedAt: new Date(),
        },
      });

      // Send email to investor
      const investor = negotiation.investor;
      const vcGroup = negotiation.VcGroup;
      const entrepreneur = negotiation.project.Entrepreneur;

      if (investor && entrepreneur) {
        const investorUser = await ctx.db.user.findUnique({
          where: { id: investor.userId },
          select: { email: true },
        });

        if (investorUser?.email) {
          void sendEmail(
            investor.firstName,
            `${entrepreneur.firstName} has accepted your proposed investment amount of $${negotiation.agreedInvestmentAmount.toNumber().toLocaleString()}.`,
            'You can now proceed with uploading the investment contract.',
            [investorUser.email],
            'Investment Amount Accepted',
            `${process.env.NEXT_PUBLIC_BASE_URL}/negotiations/${negotiation.id}`,
            'View Negotiation'
          );
        }
      } else if (vcGroup && entrepreneur) {
        const vcUser = await ctx.db.user.findUnique({
          where: { id: vcGroup.userId },
          select: { email: true },
        });

        if (vcUser?.email) {
          void sendEmail(
            vcGroup.name,
            `${entrepreneur.firstName} has accepted your proposed investment amount of $${negotiation.agreedInvestmentAmount.toNumber().toLocaleString()}.`,
            'You can now proceed with uploading the investment contract.',
            [vcUser.email],
            'Investment Amount Accepted',
            `${process.env.NEXT_PUBLIC_BASE_URL}/negotiations/${negotiation.id}`,
            'View Negotiation'
          );
        }
      }

      return updated;
    }),

  rejectInvestmentAmount: protectedProcedure
    .input(
      z.object({
        negotiationId: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertNegotiationParticipant(ctx.db, input.negotiationId, ctx.auth.userId);

      // Get negotiation with user info
      const negotiation = await ctx.db.negotiation.findUniqueOrThrow({
        where: { id: input.negotiationId },
        include: {
          investor: { include: { user: true } },
          VcGroup: { include: { user: true } },
          project: {
            include: {
              Entrepreneur: { include: { user: true } },
            },
          },
        },
      });

      // Verify user is entrepreneur
      const isEntrepreneur = negotiation.project.Entrepreneur?.userId === ctx.auth.userId;

      if (!isEntrepreneur) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only entrepreneurs can reject investment amounts',
        });
      }

      // Verify amount has been proposed
      if (!negotiation.agreedInvestmentAmount || !negotiation.investmentAmountProposedAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No investment amount has been proposed yet',
        });
      }

      // Reset investment amount fields
      const updated = await ctx.db.negotiation.update({
        where: { id: input.negotiationId },
        data: {
          agreedInvestmentAmount: null,
          investmentAmountProposedAt: null,
          investmentAmountProposedBy: null,
          investmentAmountAcceptedAt: null,
        },
      });

      // Send email to investor
      const investorEmail = negotiation.investor?.user.email ?? negotiation.VcGroup?.email;
      const investorName =
        negotiation.investor?.firstName ?? negotiation.VcGroup?.name ?? 'Investor';
      const entrepreneurName = negotiation.project.Entrepreneur?.firstName ?? 'Entrepreneur';

      if (investorEmail) {
        void sendEmail(
          investorName,
          `${entrepreneurName} has rejected your proposed investment amount of $${negotiation.agreedInvestmentAmount.toNumber().toLocaleString()}.`,
          input.reason
            ? `Reason: ${input.reason}. You can propose a new amount in the negotiation page.`
            : 'You can propose a new amount in the negotiation page.',
          [investorEmail],
          'Investment Amount Rejected',
          `${process.env.NEXT_PUBLIC_BASE_URL}/negotiations/${negotiation.id}`,
          'View Negotiation'
        );
      }

      return updated;
    }),

  updateInvestmentAmount: protectedProcedure
    .input(
      z.object({
        negotiationId: z.string(),
        newAmount: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertNegotiationParticipant(ctx.db, input.negotiationId, ctx.auth.userId);

      // Get negotiation with user info
      const negotiation = await ctx.db.negotiation.findUniqueOrThrow({
        where: { id: input.negotiationId },
        include: {
          investor: { include: { user: true } },
          VcGroup: { include: { user: true } },
          project: {
            include: {
              Entrepreneur: { include: { user: true } },
            },
          },
        },
      });

      // Verify user is investor or VC group owner
      const isInvestor = negotiation.investor?.userId === ctx.auth.userId;
      const isVcGroup = negotiation.VcGroup?.userId === ctx.auth.userId;

      if (!isInvestor && !isVcGroup) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only investors can update investment amounts',
        });
      }

      // Verify amount hasn't been accepted yet
      if (negotiation.investmentAmountAcceptedAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot update investment amount after it has been accepted',
        });
      }

      // Update negotiation
      const updated = await ctx.db.negotiation.update({
        where: { id: input.negotiationId },
        data: {
          agreedInvestmentAmount: input.newAmount,
          investmentAmountProposedAt: new Date(),
          investmentAmountProposedBy: ctx.auth.userId,
        },
      });

      // Send email to entrepreneur
      const entrepreneurEmail = negotiation.project.Entrepreneur?.user.email;
      const entrepreneurName = negotiation.project.Entrepreneur?.firstName ?? 'Entrepreneur';
      const investorName =
        negotiation.investor?.firstName ?? negotiation.VcGroup?.name ?? 'Investor';

      if (entrepreneurEmail) {
        void sendEmail(
          entrepreneurName,
          `${investorName} has updated their investment amount proposal to $${input.newAmount.toLocaleString()} for your project ${negotiation.project.name}.`,
          'Please review and accept or reject this updated proposal in the negotiation page.',
          [entrepreneurEmail],
          `Investment Amount Updated: $${input.newAmount.toLocaleString()}`,
          `${process.env.NEXT_PUBLIC_BASE_URL}/negotiations/${negotiation.id}`,
          'View Negotiation'
        );
      }

      return updated;
    }),

  // Phase 2: Contract Upload & Counter-Signature
  uploadInvestorContract: protectedProcedure
    .input(
      z.object({
        negotiationId: z.string(),
        fileName: z.string(),
        fileUrl: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertNegotiationParticipant(ctx.db, input.negotiationId, ctx.auth.userId);

      // Get negotiation
      const negotiation = await ctx.db.negotiation.findUniqueOrThrow({
        where: { id: input.negotiationId },
        include: {
          investor: true,
          VcGroup: true,
          project: {
            include: {
              Entrepreneur: true,
            },
          },
        },
      });

      // Verify user is investor or VC group owner
      const isInvestor = negotiation.investor?.userId === ctx.auth.userId;
      const isVcGroup = negotiation.VcGroup?.userId === ctx.auth.userId;

      if (!isInvestor && !isVcGroup) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only investors can upload contracts',
        });
      }

      // Verify investment amount has been accepted
      if (!negotiation.investmentAmountAcceptedAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot upload contract until investment amount is accepted',
        });
      }

      // Update negotiation
      const updated = await ctx.db.negotiation.update({
        where: { id: input.negotiationId },
        data: {
          investorContractUrl: input.fileUrl,
          contractUploadedByInvestor: true,
          investorContractUploadedAt: new Date(),
        },
      });

      // Create file record
      await ctx.db.file.create({
        data: {
          name: input.fileName,
          type: 'application/pdf',
          size: 0, // Size not tracked in this flow
          url: input.fileUrl,
          negotiationId: input.negotiationId,
          uploadedBy: ctx.auth.userId,
          fileType: 'INVESTOR_CONTRACT',
        },
      });

      // Send email to entrepreneur
      const entrepreneur = negotiation.project.Entrepreneur;
      if (entrepreneur) {
        const entrepreneurUser = await ctx.db.user.findUnique({
          where: { id: entrepreneur.userId },
          select: { email: true },
        });

        const investorName =
          negotiation.investor?.firstName ?? negotiation.VcGroup?.name ?? 'Investor';

        if (entrepreneurUser?.email) {
          void sendEmail(
            entrepreneur.firstName,
            `${investorName} has uploaded the investment contract for your project ${negotiation.project.name}.`,
            'Please review the contract, sign it, and upload your signed version.',
            [entrepreneurUser.email],
            'Investment Contract Uploaded',
            `${process.env.NEXT_PUBLIC_BASE_URL}/negotiations/${negotiation.id}`,
            'View Contract'
          );
        }
      }

      return updated;
    }),

  uploadEntrepreneurContract: protectedProcedure
    .input(
      z.object({
        negotiationId: z.string(),
        fileName: z.string(),
        fileUrl: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertNegotiationParticipant(ctx.db, input.negotiationId, ctx.auth.userId);

      // Get negotiation
      const negotiation = await ctx.db.negotiation.findUniqueOrThrow({
        where: { id: input.negotiationId },
        include: {
          investor: true,
          VcGroup: true,
          project: {
            include: {
              Entrepreneur: true,
            },
          },
        },
      });

      // Verify user is entrepreneur
      const isEntrepreneur = negotiation.project.Entrepreneur?.userId === ctx.auth.userId;

      if (!isEntrepreneur) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only entrepreneurs can upload entrepreneur contracts',
        });
      }

      // Verify investor has uploaded first
      if (!negotiation.contractUploadedByInvestor) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot upload entrepreneur contract until investor uploads their contract',
        });
      }

      // Block if both already uploaded (no re-uploads)
      if (negotiation.contractUploadedByEntrepreneur) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Contract already uploaded. Re-uploads are not allowed.',
        });
      }

      // Update negotiation
      const updated = await ctx.db.negotiation.update({
        where: { id: input.negotiationId },
        data: {
          entrepreneurContractUrl: input.fileUrl,
          contractUploadedByEntrepreneur: true,
          entrepreneurContractUploadedAt: new Date(),
        },
      });

      // Create file record
      await ctx.db.file.create({
        data: {
          name: input.fileName,
          type: 'application/pdf',
          size: 0,
          url: input.fileUrl,
          negotiationId: input.negotiationId,
          uploadedBy: ctx.auth.userId,
          fileType: 'ENTREPRENEUR_CONTRACT',
        },
      });

      // Send emails - both to investor and entrepreneur (fully executed notification)
      const entrepreneur = negotiation.project.Entrepreneur;
      const investor = negotiation.investor;
      const vcGroup = negotiation.VcGroup;

      const entrepreneurName = entrepreneur?.firstName ?? 'Entrepreneur';

      // Email to investor
      if (investor && entrepreneur) {
        const investorUser = await ctx.db.user.findUnique({
          where: { id: investor.userId },
          select: { email: true },
        });

        if (investorUser?.email) {
          void sendEmail(
            investor.firstName,
            `${entrepreneurName} has uploaded the signed contract for ${negotiation.project.name}.`,
            'The contract is now fully executed. You can proceed with the completion confirmation.',
            [investorUser.email],
            'Contract Fully Executed',
            `${process.env.NEXT_PUBLIC_BASE_URL}/negotiations/${negotiation.id}`,
            'View Negotiation'
          );
        }
      } else if (vcGroup && entrepreneur) {
        const vcUser = await ctx.db.user.findUnique({
          where: { id: vcGroup.userId },
          select: { email: true },
        });

        if (vcUser?.email) {
          void sendEmail(
            vcGroup.name,
            `${entrepreneurName} has uploaded the signed contract for ${negotiation.project.name}.`,
            'The contract is now fully executed. You can proceed with the completion confirmation.',
            [vcUser.email],
            'Contract Fully Executed',
            `${process.env.NEXT_PUBLIC_BASE_URL}/negotiations/${negotiation.id}`,
            'View Negotiation'
          );
        }
      }

      return updated;
    }),

  getContractDownloadUrl: protectedProcedure
    .input(
      z.object({
        negotiationId: z.string(),
        contractType: z.enum(['INVESTOR', 'ENTREPRENEUR']),
      })
    )
    .query(async ({ ctx, input }) => {
      await assertNegotiationParticipant(ctx.db, input.negotiationId, ctx.auth.userId);

      const negotiation = await ctx.db.negotiation.findUniqueOrThrow({
        where: { id: input.negotiationId },
        select: {
          investorContractUrl: true,
          entrepreneurContractUrl: true,
        },
      });

      const url =
        input.contractType === 'INVESTOR'
          ? negotiation.investorContractUrl
          : negotiation.entrepreneurContractUrl;

      if (!url) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contract not found',
        });
      }

      // Return the URL directly (it's already a public R2 URL)
      // In production, you might want to generate a pre-signed URL with expiration
      return { url };
    }),

  getContractStatus: protectedProcedure
    .input(z.object({ negotiationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertNegotiationParticipant(ctx.db, input.negotiationId, ctx.auth.userId);

      const negotiation = await ctx.db.negotiation.findUniqueOrThrow({
        where: { id: input.negotiationId },
        select: {
          contractUploadedByInvestor: true,
          contractUploadedByEntrepreneur: true,
        },
      });

      if (!negotiation.contractUploadedByInvestor) {
        return { status: 'NONE' as const };
      }

      if (!negotiation.contractUploadedByEntrepreneur) {
        return { status: 'INVESTOR_UPLOADED' as const };
      }

      return { status: 'FULLY_EXECUTED' as const };
    }),

  // Phase 3: Dual Completion Confirmation
  confirmCompletion: protectedProcedure
    .input(z.object({ negotiationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertNegotiationParticipant(ctx.db, input.negotiationId, ctx.auth.userId);

      // Get negotiation
      const negotiation = await ctx.db.negotiation.findUniqueOrThrow({
        where: { id: input.negotiationId },
        include: {
          investor: true,
          VcGroup: true,
          project: {
            include: {
              Entrepreneur: true,
            },
          },
        },
      });

      // Determine user type
      const isInvestor = negotiation.investor?.userId === ctx.auth.userId;
      const isVcGroup = negotiation.VcGroup?.userId === ctx.auth.userId;
      const isEntrepreneur = negotiation.project.Entrepreneur?.userId === ctx.auth.userId;

      // Verify prerequisites
      if (!negotiation.investmentAmountAcceptedAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot confirm completion until investment amount is accepted',
        });
      }

      if (!negotiation.contractUploadedByInvestor || !negotiation.contractUploadedByEntrepreneur) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot confirm completion until both contracts are uploaded',
        });
      }

      // Update appropriate confirmation timestamp
      const updateData: {
        investorCompletionConfirmedAt?: Date;
        entrepreneurCompletionConfirmedAt?: Date;
      } = {};

      if (isInvestor || isVcGroup) {
        updateData.investorCompletionConfirmedAt = new Date();
      } else if (isEntrepreneur) {
        updateData.entrepreneurCompletionConfirmedAt = new Date();
      }

      const updated = await ctx.db.negotiation.update({
        where: { id: input.negotiationId },
        data: updateData,
      });

      // Check if both have now confirmed
      const bothConfirmed =
        (updated.investorCompletionConfirmedAt !== null ||
          updateData.investorCompletionConfirmedAt !== undefined) &&
        (updated.entrepreneurCompletionConfirmedAt !== null ||
          updateData.entrepreneurCompletionConfirmedAt !== undefined);

      // Send emails
      const entrepreneur = negotiation.project.Entrepreneur;
      const investor = negotiation.investor;
      const vcGroup = negotiation.VcGroup;

      if (isInvestor || isVcGroup) {
        // Investor confirmed - notify entrepreneur
        if (entrepreneur) {
          const entrepreneurUser = await ctx.db.user.findUnique({
            where: { id: entrepreneur.userId },
            select: { email: true },
          });

          const investorName = investor?.firstName ?? vcGroup?.name ?? 'Investor';

          if (entrepreneurUser?.email) {
            void sendEmail(
              entrepreneur.firstName,
              bothConfirmed
                ? 'Both parties have confirmed completion. The payment link will be generated shortly.'
                : `${investorName} has confirmed completion and is ready to proceed to payment.`,
              bothConfirmed
                ? 'The payment process will begin automatically.'
                : 'Please confirm your completion to generate the payment link.',
              [entrepreneurUser.email],
              bothConfirmed ? 'Both Parties Confirmed' : 'Investor Confirmed Completion',
              `${process.env.NEXT_PUBLIC_BASE_URL}/negotiations/${negotiation.id}`,
              'View Negotiation'
            );
          }
        }
      } else if (isEntrepreneur) {
        // Entrepreneur confirmed - notify investor
        if (investor) {
          const investorUser = await ctx.db.user.findUnique({
            where: { id: investor.userId },
            select: { email: true },
          });

          if (investorUser?.email) {
            void sendEmail(
              investor.firstName,
              bothConfirmed
                ? 'Both parties have confirmed completion. The payment link will be generated shortly.'
                : `${entrepreneur?.firstName ?? 'Entrepreneur'} has confirmed completion and is ready to proceed to payment.`,
              bothConfirmed
                ? 'You will receive the payment link in a separate email.'
                : 'Please confirm your completion to generate the payment link.',
              [investorUser.email],
              bothConfirmed ? 'Both Parties Confirmed' : 'Entrepreneur Confirmed Completion',
              `${process.env.NEXT_PUBLIC_BASE_URL}/negotiations/${negotiation.id}`,
              'View Negotiation'
            );
          }
        } else if (vcGroup) {
          const vcUser = await ctx.db.user.findUnique({
            where: { id: vcGroup.userId },
            select: { email: true },
          });

          if (vcUser?.email) {
            void sendEmail(
              vcGroup.name,
              bothConfirmed
                ? 'Both parties have confirmed completion. The payment link will be generated shortly.'
                : `${entrepreneur?.firstName ?? 'Entrepreneur'} has confirmed completion and is ready to proceed to payment.`,
              bothConfirmed
                ? 'You will receive the payment link in a separate email.'
                : 'Please confirm your completion to generate the payment link.',
              [vcUser.email],
              bothConfirmed ? 'Both Parties Confirmed' : 'Entrepreneur Confirmed Completion',
              `${process.env.NEXT_PUBLIC_BASE_URL}/negotiations/${negotiation.id}`,
              'View Negotiation'
            );
          }
        }
      }

      return { ...updated, bothConfirmed };
    }),

  revertCompletion: protectedProcedure
    .input(z.object({ negotiationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertNegotiationParticipant(ctx.db, input.negotiationId, ctx.auth.userId);

      // Get negotiation
      const negotiation = await ctx.db.negotiation.findUniqueOrThrow({
        where: { id: input.negotiationId },
        include: {
          investor: true,
          VcGroup: true,
          project: {
            include: {
              Entrepreneur: true,
            },
          },
        },
      });

      // Reset BOTH timestamps (per requirements)
      const updated = await ctx.db.negotiation.update({
        where: { id: input.negotiationId },
        data: {
          investorCompletionConfirmedAt: null,
          entrepreneurCompletionConfirmedAt: null,
        },
      });

      // Send emails to both parties
      const entrepreneur = negotiation.project.Entrepreneur;
      const investor = negotiation.investor;
      const vcGroup = negotiation.VcGroup;

      const isInvestor = negotiation.investor?.userId === ctx.auth.userId;
      const isVcGroup = negotiation.VcGroup?.userId === ctx.auth.userId;
      const reverterName = isInvestor
        ? investor?.firstName
        : isVcGroup
          ? vcGroup?.name
          : (entrepreneur?.firstName ?? 'A party');

      // Email to entrepreneur
      if (entrepreneur) {
        const entrepreneurUser = await ctx.db.user.findUnique({
          where: { id: entrepreneur.userId },
          select: { email: true },
        });

        if (entrepreneurUser?.email) {
          void sendEmail(
            entrepreneur.firstName,
            `${reverterName} has reverted their completion confirmation for ${negotiation.project.name}.`,
            'Both completion confirmations have been reset. You will need to re-confirm when ready.',
            [entrepreneurUser.email],
            'Completion Confirmation Reverted',
            `${process.env.NEXT_PUBLIC_BASE_URL}/negotiations/${negotiation.id}`,
            'View Negotiation'
          );
        }
      }

      // Email to investor/VC
      if (investor) {
        const investorUser = await ctx.db.user.findUnique({
          where: { id: investor.userId },
          select: { email: true },
        });

        if (investorUser?.email) {
          void sendEmail(
            investor.firstName,
            `${reverterName} has reverted their completion confirmation for ${negotiation.project.name}.`,
            'Both completion confirmations have been reset. You will need to re-confirm when ready.',
            [investorUser.email],
            'Completion Confirmation Reverted',
            `${process.env.NEXT_PUBLIC_BASE_URL}/negotiations/${negotiation.id}`,
            'View Negotiation'
          );
        }
      } else if (vcGroup) {
        const vcUser = await ctx.db.user.findUnique({
          where: { id: vcGroup.userId },
          select: { email: true },
        });

        if (vcUser?.email) {
          void sendEmail(
            vcGroup.name,
            `${reverterName} has reverted their completion confirmation for ${negotiation.project.name}.`,
            'Both completion confirmations have been reset. You will need to re-confirm when ready.',
            [vcUser.email],
            'Completion Confirmation Reverted',
            `${process.env.NEXT_PUBLIC_BASE_URL}/negotiations/${negotiation.id}`,
            'View Negotiation'
          );
        }
      }

      return updated;
    }),

  getCompletionStatus: protectedProcedure
    .input(z.object({ negotiationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertNegotiationParticipant(ctx.db, input.negotiationId, ctx.auth.userId);

      const negotiation = await ctx.db.negotiation.findUniqueOrThrow({
        where: { id: input.negotiationId },
        select: {
          investorCompletionConfirmedAt: true,
          entrepreneurCompletionConfirmedAt: true,
        },
      });

      const investorConfirmed = negotiation.investorCompletionConfirmedAt !== null;
      const entrepreneurConfirmed = negotiation.entrepreneurCompletionConfirmedAt !== null;

      if (!investorConfirmed && !entrepreneurConfirmed) {
        return { status: 'NONE' as const };
      }

      if (investorConfirmed && !entrepreneurConfirmed) {
        return { status: 'INVESTOR_CONFIRMED' as const };
      }

      if (!investorConfirmed && entrepreneurConfirmed) {
        return { status: 'ENTREPRENEUR_CONFIRMED' as const };
      }

      return { status: 'BOTH_CONFIRMED' as const };
    }),

  // Phase 4: Stripe Payment Generation & Checkout
  getPaymentCheckoutUrl: protectedProcedure
    .input(z.object({ negotiationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertNegotiationParticipant(ctx.db, input.negotiationId, ctx.auth.userId);

      const negotiation = await ctx.db.negotiation.findUniqueOrThrow({
        where: { id: input.negotiationId },
        select: {
          stripeCheckoutSessionId: true,
          paymentStatus: true,
        },
      });

      // If no checkout session exists yet, return null
      // Frontend will trigger creation via API route
      if (!negotiation.stripeCheckoutSessionId) {
        return { url: null, status: negotiation.paymentStatus };
      }

      // In production, you'd retrieve the session from Stripe to get the URL
      // For now, return a placeholder
      return {
        url: `/api/stripe/checkout/escrow`,
        status: negotiation.paymentStatus,
      };
    }),

  // Phase 5: Admin Receipt Upload
  uploadPaymentReceipt: protectedProcedure
    .input(
      z.object({
        negotiationId: z.string(),
        fileName: z.string(),
        fileUrl: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {

      // Get negotiation
      const negotiation = await ctx.db.negotiation.findUniqueOrThrow({
        where: { id: input.negotiationId },
        include: {
          project: {
            include: {
              Entrepreneur: true,
            },
          },
        },
      });

      // Verify payment has been received
      if (negotiation.paymentStatus !== 'PAYMENT_RECEIVED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot upload receipt until payment is received',
        });
      }

      // Update negotiation
      const updated = await ctx.db.negotiation.update({
        where: { id: input.negotiationId },
        data: {
          receiptUrl: input.fileUrl,
          receiptUploadedAt: new Date(),
          receiptUploadedBy: ctx.auth.userId,
          paymentStatus: 'RECEIPT_UPLOADED',
        },
      });

      // Create file record
      await ctx.db.file.create({
        data: {
          name: input.fileName,
          type: 'application/pdf',
          size: 0,
          url: input.fileUrl,
          negotiationId: input.negotiationId,
          uploadedBy: ctx.auth.userId,
          fileType: 'PAYMENT_RECEIPT',
        },
      });

      // Send email to entrepreneur
      const entrepreneur = negotiation.project.Entrepreneur;
      if (entrepreneur) {
        const entrepreneurUser = await ctx.db.user.findUnique({
          where: { id: entrepreneur.userId },
          select: { email: true },
        });

        if (entrepreneurUser?.email) {
          void sendEmail(
            entrepreneur.firstName,
            'ImVestor has transferred the investment funds to your account.',
            'Please review the payment receipt and confirm that you have received the funds.',
            [entrepreneurUser.email],
            'Payment Receipt Available',
            `${process.env.NEXT_PUBLIC_BASE_URL}/negotiations/${negotiation.id}`,
            'View Receipt'
          );
        }
      }

      return updated;
    }),

  // Phase 6: Entrepreneur Confirmation & Completion
  confirmFundsReceived: protectedProcedure
    .input(z.object({ negotiationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertNegotiationParticipant(ctx.db, input.negotiationId, ctx.auth.userId);

      // Get negotiation
      const negotiation = await ctx.db.negotiation.findUniqueOrThrow({
        where: { id: input.negotiationId },
        include: {
          investor: true,
          VcGroup: true,
          project: {
            include: {
              Entrepreneur: true,
            },
          },
        },
      });

      // Verify user is entrepreneur
      const isEntrepreneur = negotiation.project.Entrepreneur?.userId === ctx.auth.userId;

      if (!isEntrepreneur) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only entrepreneurs can confirm funds received',
        });
      }

      // Verify receipt has been uploaded
      if (negotiation.paymentStatus !== 'RECEIPT_UPLOADED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot confirm funds until receipt is uploaded',
        });
      }

      // Update negotiation - mark as complete!
      const updated = await ctx.db.negotiation.update({
        where: { id: input.negotiationId },
        data: {
          fundsConfirmedByEntrepreneur: true,
          fundsConfirmedAt: new Date(),
          paymentStatus: 'FUNDS_CONFIRMED',
          stage: NegotiationStage.CLOSED, // Final stage!
        },
      });

      // Send final emails to all parties
      const entrepreneur = negotiation.project.Entrepreneur;
      const investor = negotiation.investor;
      const vcGroup = negotiation.VcGroup;

      // Email to entrepreneur (summary)
      if (entrepreneur) {
        const entrepreneurUser = await ctx.db.user.findUnique({
          where: { id: entrepreneur.userId },
          select: { email: true },
        });

        if (entrepreneurUser?.email) {
          void sendEmail(
            entrepreneur.firstName,
            `Congratulations! Your deal for ${negotiation.project.name} is now complete.`,
            `You have successfully received $${negotiation.paymentAmount?.toNumber().toLocaleString() ?? negotiation.agreedInvestmentAmount?.toNumber().toLocaleString()} from the investor. All documents are available in the negotiation page.`,
            [entrepreneurUser.email],
            'Deal Completed!',
            `${process.env.NEXT_PUBLIC_BASE_URL}/negotiations/${negotiation.id}`,
            'View Deal Summary'
          );
        }
      }

      // Email to investor
      if (investor) {
        const investorUser = await ctx.db.user.findUnique({
          where: { id: investor.userId },
          select: { email: true },
        });

        if (investorUser?.email) {
          void sendEmail(
            investor.firstName,
            `Deal completed! ${entrepreneur?.firstName ?? 'Entrepreneur'} has confirmed receipt of funds for ${negotiation.project.name}.`,
            'The investment deal is now fully closed. Thank you for using ImVestor.',
            [investorUser.email],
            'Deal Completed',
            `${process.env.NEXT_PUBLIC_BASE_URL}/negotiations/${negotiation.id}`,
            'View Deal Summary'
          );
        }
      } else if (vcGroup) {
        const vcUser = await ctx.db.user.findUnique({
          where: { id: vcGroup.userId },
          select: { email: true },
        });

        if (vcUser?.email) {
          void sendEmail(
            vcGroup.name,
            `Deal completed! ${entrepreneur?.firstName ?? 'Entrepreneur'} has confirmed receipt of funds for ${negotiation.project.name}.`,
            'The investment deal is now fully closed. Thank you for using ImVestor.',
            [vcUser.email],
            'Deal Completed',
            `${process.env.NEXT_PUBLIC_BASE_URL}/negotiations/${negotiation.id}`,
            'View Deal Summary'
          );
        }
      }

      return updated;
    }),

  getNegotiationTimeline: protectedProcedure
    .input(z.object({ negotiationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertNegotiationParticipant(ctx.db, input.negotiationId, ctx.auth.userId);

      const negotiation = await ctx.db.negotiation.findUniqueOrThrow({
        where: { id: input.negotiationId },
        include: {
          investor: true,
          VcGroup: true,
          project: {
            include: {
              Entrepreneur: true,
            },
          },
        },
      });

      // Compile timeline events
      const events: Array<{
        date: Date;
        actor: string;
        action: string;
        metadata?: Record<string, any>;
      }> = [];

      // Phase 1: Investment Amount
      if (negotiation.investmentAmountProposedAt) {
        events.push({
          date: negotiation.investmentAmountProposedAt,
          actor: negotiation.investor?.firstName ?? negotiation.VcGroup?.name ?? 'Investor',
          action: `Proposed investment amount: $${negotiation.agreedInvestmentAmount?.toNumber().toLocaleString()}`,
        });
      }

      if (negotiation.investmentAmountAcceptedAt) {
        events.push({
          date: negotiation.investmentAmountAcceptedAt,
          actor: negotiation.project.Entrepreneur?.firstName ?? 'Entrepreneur',
          action: 'Accepted investment amount',
        });
      }

      // Phase 2: Contracts
      if (negotiation.investorContractUploadedAt) {
        events.push({
          date: negotiation.investorContractUploadedAt,
          actor: negotiation.investor?.firstName ?? negotiation.VcGroup?.name ?? 'Investor',
          action: 'Uploaded investment contract',
          metadata: { url: negotiation.investorContractUrl },
        });
      }

      if (negotiation.entrepreneurContractUploadedAt) {
        events.push({
          date: negotiation.entrepreneurContractUploadedAt,
          actor: negotiation.project.Entrepreneur?.firstName ?? 'Entrepreneur',
          action: 'Uploaded signed contract',
          metadata: { url: negotiation.entrepreneurContractUrl },
        });
      }

      // Phase 3: Completion Confirmation
      if (negotiation.investorCompletionConfirmedAt) {
        events.push({
          date: negotiation.investorCompletionConfirmedAt,
          actor: negotiation.investor?.firstName ?? negotiation.VcGroup?.name ?? 'Investor',
          action: 'Confirmed completion',
        });
      }

      if (negotiation.entrepreneurCompletionConfirmedAt) {
        events.push({
          date: negotiation.entrepreneurCompletionConfirmedAt,
          actor: negotiation.project.Entrepreneur?.firstName ?? 'Entrepreneur',
          action: 'Confirmed completion',
        });
      }

      // Phase 4: Payment
      if (negotiation.paidAt) {
        events.push({
          date: negotiation.paidAt,
          actor: negotiation.investor?.firstName ?? negotiation.VcGroup?.name ?? 'Investor',
          action: `Paid $${negotiation.paymentAmount?.toNumber().toLocaleString()} via Stripe`,
          metadata: {
            paymentIntentId: negotiation.stripePaymentIntentId,
            amount: negotiation.paymentAmount?.toNumber(),
          },
        });
      }

      // Phase 5: Receipt
      if (negotiation.receiptUploadedAt) {
        events.push({
          date: negotiation.receiptUploadedAt,
          actor: 'ImVestor Admin',
          action: 'Uploaded payment receipt',
          metadata: { url: negotiation.receiptUrl },
        });
      }

      // Phase 6: Final Confirmation
      if (negotiation.fundsConfirmedAt) {
        events.push({
          date: negotiation.fundsConfirmedAt,
          actor: negotiation.project.Entrepreneur?.firstName ?? 'Entrepreneur',
          action: 'Confirmed receipt of funds',
        });
      }

      // Sort by date
      events.sort((a, b) => a.date.getTime() - b.date.getTime());

      return { events, negotiation };
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
