import { Currency, NotificationType, type Prisma, ProjectStage } from '@prisma/client';
import { z } from 'zod';

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';

export const projectRouter = createTRPCRouter({
  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return ctx.db.project.findUniqueOrThrow({
      where: { id: input.id },
      include: {
        sector: true,
        Entrepreneur: {
          include: {
            state: true,
            country: true,
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

      const investor = await ctx.db.investor.findUniqueOrThrow({
        where: {
          userId: ctx.auth.userId,
        },
        include: {
          favoriteProjects: true,
        },
      });

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

      if (input.minRevenue) {
        where.annualRevenue = {
          gte: input.minRevenue,
        };
      }

      if (input.maxRevenue) {
        where.annualRevenue = {
          lte: input.maxRevenue,
        };
      }

      if (input.minInitialInvestment) {
        where.startInvestment = {
          gte: input.minInitialInvestment,
        };
      }

      if (input.maxInitialInvestment) {
        where.startInvestment = {
          lte: input.maxInitialInvestment,
        };
      }

      if (input.searchQuery) {
        where.name = {
          contains: input.searchQuery,
          mode: 'insensitive',
        };
      }

      if (input.favorites) {
        where.id = {
          in: investor.favoriteProjects.map(project => project.id),
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
        orderBy: {
          createdAt: 'desc',
        },
        skip: (input.page ?? 1) * 20,
        take: 20,
      });

      return {
        projects: projects.map(project => ({
          ...project,
          isFavorite: investor.favoriteProjects.some(favorite => favorite.id === project.id),
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
        faqs: z.array(
          z.object({
            question: z.string(),
            answer: z.string(),
          })
        ),
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
          monthsToReturn: input.monthsToReturn,
          equity: input.equity,
          investmentGoal: input.investmentGoal,
          logo: input.logo,
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
        },
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
});
