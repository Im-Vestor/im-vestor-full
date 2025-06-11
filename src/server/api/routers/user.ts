import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, adminProcedure } from '~/server/api/trpc';

export const userRouter = createTRPCRouter({
  getUser: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: {
        id: ctx.auth.userId,
      },
    });

    const whereClause = {
      OR: [
        {
          investor: {
            userId: ctx.auth.userId,
          },
        },
        {
          project: {
            Entrepreneur: {
              userId: ctx.auth.userId,
            },
          },
        },
      ],
    };

    // check is user have an open negotiation
    const negotiationWhereClause = {
      ...whereClause,
      ...(user?.userType === 'ENTREPRENEUR' && { entrepreneurActionNeeded: true }),
      ...(user?.userType === 'INVESTOR' && { investorActionNeeded: true }),
    };

    const openNegotiations = await ctx.db.negotiation.findMany({
      where: negotiationWhereClause,
      include: {
        project: true,
      },
    });

    return { ...user, openNegotiations };
  }),

  getUserById: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Only allow admins to query other users' data, or users to query their own data
      const isOwnProfile = ctx.auth.userId === input.userId;

      if (!isOwnProfile) {
        // Check if current user is admin using Clerk metadata
        const { clerkClient } = await import('@clerk/nextjs/server');
        const clerk = await clerkClient();
        const currentUser = await clerk.users.getUser(ctx.auth.userId);
        const userMetadata = currentUser.publicMetadata as {
          userIsAdmin?: boolean;
        };

        if (!userMetadata?.userIsAdmin) {
          throw new Error('Unauthorized: You can only view your own profile');
        }
      }

      const user = await ctx.db.user.findUnique({
        where: {
          id: input.userId,
        },
      });

      return user;
    }),

  getMyReferrals: protectedProcedure
    .input(z.object({ page: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const { page } = input;
      const perPage = 10;
      const skip = (page ?? 1) * perPage;

      // Referrals that the current user referred
      const referrals = await ctx.db.referral.findMany({
        where: { referrerId: ctx.auth.userId },
        skip,
        take: perPage,
        include: {
          referred: true,
        },
        orderBy: {
          joinedAt: 'desc',
        },
      });

      // Get the business (both from investors and entrepreneurs referred)
      const businesses = await ctx.db.project.findMany({
        where: {
          OR: [
            {
              investedInvestors: {
                some: {
                  id: {
                    in: referrals.map(referral => referral.referred.id),
                  },
                },
              },
            },
            {
              Entrepreneur: {
                userId: {
                  in: referrals.map(referral => referral.referred.id),
                },
              },
            },
          ],
        },
        include: {
          investedInvestors: {
            include: {
              user: true,
            },
          },
          Entrepreneur: {
            include: {
              user: true,
            },
          },
        },
      });

      // Match the businesses to the referrals
      const referralsWithBusinesses = referrals.map(referral => {
        const referralBusinesses = businesses.filter(
          business =>
            business.investedInvestors.some(
              investor => investor.user.id === referral.referred.id
            ) || business.Entrepreneur?.userId === referral.referred.id
        );

        return {
          referral,
          businesses: referralBusinesses,
        };
      });

      const total = await ctx.db.referral.count({
        where: { referrerId: ctx.auth.userId },
      });

      return {
        referralsWithBusinesses,
        total,
      };
    }),
  getAll: adminProcedure
    .input(
      z.object({
        page: z.number().min(1),
        limit: z.number().min(1),
        sortBy: z.string().optional(),
        sortDirection: z.enum(['asc', 'desc']).optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, sortBy, sortDirection, search } = input;

      console.log('getAll input:', input);

      try {
        // Get all users from different tables using existing structure
        const [investors, entrepreneurs, partners, incubators, vcGroups] = await Promise.all([
          // Investors
          ctx.db.investor.findMany({
            select: {
              id: true,
              userId: true,
              firstName: true,
              lastName: true,
              mobileFone: true,
            },
          }),
          // Entrepreneurs - include projects to count them
          ctx.db.entrepreneur.findMany({
            select: {
              id: true,
              userId: true,
              firstName: true,
              lastName: true,
              mobileFone: true,
              projects: {
                select: {
                  id: true,
                },
              },
            },
          }),
          // Partners
          ctx.db.partner.findMany({
            select: {
              id: true,
              userId: true,
              firstName: true,
              lastName: true,
              mobileFone: true,
            },
          }),
          // Incubators - include projects to count them
          ctx.db.incubator.findMany({
            select: {
              id: true,
              userId: true,
              name: true,
              email: true,
              phone: true,
              projects: {
                select: {
                  id: true,
                },
              },
            },
          }),
          // VC Groups
          ctx.db.vcGroup.findMany({
            select: {
              id: true,
              userId: true,
              name: true,
              email: true,
              phone: true,
            },
          }),
        ]);

        console.log('Raw data from database:');
        console.log('Investors:', investors.length, 'records');
        console.log('Entrepreneurs:', entrepreneurs.length, 'records');
        console.log('Partners:', partners.length, 'records');
        console.log('Incubators:', incubators.length, 'records');
        console.log('VcGroups:', vcGroups.length, 'records');

        // Combine all users into a single array
        const allUsers = [
          ...investors.map(investor => ({
            id: investor.userId,
            email: investor.mobileFone ?? 'N/A',
            userType: 'INVESTOR' as const,
            referralCode: 'N/A',
            firstName: investor.firstName,
            lastName: investor.lastName,
            name: '',
            projectsCount: 0, // Investors don't publish projects
          })),
          ...entrepreneurs.map(entrepreneur => ({
            id: entrepreneur.userId,
            email: entrepreneur.mobileFone ?? 'N/A',
            userType: 'ENTREPRENEUR' as const,
            referralCode: 'N/A',
            firstName: entrepreneur.firstName,
            lastName: entrepreneur.lastName,
            name: '',
            projectsCount: entrepreneur.projects.length, // Count projects using existing relation
          })),
          ...partners.map(partner => ({
            id: partner.userId,
            email: partner.mobileFone ?? 'N/A',
            userType: 'PARTNER' as const,
            referralCode: 'N/A',
            firstName: partner.firstName,
            lastName: partner.lastName,
            name: '',
            projectsCount: 0, // Partners don't publish projects
          })),
          ...incubators.map(incubator => ({
            id: incubator.id,
            email: incubator.email,
            userType: 'INCUBATOR' as const,
            referralCode: 'N/A',
            firstName: '',
            lastName: '',
            name: incubator.name,
            projectsCount: incubator.projects.length, // Count projects using existing relation
          })),
          ...vcGroups.map(vcGroup => ({
            id: vcGroup.id,
            email: vcGroup.email,
            userType: 'VC_GROUP' as const,
            referralCode: 'N/A',
            firstName: '',
            lastName: '',
            name: vcGroup.name,
            projectsCount: 0, // VC Groups don't publish projects directly
          })),
        ];

        // Apply search filter if provided
        let filteredUsers = allUsers;
        if (search?.trim()) {
          const searchTerm = search.trim().toLowerCase();
          filteredUsers = allUsers.filter(user => {
            const fullName = user.name || `${user.firstName} ${user.lastName}`.trim();
            return (
              fullName.toLowerCase().includes(searchTerm) ||
              user.email.toLowerCase().includes(searchTerm)
            );
          });
        }

        console.log('Total users found:', filteredUsers.length);

        // Apply sorting if specified
        if (sortBy && sortDirection) {
          filteredUsers.sort((a, b) => {
            const aValue = a[sortBy as keyof typeof a] ?? '';
            const bValue = b[sortBy as keyof typeof b] ?? '';

            if (sortDirection === 'asc') {
              return aValue.toString().localeCompare(bValue.toString());
            } else {
              return bValue.toString().localeCompare(aValue.toString());
            }
          });
        }

        // Apply pagination
        const total = filteredUsers.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

        return {
          items: paginatedUsers,
          total,
          hasMore: endIndex < total,
        };
      } catch (error) {
        console.error('Error in getAll query:', error);
        throw error;
      }
    }),
});
