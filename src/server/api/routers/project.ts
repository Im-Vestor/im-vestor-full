import {
  Currency,
  NotificationType,
  type Prisma,
  ProjectStage,
  ProjectStatus,
  ProjectVisibility,
} from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { sendEmail } from '~/utils/email';

export const projectRouter = createTRPCRouter({
  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return ctx.db.project.findUniqueOrThrow({
      where: { id: input.id, status: ProjectStatus.ACTIVE },
      include: {
        sector: true,
        Entrepreneur: {
          include: {
            state: true,
            country: true,
            user: {
              select: {
                availableBoosts: true,
              },
            },
          },
        },
        knowYourNumbers: {
          include: {
            answers: true,
          },
        },
        files: true,
        faqs: true,
        state: true,
        country: true,
      },
    });
  }),
  getAllWithFilters: protectedProcedure
    .input(
      z.object({
        sectorId: z.array(z.string()).optional(),
        stage: z.array(z.nativeEnum(ProjectStage)).optional(),
        oneToFiveSlots: z.boolean().optional(),
        minRevenue: z.number().optional(),
        maxRevenue: z.number().optional(),
        minInitialInvestment: z.number().optional(),
        maxInitialInvestment: z.number().optional(),
        searchQuery: z.string().optional(),
        page: z.number().optional(),
        favorites: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.ProjectWhereInput = {};

      const investor = await ctx.db.investor.findUnique({
        where: {
          userId: ctx.auth.userId,
        },
        include: {
          favoriteProjects: true,
        },
      });

      const vc = await ctx.db.vcGroup.findUnique({
        where: {
          userId: ctx.auth.userId,
        },
        include: {
          favoriteProjects: true,
        },
      });

      where.visibility = ProjectVisibility.PUBLIC;
      where.status = ProjectStatus.ACTIVE;

      if (input.sectorId && input.sectorId.length > 0) {
        where.sectorId = {
          in: input.sectorId,
        };
      }

      if (input.oneToFiveSlots) {
        where.investorSlots = {
          lte: 5,
        };
      }

      if (input.stage && input.stage.length > 0) {
        where.stage = {
          in: input.stage,
        };
      }

      if (input.minRevenue || input.maxRevenue) {
        where.annualRevenue = {};

        if (input.minRevenue) {
          where.annualRevenue.gte = input.minRevenue;
        }

        if (input.maxRevenue) {
          where.annualRevenue.lte = input.maxRevenue;
        }
      }

      if (input.maxRevenue) {
        where.annualRevenue = {
          lte: input.maxRevenue,
        };
      }

      if (input.minInitialInvestment || input.maxInitialInvestment) {
        where.startInvestment = {};

        if (input.minInitialInvestment) {
          where.startInvestment.gte = input.minInitialInvestment;
        }

        if (input.maxInitialInvestment) {
          where.startInvestment.lte = input.maxInitialInvestment;
        }
      }

      if (input.searchQuery) {
        where.name = {
          contains: input.searchQuery,
          mode: 'insensitive',
        };
      }

      if (input.favorites) {
        where.id = {
          in: investor
            ? investor.favoriteProjects.map(project => project.id)
            : (vc?.favoriteProjects.map(project => project.id) ?? []),
        };
      }

      const total = await ctx.db.project.count({
        where,
      });

      const projects = await ctx.db.project.findMany({
        where,
        include: {
          Entrepreneur: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          country: true,
          state: true,
          sector: true,
        },
        orderBy: [
          {
            isBoosted: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],
        skip: (input.page ?? 1) * 20,
        take: 20,
      });

      console.log('projects', projects);

      return {
        projects: projects.map(project => ({
          ...project,
          isFavorite:
            investor?.favoriteProjects.some(favorite => favorite.id === project.id) ??
            vc?.favoriteProjects.some(favorite => favorite.id === project.id) ??
            false,
        })),
        total,
      };
    }),
  getLast10ViewsInProject: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const views = await ctx.db.projectView.findMany({
        where: {
          projectId: input.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          investor: {
            select: {
              userId: true,
            },
          },
        },
        take: 10,
      });

      return views;
    }),
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        quickSolution: z.string().optional(),
        website: z.string().optional(),
        foundationDate: z.date().optional(),
        stage: z.nativeEnum(ProjectStage).optional(),
        country: z.string(),
        state: z.string(),
        about: z.string().optional(),
        startInvestment: z.number(),
        investorSlots: z.number(),
        annualRevenue: z.number(),
        monthsToReturn: z.number(),
        equity: z.number().optional(),
        investmentGoal: z.number(),
        logo: z.string().optional(),
        sectorId: z.string(),
        currency: z.nativeEnum(Currency),
        photo1: z.string().optional(),
        photo1Caption: z.string().optional(),
        photo2: z.string().optional(),
        photo2Caption: z.string().optional(),
        photo3: z.string().optional(),
        photo3Caption: z.string().optional(),
        photo4: z.string().optional(),
        photo4Caption: z.string().optional(),
        videoUrl: z.string().optional(),
        faqs: z.array(
          z.object({
            question: z.string(),
            answer: z.string(),
          })
        ),
        visibility: z.nativeEnum(ProjectVisibility),
        // Add social impact fields
        socialImpactDescription: z.string().optional(),
        socialImpactBeneficiaries: z.number().optional(),
        socialImpactMetrics: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.create({
        data: {
          name: input.name,
          quickSolution: input.quickSolution,
          website: input.website,
          foundationDate: input.foundationDate,
          stage: input.stage,
          country: {
            connect: {
              id: parseInt(input.country),
            },
          },
          state: {
            connect: {
              id: parseInt(input.state),
            },
          },
          about: input.about,
          startInvestment: input.startInvestment,
          investorSlots: input.investorSlots,
          annualRevenue: input.annualRevenue,
          visibility: input.visibility,
          monthsToReturn: input.monthsToReturn,
          equity: input.equity,
          investmentGoal: input.investmentGoal,
          logo: input.logo,
          photo1: input.photo1,
          photo1Caption: input.photo1Caption,
          photo2: input.photo2,
          photo2Caption: input.photo2Caption,
          photo3: input.photo3,
          photo3Caption: input.photo3Caption,
          photo4: input.photo4,
          photo4Caption: input.photo4Caption,
          videoUrl: input.videoUrl,
          currency: input.currency,
          faqs: {
            create: input.faqs,
          },
          sector: {
            connect: {
              id: input.sectorId,
            },
          },
          Entrepreneur: {
            connect: {
              userId: ctx.auth.userId,
            },
          },
          // Add social impact fields
          socialImpactDescription: input.socialImpactDescription,
          socialImpactBeneficiaries: input.socialImpactBeneficiaries,
          socialImpactMetrics: input.socialImpactMetrics,
        },
      });

      return project;
    }),
  updateVisibility: protectedProcedure
    .input(z.object({ id: z.string(), visibility: z.nativeEnum(ProjectVisibility) }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUniqueOrThrow({
        where: { id: input.id },
      });

      await ctx.db.project.update({
        where: { id: input.id },
        data: { visibility: input.visibility },
      });

      return project;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        quickSolution: z.string().optional(),
        website: z.string().optional(),
        foundationDate: z.date().optional(),
        stage: z.nativeEnum(ProjectStage).optional(),
        country: z.string(),
        state: z.string(),
        about: z.string().optional(),
        startInvestment: z.number().optional(),
        investorSlots: z.number().optional(),
        annualRevenue: z.number().optional(),
        equity: z.number().optional(),
        investmentGoal: z.number().optional(),
        logo: z.string().optional(),
        currency: z.nativeEnum(Currency).optional(),
        photo1: z.string().optional(),
        photo1Caption: z.string().optional(),
        photo2: z.string().optional(),
        photo2Caption: z.string().optional(),
        photo3: z.string().optional(),
        photo3Caption: z.string().optional(),
        photo4: z.string().optional(),
        photo4Caption: z.string().optional(),
        videoUrl: z.string().optional(),
        faqs: z.array(
          z.object({
            question: z.string(),
            answer: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.projectFaq.deleteMany({
        where: { projectId: input.id },
      });

      const updatedProject = await ctx.db.project.update({
        where: { id: input.id },
        data: {
          name: input.name,
          quickSolution: input.quickSolution,
          website: input.website,
          foundationDate: input.foundationDate,
          stage: input.stage,
          country: {
            connect: {
              id: parseInt(input.country),
            },
          },
          state: {
            connect: {
              id: parseInt(input.state),
            },
          },
          about: input.about,
          startInvestment: input.startInvestment,
          investorSlots: input.investorSlots,
          annualRevenue: input.annualRevenue,
          equity: input.equity,
          investmentGoal: input.investmentGoal,
          logo: input.logo,
          photo1: input.photo1,
          photo1Caption: input.photo1Caption,
          photo2: input.photo2,
          photo2Caption: input.photo2Caption,
          photo3: input.photo3,
          photo3Caption: input.photo3Caption,
          photo4: input.photo4,
          photo4Caption: input.photo4Caption,
          videoUrl: input.videoUrl,
          currency: input.currency,
          faqs: {
            create: input.faqs,
          },
        },
      });

      return updatedProject;
    }),
  updateKnowYourNumbers: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        answers: z.array(z.object({ questionId: z.string(), answer: z.string() })),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const knowYourNumbers = await ctx.db.knowYourNumbers.findUnique({
        where: { projectId: input.id },
      });

      if (!knowYourNumbers) {
        await ctx.db.knowYourNumbers.create({
          data: { projectId: input.id },
        });
      }

      // Delete all existing answers
      await ctx.db.answer.deleteMany({
        where: { knowYourNumbersId: knowYourNumbers?.id },
      });

      // Create new answers
      await ctx.db.knowYourNumbers.update({
        where: { projectId: input.id },
        data: {
          answers: {
            create: input.answers.map(answer => ({
              answer: answer.answer,
              questionId: answer.questionId,
            })),
          },
        },
      });
    }),
  addFile: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        url: z.string(),
        name: z.string(),
        type: z.string(),
        size: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const file = await ctx.db.file.create({
        data: {
          url: input.url,
          name: input.name,
          type: input.type,
          size: input.size,
          projectId: input.projectId,
        },
      });

      return file;
    }),
  addView: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: {
          id: input.projectId,
        },
        include: {
          Entrepreneur: true,
        },
      });

      if (!project) {
        console.error('Project not found');
        return;
      }

      const investor = await ctx.db.investor.findUnique({
        where: {
          userId: ctx.auth.userId,
        },
      });

      if (!investor) {
        console.error('Investor not found');
        return;
      }

      await ctx.db.notification.create({
        data: {
          userId: project.Entrepreneur?.userId ?? '',
          type: NotificationType.PROJECT_VIEW,
        },
      });

      const projectView = await ctx.db.projectView.create({
        data: {
          projectId: input.projectId,
          investorId: investor.id,
        },
      });

      return projectView;
    }),
  requestVideoAccess: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: {
          id: input.projectId,
        },
        include: {
          Entrepreneur: {
            select: {
              firstName: true,
              userId: true,
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!project?.Entrepreneur?.userId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project or entrepreneur not found',
        });
      }

      // Create connection between the requesting user and the entrepreneur
      const existingConnection = await ctx.db.connection.findUnique({
        where: {
          followerId_followingId: {
            followerId: ctx.auth.userId,
            followingId: project.Entrepreneur.userId,
          },
        },
      });

      if (!existingConnection) {
        await ctx.db.connection.create({
          data: {
            followerId: ctx.auth.userId,
            followingId: project.Entrepreneur.userId,
          },
        });
      }

      await sendEmail(
        project.Entrepreneur.firstName,
        'Video access requested',
        'A user has requested access to your video presentation.',
        project.Entrepreneur.user.email,
        'Video access requested'
      );

      return { success: true, videoUrl: project.videoUrl };
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.string(), status: z.nativeEnum(ProjectStatus) }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.update({
        where: { id: input.id },
        data: { status: input.status },
      });

      return project;
    }),
  favoriteOrUnfavorite: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;

      const user = await ctx.db.user.findUniqueOrThrow({
        where: { id: userId },
      });

      if (user.userType === 'INVESTOR') {
        const investor = await ctx.db.investor.findUniqueOrThrow({
          where: { userId: userId },
          include: {
            favoriteProjects: true,
          },
        });

        const existingFavorite =
          investor.favoriteProjects.find(favorite => favorite.id === input.projectId) ?? null;

        if (existingFavorite) {
          await ctx.db.investor.update({
            where: { id: investor.id },
            data: {
              favoriteProjects: {
                disconnect: { id: input.projectId },
              },
            },
          });
        } else {
          await ctx.db.investor.update({
            where: { id: investor.id },
            data: {
              favoriteProjects: { connect: { id: input.projectId } },
            },
          });
        }
      }

      if (user.userType === 'VC_GROUP') {
        const vc = await ctx.db.vcGroup.findUniqueOrThrow({
          where: { userId: userId },
          include: {
            favoriteProjects: true,
          },
        });

        const existingFavorite =
          vc.favoriteProjects.find(favorite => favorite.id === input.projectId) ?? null;

        if (existingFavorite) {
          await ctx.db.vcGroup.update({
            where: { id: vc.id },
            data: { favoriteProjects: { disconnect: { id: input.projectId } } },
          });
        } else {
          await ctx.db.vcGroup.update({
            where: { id: vc.id },
            data: { favoriteProjects: { connect: { id: input.projectId } } },
          });
        }
      }
    }),
});
