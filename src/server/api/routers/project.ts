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
import { createNotifications } from './notifications';

export const projectRouter = createTRPCRouter({
  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const project = await ctx.db.project.findUniqueOrThrow({
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
        Incubator: {
          include: {
            state: true,
            country: true,
          },
        },
        incubatorEntrepreneurs: true,
        _count: {
          select: {
            favoriteInvestors: true,
            favoriteVcGroups: true,
          },
        },
      },
    });

    return {
      ...project,
      likesCount: project._count.favoriteInvestors + project._count.favoriteVcGroups,
    };
  }),
  getAllWithFilters: protectedProcedure
    .input(
      z.object({
        sectorId: z.array(z.string()).optional(),
        stage: z.array(z.nativeEnum(ProjectStage)).optional(),
        oneToFiveSlots: z.boolean().optional(),
        onlyIncubatorProjects: z.boolean().optional(),
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

      const [investor, vc] = await Promise.all([
        ctx.db.investor.findUnique({
          where: {
            userId: ctx.auth.userId,
          },
          include: {
            favoriteProjects: true,
          },
        }),
        ctx.db.vcGroup.findUnique({
          where: {
            userId: ctx.auth.userId,
          },
          include: {
            favoriteProjects: true,
          },
        }),
      ]);

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

      if (input.onlyIncubatorProjects) {
        where.incubatorId = {
          not: null,
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

      const [total, projects] = await Promise.all([
        ctx.db.project.count({
          where,
        }),
        ctx.db.project.findMany({
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
            _count: {
              select: {
                favoriteInvestors: true,
                favoriteVcGroups: true,
              },
            },
          },
          orderBy: [
            {
              boostedUntil: 'desc',
            },
            {
              createdAt: 'desc',
            },
          ],
          skip: (input.page ?? 1) * 20,
          take: 20,
        }),
      ]);

      return {
        projects: projects.map(project => ({
          ...project,
          isFavorite:
            investor?.favoriteProjects.some(favorite => favorite.id === project.id) ??
            vc?.favoriteProjects.some(favorite => favorite.id === project.id) ??
            false,
          likesCount: project._count.favoriteInvestors + project._count.favoriteVcGroups,
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
        videoPitchUrl: z.string().optional(),
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
        entrepreneur: z
          .object({
            firstName: z.string().min(2, 'First name must be at least 2 characters'),
            lastName: z.string().min(2, 'Last name must be at least 2 characters'),
            mobileFone: z.string().min(1, 'Mobile phone is required'),
            companyRole: z.string().min(1, 'Company role is required'),
            birthDate: z.date(),
            photo: z.string().optional(),
            about: z
              .string()
              .min(10, 'About must be at least 10 characters')
              .max(280, 'About must be at most 280 characters'),
            linkedinUrl: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const loggedInUser = await ctx.db.user.findUniqueOrThrow({
        where: { id: ctx.auth.userId },
      });

      const projectData = {
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
        videoPitchUrl: input.videoPitchUrl,
        currency: input.currency,
        faqs: {
          create: input.faqs,
        },
        sector: {
          connect: {
            id: input.sectorId,
          },
        },

        // Add social impact fields
        socialImpactDescription: input.socialImpactDescription,
        socialImpactBeneficiaries: input.socialImpactBeneficiaries,
        socialImpactMetrics: input.socialImpactMetrics,
      };

      const project = await ctx.db.project.create({
        data:
          loggedInUser.userType === 'ENTREPRENEUR'
            ? {
                ...projectData,
                Entrepreneur: {
                  connect: {
                    userId: ctx.auth.userId,
                  },
                },
              }
            : {
                ...projectData,
                Incubator: {
                  connect: {
                    userId: ctx.auth.userId,
                  },
                },
              },
      });

      if (loggedInUser.userType === 'INCUBATOR') {
        await ctx.db.incubatorEntrepreneur.create({
          data: {
            projectId: project.id,
            firstName: input.entrepreneur?.firstName ?? '',
            lastName: input.entrepreneur?.lastName ?? '',
            about: input.entrepreneur?.about ?? '',
            mobileFone: input.entrepreneur?.mobileFone ?? '',
            companyRole: input.entrepreneur?.companyRole ?? '',
            birthDate: input.entrepreneur?.birthDate ?? '',
            photo: input.entrepreneur?.photo ?? '',
            linkedinUrl: input.entrepreneur?.linkedinUrl ?? '',
          },
        });
      }

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
        videoPitchUrl: z.string().optional(),
        faqs: z.array(
          z.object({
            question: z.string(),
            answer: z.string(),
          })
        ),
        entrepreneur: z
          .object({
            firstName: z.string().optional(),
            lastName: z.string().optional(),
            mobileFone: z.string().optional(),
            companyRole: z.string().optional(),
            birthDate: z.date().optional(),
            photo: z.string().optional(),
            about: z.string().optional(),
            linkedinUrl: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.projectFaq.deleteMany({
        where: { projectId: input.id },
      });

      const loggedInUser = await ctx.db.user.findUniqueOrThrow({
        where: { id: ctx.auth.userId },
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
          videoPitchUrl: input.videoPitchUrl,
          currency: input.currency,
          faqs: {
            create: input.faqs,
          },
        },
      });

      if (loggedInUser.userType === 'INCUBATOR') {
        await ctx.db.incubatorEntrepreneur.updateMany({
          where: { projectId: input.id },
          data: input.entrepreneur ?? {},
        });
      }

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
      const [project, investor] = await Promise.all([
        ctx.db.project.findUnique({
          where: {
            id: input.projectId,
          },
          include: {
            Entrepreneur: true,
            Incubator: true,
          },
        }),
        ctx.db.investor.findUnique({
          where: {
            userId: ctx.auth.userId,
          },
        }),
      ]);

      if (!project) {
        console.error('Project not found');
        return;
      }

      if (!investor) {
        console.error('Investor not found');
        return;
      }

      const [_, projectView] = await Promise.all([
        ctx.db.notification.create({
          data: {
            userId: project.Entrepreneur?.userId ?? project.Incubator?.userId ?? '',
            type: NotificationType.PROJECT_VIEW,
            investorId: investor.id,
          },
        }),
        ctx.db.projectView.create({
          data: {
            projectId: input.projectId,
            investorId: investor.id,
          },
        }),
      ]);

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
        [project.Entrepreneur.user.email],
        'Video access requested'
      );

      return { success: true, videoUrl: project.videoUrl };
    }),

  requestPitchVideo: protectedProcedure
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
              id: true,
              firstName: true,
              userId: true,
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
          Incubator: {
            select: {
              id: true,
              name: true,
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

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      const requestingUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        include: {
          investor: true,
          vcGroup: true,
        },
      });

      if (!requestingUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      const requestingUserName = requestingUser.investor
        ? `${requestingUser.investor.firstName} ${requestingUser.investor.lastName}`
        : requestingUser.vcGroup
          ? requestingUser.vcGroup.name
          : 'An investor';

      if (project.Entrepreneur) {
        await createNotifications(
          ctx.db,
          [project.Entrepreneur.userId],
          NotificationType.PITCH_REQUEST
        );

        await sendEmail(
          project.Entrepreneur.firstName,
          'Pitch Video Requested',
          `${requestingUserName} is interested in your project "${project.name}" and has requested a pitch video. Upload a pitch video to your project to increase your chances of securing investment!`,
          [project.Entrepreneur.user.email],
          'Pitch Video Requested'
        );
      } else if (project.Incubator) {
        await createNotifications(
          ctx.db,
          [project.Incubator.userId],
          NotificationType.PITCH_REQUEST
        );

        await sendEmail(
          project.Incubator.name,
          'Pitch Video Requested',
          `${requestingUserName} is interested in the project "${project.name}" and has requested a pitch video. Upload a pitch video to the project to increase its chances of securing investment!`,
          [project.Incubator.user.email],
          'Pitch Video Requested'
        );
      }

      return { success: true };
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

      const [investor, vc] = await Promise.all([
        ctx.db.investor.findUnique({
          where: { userId: userId },
          include: {
            favoriteProjects: true,
          },
        }),
        ctx.db.vcGroup.findUnique({
          where: { userId: userId },
          include: {
            favoriteProjects: true,
          },
        }),
      ]);

      if (investor) {
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
      } else if (vc) {
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
