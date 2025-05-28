import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure, adminProcedure } from '~/server/api/trpc';
import { type Prisma } from "@prisma/client";

export const userRouter = createTRPCRouter({
  getUser: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: {
        id: ctx.auth.userId,
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
        sortDirection: z.enum(["asc", "desc"]).optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, sortBy, sortDirection, search } = input;

      console.log('getAll input:', input);

      try {
        // Get all users from different tables
        const [investors, entrepreneurs, partners, incubators, vcGroups] = await Promise.all([
          // Investors
          ctx.db.investor.findMany({
            select: {
              id: true,
              firstName: true,
              lastName: true,
              mobileFone: true,
            }
          }),
          // Entrepreneurs
          ctx.db.entrepreneur.findMany({
            select: {
              id: true,
              firstName: true,
              lastName: true,
              mobileFone: true,
            }
          }),
          // Partners
          ctx.db.partner.findMany({
            select: {
              id: true,
              firstName: true,
              lastName: true,
              mobileFone: true,
            }
          }),
          // Incubators
          ctx.db.incubator.findMany({
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            }
          }),
          // VC Groups
          ctx.db.vcGroup.findMany({
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            }
          }),
        ]);

        console.log('Raw data from database:');
        console.log('Investors:', investors.length, 'records');
        console.log('Investors sample:', investors.slice(0, 2));
        console.log('Entrepreneurs:', entrepreneurs.length, 'records');
        console.log('Entrepreneurs sample:', entrepreneurs.slice(0, 2));
        console.log('Partners:', partners.length, 'records');
        console.log('Incubators:', incubators.length, 'records');
        console.log('VcGroups:', vcGroups.length, 'records');

        // Combine all users into a single array
        const allUsers = [
          ...investors.map(investor => ({
            id: investor.id,
            email: investor.mobileFone || 'N/A', // Using mobile phone as contact since email isn't available
            userType: 'INVESTOR' as const,
            referralCode: 'N/A', // Not available in individual tables
            firstName: investor.firstName,
            lastName: investor.lastName,
            name: "",
          })),
          ...entrepreneurs.map(entrepreneur => ({
            id: entrepreneur.id,
            email: entrepreneur.mobileFone || 'N/A', // Using mobile phone as contact since email isn't available
            userType: 'ENTREPRENEUR' as const,
            referralCode: 'N/A', // Not available in individual tables
            firstName: entrepreneur.firstName,
            lastName: entrepreneur.lastName,
            name: "",
          })),
          ...partners.map(partner => ({
            id: partner.id,
            email: partner.mobileFone || 'N/A', // Using mobile phone as contact since email isn't available
            userType: 'PARTNER' as const,
            referralCode: 'N/A', // Not available in individual tables
            firstName: partner.firstName,
            lastName: partner.lastName,
            name: "",
          })),
          ...incubators.map(incubator => ({
            id: incubator.id,
            email: incubator.email,
            userType: 'INCUBATOR' as const,
            referralCode: 'N/A', // Not available in individual tables
            firstName: "",
            lastName: "",
            name: incubator.name,
          })),
          ...vcGroups.map(vcGroup => ({
            id: vcGroup.id,
            email: vcGroup.email,
            userType: 'VC_GROUP' as const,
            referralCode: 'N/A', // Not available in individual tables
            firstName: "",
            lastName: "",
            name: vcGroup.name,
          })),
        ];

        // Apply search filter if provided
        let filteredUsers = allUsers;
        if (search && search.trim()) {
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
        console.log('Sample users:', filteredUsers.slice(0, 3));

        // Apply sorting if specified
        if (sortBy && sortDirection) {
          filteredUsers.sort((a, b) => {
            const aValue = a[sortBy as keyof typeof a] || "";
            const bValue = b[sortBy as keyof typeof b] || "";

            if (sortDirection === "asc") {
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
