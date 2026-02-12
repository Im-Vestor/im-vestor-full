import { clerkClient } from '@clerk/nextjs/server';
import { TRPCError } from '@trpc/server';
import { UserType, Currency, UserStatus, type Prisma } from '@prisma/client';
import { z } from 'zod';

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc';
import { sendEmail } from '~/utils/email';
import { createReferralLink, generateCode } from '~/utils/referral';
import {
  generateEmailVerificationToken,
  generateVerificationLink,
} from '~/utils/email-verification';

export const investorRouter = createTRPCRouter({
  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return ctx.db.investor.findUnique({
      where: { id: input.id },
      include: {
        country: true,
        state: true,
        areas: true,
        user: true,
      },
    });
  }),
  getByUserId: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.investor.findUnique({
      where: { userId: ctx.auth.userId },
      include: {
        country: true,
        state: true,
        favoriteProjects: {
          select: {
            id: true,
          },
        },
      },
    });
  }),

  getMyProjects: protectedProcedure.query(async ({ ctx }) => {
    // First check if the user is an investor
    const [user, investor] = await Promise.all([
      ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { userType: true },
      }),
      ctx.db.investor.findUnique({
        where: { userId: ctx.auth.userId },
        select: { id: true },
      }),
    ]);

    if (!user || user.userType !== 'INVESTOR') {
      throw new Error('Unauthorized: Only investors can access this resource');
    }

    if (!investor) {
      return {
        negotiations: [],
        favoriteProjects: [],
        investedProjects: [],
      };
    }

    // Fetch negotiations and investor data in parallel
    const [negotiations, investorWithProjects] = await Promise.all([
      ctx.db.negotiation.findMany({
        where: { investorId: investor.id },
        include: {
          project: {
            include: {
              Entrepreneur: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              sector: true,
              country: true,
              state: true,
              _count: {
                select: {
                  favoriteInvestors: true,
                  favoriteVcGroups: true,
                },
              },
            },
          },
          meetings: {
            orderBy: {
              startDate: 'desc',
            },
          },
        },
      }),
      ctx.db.investor.findUnique({
        where: { id: investor.id },
        select: {
          favoriteProjects: {
            include: {
              Entrepreneur: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              sector: true,
              country: true,
              state: true,
              _count: {
                select: {
                  favoriteInvestors: true,
                  favoriteVcGroups: true,
                },
              },
            },
          },
          investedProjects: {
            include: {
              Entrepreneur: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              sector: true,
              country: true,
              state: true,
              _count: {
                select: {
                  favoriteInvestors: true,
                  favoriteVcGroups: true,
                },
              },
            },
          },
        },
      }),
    ]);

    type ProjectWithCounts = Prisma.ProjectGetPayload<{
      include: {
        Entrepreneur: { select: { firstName: true; lastName: true } };
        sector: true;
        country: true;
        state: true;
        _count: { select: { favoriteInvestors: true; favoriteVcGroups: true } };
      };
    }>;
    type ProjectWithLikes = ProjectWithCounts & { likesCount: number };

    // Helper function to add likesCount to project
    const addLikesCount = (project: ProjectWithCounts): ProjectWithLikes => ({
      ...project,
      likesCount: (project._count?.favoriteInvestors ?? 0) + (project._count?.favoriteVcGroups ?? 0),
    });

    return {
      negotiations: negotiations.map(negotiation => ({
        ...negotiation,
        project: addLikesCount(negotiation.project),
      })),
      favoriteProjects: (investorWithProjects?.favoriteProjects ?? []).map(addLikesCount),
      investedProjects: (investorWithProjects?.investedProjects ?? []).map(addLikesCount),
    };
  }),
  getByUserIdForAdmin: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const isOwnProfile = ctx.auth.userId === input.userId;

      if (!isOwnProfile) {
        // Check if current user is admin using Clerk metadata
        const clerk = await clerkClient();
        const currentUser = await clerk.users.getUser(ctx.auth.userId);
        const userMetadata = currentUser.publicMetadata as {
          userIsAdmin?: boolean;
        };

        if (!userMetadata?.userIsAdmin) {
          throw new Error('Unauthorized: Only admins can view other users profiles');
        }
      }

      return ctx.db.investor.findUnique({
        where: { userId: input.userId },
        include: {
          country: true,
          state: true,
          favoriteProjects: {
            select: {
              id: true,
            },
          },
        },
      });
    }),
  getInvestorsAndVcGroupsRelatedToEntrepreneur: protectedProcedure
    .input(
      z.object({
        cursor: z.number().nullish(),
        limit: z.number().min(1).max(100).nullish(),
        searchQuery: z.string().optional(),
        minInvestment: z.number().optional(),
        maxInvestment: z.number().optional(),
        areaIds: z.array(z.string()).optional(),
        countryId: z.number().optional(),
        stateId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { minInvestment, maxInvestment, areaIds, countryId, stateId } = input;
      const limit = input.limit ?? 10;
      const page = input.cursor ?? 0;

      // Trim and normalize search query
      const searchQuery = input.searchQuery?.trim() || '';
      const searchParts = searchQuery.split(/\s+/).filter(part => part.length > 0);

      // Build investor search conditions with support for full name search
      const buildInvestorSearchConditions = (): Prisma.InvestorWhereInput['OR'] => {
        if (!searchQuery) return undefined;

        const conditions: Prisma.InvestorWhereInput[] = [
          // Match firstName or lastName containing the full query
          { firstName: { contains: searchQuery, mode: 'insensitive' } },
          { lastName: { contains: searchQuery, mode: 'insensitive' } },
        ];

        // If query has multiple parts, also try matching "firstName lastName" pattern
        if (searchParts.length >= 2) {
          conditions.push({
            AND: [
              { firstName: { startsWith: searchParts[0], mode: 'insensitive' } },
              { lastName: { startsWith: searchParts[searchParts.length - 1], mode: 'insensitive' } },
            ],
          });
        }

        return conditions;
      };

      // Investment filter uses OVERLAP logic:
      // An investor's range [investmentMinValue, investmentMaxValue] overlaps with filter range [minInvestment, maxInvestment]
      // if: investmentMaxValue >= minInvestment AND investmentMinValue <= maxInvestment
      const investorWhere: Prisma.InvestorWhereInput = {
        ...(searchQuery ? { OR: buildInvestorSearchConditions() } : {}),
        // Overlap logic: investor's max must be >= filter min (if filter min defined)
        ...(minInvestment ? { investmentMaxValue: { gte: minInvestment } } : {}),
        // Overlap logic: investor's min must be <= filter max (if filter max defined)
        ...(maxInvestment ? { investmentMinValue: { lte: maxInvestment } } : {}),
        ...(areaIds && areaIds.length > 0
          ? { areas: { some: { id: { in: areaIds } } } }
          : {}),
        ...(countryId ? { countryId: countryId } : {}),
        ...(stateId ? { stateId: stateId } : {}),
      };

      // For VcGroup, averageInvestmentSize is a single value, so we check if it falls within the range
      const vcGroupWhere: Prisma.VcGroupWhereInput = {
        ...(searchQuery
          ? {
            OR: [{ name: { contains: searchQuery, mode: 'insensitive' } }],
          }
          : {}),
        ...(minInvestment ? { averageInvestmentSize: { gte: minInvestment } } : {}),
        ...(maxInvestment ? { averageInvestmentSize: { lte: maxInvestment } } : {}),
        ...(areaIds && areaIds.length > 0
          ? { interestedAreas: { some: { id: { in: areaIds } } } }
          : {}),
        ...(countryId ? { countryId: countryId } : {}),
        ...(stateId ? { stateId: stateId } : {}),
      };

      const users = await ctx.db.user.findMany({
        where: {
          OR: [
            { userType: UserType.INVESTOR, investor: investorWhere },
            { userType: UserType.VC_GROUP, vcGroup: vcGroupWhere },
          ],
        },
        include: {
          investor: {
            include: {
              state: true,
              country: true,
              areas: true,
            },
          },
          vcGroup: {
            include: {
              state: true,
              country: true,
              interestedAreas: true,
            },
          },
        },
        skip: page * limit,
        take: limit + 1,
      });

      let nextCursor: number | undefined = undefined;
      if (users.length > limit) {
        users.pop();
        nextCursor = page + 1;
      }

      return { users, nextCursor };
    }),
  create: publicProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        mobileFone: z.string().min(1),
        investmentMinValue: z.number(),
        investmentMaxValue: z.number(),
        birthDate: z.date(),
        referralToken: z.string().optional(),
        email: z.string().email(),
        password: z.string().min(8),
        currency: z.nativeEnum(Currency),
        areas: z.array(z.string()),
        linkedinUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userToCheck = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (userToCheck) {
        throw new Error('Email already in use');
      }

      const phone = input.mobileFone?.trim();
      if (phone) {
        const [existingInvestor, existingEntrepreneur, existingPartner] = await Promise.all([
          ctx.db.investor.findFirst({ where: { mobileFone: phone } }),
          ctx.db.entrepreneur.findFirst({ where: { mobileFone: phone } }),
          ctx.db.partner.findFirst({ where: { mobileFone: phone } }),
        ]);
        if (existingInvestor || existingEntrepreneur || existingPartner) {
          throw new Error('Mobile phone already in use');
        }
      }

      const client = await clerkClient();

      let clerkUser;
      try {
        clerkUser = await client.users.createUser({
          emailAddress: [input.email],
          firstName: input.firstName,
          lastName: input.lastName,
          publicMetadata: {
            userType: UserType.INVESTOR,
          },
          password: input.password,
          skipPasswordChecks: false,
        });
      } catch (error: any) {
        console.error('Clerk createUser failed (investor.create):', error);
        const message =
          error?.errors?.[0]?.message ??
          error?.response?.data?.errors?.[0]?.message ??
          error?.message ??
          'Unprocessable Entity';
        throw new TRPCError({ code: 'BAD_REQUEST', message });
      }

      if (!clerkUser) {
        throw new Error('Failed to create user in Clerk.');
      }

      const user = await ctx.db.user.create({
        data: {
          id: clerkUser ? clerkUser.id : '',
          email: input.email,
          referralCode: generateCode(),
          userType: UserType.INVESTOR,
          status: UserStatus.ACTIVE,
        },
      });

      if (input.referralToken) {
        await createReferralLink(input.referralToken, user.id, input.firstName, input.lastName);
      }

      // Generate verification token and send verification email
      const verificationToken = generateEmailVerificationToken(user.id, user.email);
      const verificationLink = generateVerificationLink(verificationToken);

      await sendEmail(
        input.firstName,
        'Welcome to Im-Vestor!',
        'Thank you for signing up to Im-Vestor. Please verify your email address to activate your account.',
        [input.email],
        'Verify your email - Im-Vestor',
        verificationLink,
        'Verify Email'
      );

      return ctx.db.investor.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          mobileFone: input.mobileFone,
          investmentMinValue: input.investmentMinValue,
          investmentMaxValue: input.investmentMaxValue,
          birthDate: input.birthDate,
          currency: input.currency,
          userId: user.id,
          areas: {
            connect: input.areas.map(area => ({
              id: area,
            })),
          },
          linkedinUrl: input.linkedinUrl,
        },
      });
    }),
  update: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        mobileFone: z.string().min(1),
        fiscalCode: z.string().min(1),
        photo: z.string().optional(),
        banner: z.string().optional(),
        about: z.string().optional(),
        state: z.string().min(1),
        country: z.string().min(1),
        currency: z.nativeEnum(Currency).optional(),
        personalPitchUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.photo) {
        await ctx.db.user.update({
          where: { id: ctx.auth.userId },
          data: {
            imageUrl: input.photo,
          },
        });
      }

      return ctx.db.investor.update({
        where: { userId: ctx.auth.userId },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          mobileFone: input.mobileFone,
          fiscalCode: input.fiscalCode,
          photo: input.photo,
          banner: input.banner,
          about: input.about,
          currency: input.currency,
          personalPitchUrl: input.personalPitchUrl,
          state: {
            connect: {
              id: parseInt(input.state),
            },
          },
          country: {
            connect: {
              id: parseInt(input.country),
            },
          },
        },
      });
    }),
  saveProjectNote: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        notes: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // First check if the user is an investor
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { userType: true }
      });

      if (!user || user.userType !== 'INVESTOR') {
        throw new Error('Unauthorized: Only investors can save project notes');
      }

      const investor = await ctx.db.investor.findUnique({
        where: { userId: ctx.auth.userId },
        select: { id: true }
      });

      if (!investor) {
        throw new Error('Investor not found');
      }

      // Upsert the note (create or update)
      return ctx.db.investorProjectNote.upsert({
        where: {
          investorId_projectId: {
            investorId: investor.id,
            projectId: input.projectId,
          },
        },
        update: {
          notes: input.notes,
        },
        create: {
          investorId: investor.id,
          projectId: input.projectId,
          notes: input.notes,
        },
      });
    }),
  getProjectNotes: protectedProcedure.query(async ({ ctx }) => {
    // First check if the user is an investor
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.auth.userId },
      select: { userType: true }
    });

    if (!user || user.userType !== 'INVESTOR') {
      throw new Error('Unauthorized: Only investors can access project notes');
    }

    const investor = await ctx.db.investor.findUnique({
      where: { userId: ctx.auth.userId },
      select: { id: true }
    });

    if (!investor) {
      return [];
    }

    const notes = await ctx.db.investorProjectNote.findMany({
      where: { investorId: investor.id },
      select: {
        projectId: true,
        notes: true,
      },
    });

    // Convert to a map for easy lookup
    return notes.reduce((acc, note) => {
      acc[note.projectId] = note.notes;
      return acc;
    }, {} as Record<string, string>);
  }),
});
