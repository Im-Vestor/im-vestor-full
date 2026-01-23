import { z } from 'zod';
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '~/server/api/trpc';
import { createDeletionLink } from '~/utils/deletion-token';
import { sendEmail } from '~/utils/email';
import {
  generateEmailVerificationToken,
  generateVerificationLink,
} from '~/utils/email-verification';

export const userRouter = createTRPCRouter({
  getUser: protectedProcedure.query(async ({ ctx }) => {
    // OPTIMIZED V3: Parallel queries - minimize latency impact
    // With 350ms network latency, running in parallel is faster than sequential

    // Fetch base user first (fast query)
    const baseUser = await ctx.db.user.findUnique({
      where: { id: ctx.auth.userId },
      select: {
        id: true,
        email: true,
        imageUrl: true,
        referralCode: true,
        userType: true,
        availablePokes: true,
        stripeCustomerId: true,
        availableBoosts: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!baseUser) {
      throw new Error('User not found');
    }

    // Build parallel queries based on userType
    const queries: Promise<any>[] = [];

    // Profile query (only for the specific type)
    let profilePromise: Promise<any> | null = null;
    switch (baseUser.userType) {
      case 'ENTREPRENEUR':
        profilePromise = ctx.db.entrepreneur.findUnique({
          where: { userId: ctx.auth.userId },
        });
        break;
      case 'INVESTOR':
        profilePromise = ctx.db.investor.findUnique({
          where: { userId: ctx.auth.userId },
        });
        break;
      case 'PARTNER':
        profilePromise = ctx.db.partner.findUnique({
          where: { userId: ctx.auth.userId },
        });
        break;
      case 'INCUBATOR':
        profilePromise = ctx.db.incubator.findUnique({
          where: { userId: ctx.auth.userId },
        });
        break;
      case 'VC_GROUP':
        profilePromise = ctx.db.vcGroup.findUnique({
          where: { userId: ctx.auth.userId },
        });
        break;
    }

    // Referrals query (minimal)
    const referralsPromise = ctx.db.referral.findFirst({
      where: { referredId: ctx.auth.userId },
      select: {
        id: true,
        name: true,
        joinedAt: true,
        referrer: {
          select: {
            id: true,
            email: true,
            userType: true,
            entrepreneur: { select: { firstName: true, lastName: true } },
            investor: { select: { firstName: true, lastName: true } },
            partner: { select: { firstName: true, lastName: true } },
            incubator: { select: { name: true } },
            vcGroup: { select: { name: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    // Negotiations query (only if needed)
    let negotiationsPromise: Promise<any> | null = null;
    if (baseUser.userType === 'ENTREPRENEUR' || baseUser.userType === 'INVESTOR') {
      const negotiationWhere: any = {};

      if (baseUser.userType === 'ENTREPRENEUR') {
        negotiationWhere.project = {
          Entrepreneur: { userId: ctx.auth.userId },
        };
        negotiationWhere.entrepreneurActionNeeded = true;
      } else {
        negotiationWhere.investor = { userId: ctx.auth.userId };
        negotiationWhere.investorActionNeeded = true;
      }

      negotiationsPromise = ctx.db.negotiation.findMany({
        where: negotiationWhere,
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          stage: true,
          investorActionNeeded: true,
          entrepreneurActionNeeded: true,
          investorAgreedToGoToNextStage: true,
          entrepreneurAgreedToGoToNextStage: true,
          project: {
            select: { id: true, name: true, logo: true, stage: true },
          },
        },
      });
    }

    // Execute all queries in parallel
    const [profile, referral, negotiations] = await Promise.all([
      profilePromise,
      referralsPromise,
      negotiationsPromise,
    ]);

    // Construct response matching original structure
    const user: any = { ...baseUser };

    // Add profile based on type
    if (baseUser.userType === 'ENTREPRENEUR') user.entrepreneur = profile;
    else if (baseUser.userType === 'INVESTOR') user.investor = profile;
    else if (baseUser.userType === 'PARTNER') user.partner = profile;
    else if (baseUser.userType === 'INCUBATOR') user.incubator = profile;
    else if (baseUser.userType === 'VC_GROUP') user.vcGroup = profile;

    // Add referrals
    user.referralsAsReferred = referral ? [referral] : [];

    return {
      ...user,
      openNegotiations: negotiations || [],
    };
  }),

  getUserById: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
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

      try {
        const skip = (page - 1) * limit;

        const where: any = {};
        if (search?.trim()) {
          where.OR = [
            { email: { contains: search, mode: 'insensitive' as const } },
            { entrepreneur: { firstName: { contains: search, mode: 'insensitive' as const } } },
            { entrepreneur: { lastName: { contains: search, mode: 'insensitive' as const } } },
            { investor: { firstName: { contains: search, mode: 'insensitive' as const } } },
            { investor: { lastName: { contains: search, mode: 'insensitive' as const } } },
            { partner: { firstName: { contains: search, mode: 'insensitive' as const } } },
            { partner: { lastName: { contains: search, mode: 'insensitive' as const } } },
            { incubator: { name: { contains: search, mode: 'insensitive' as const } } },
            { vcGroup: { name: { contains: search, mode: 'insensitive' as const } } },
          ];
        }

        const allowedSortFields = new Set(['createdAt', 'userType', 'email']);
        const orderBy = sortBy && sortDirection && allowedSortFields.has(sortBy)
          ? [{ [sortBy]: sortDirection } as any]
          : [{ createdAt: 'desc' as const }, { userType: 'asc' as const }];

        const [users, total] = await Promise.all([
          ctx.db.user.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include: {
              _count: {
                select: {
                  referralsAsReferrer: true,
                },
              },
              referralsAsReferred: {
                include: {
                  referrer: {
                    include: {
                      entrepreneur: true,
                      investor: true,
                      partner: true,
                      incubator: true,
                      vcGroup: true,
                    },
                  },
                },
                take: 1,
                orderBy: {
                  joinedAt: 'desc',
                },
              },
              entrepreneur: {
                select: {
                  firstName: true,
                  lastName: true,
                  mobileFone: true,
                  projects: { select: { id: true } },
                },
              },
              investor: {
                select: {
                  firstName: true,
                  lastName: true,
                  mobileFone: true,
                },
              },
              partner: {
                select: {
                  firstName: true,
                  lastName: true,
                  mobileFone: true,
                },
              },
              incubator: {
                select: {
                  name: true,
                  email: true,
                  phone: true,
                  projects: { select: { id: true } },
                },
              },
              vcGroup: {
                select: {
                  name: true,
                  email: true,
                  phone: true,
                },
              },
            },
          }),
          ctx.db.user.count({ where }),
        ]);

        const items = users.map(u => {
          const referral = u.referralsAsReferred[0];
          let referredBy = null;

          if (referral?.referrer) {
            const refUser = referral.referrer;
            if (refUser.userType === 'ENTREPRENEUR' && refUser.entrepreneur) {
              referredBy = `${refUser.entrepreneur.firstName} ${refUser.entrepreneur.lastName}`;
            } else if (refUser.userType === 'INVESTOR' && refUser.investor) {
              referredBy = `${refUser.investor.firstName} ${refUser.investor.lastName}`;
            } else if (refUser.userType === 'PARTNER' && refUser.partner) {
              referredBy = `${refUser.partner.firstName} ${refUser.partner.lastName}`;
            } else if (refUser.userType === 'INCUBATOR' && refUser.incubator) {
              referredBy = refUser.incubator.name;
            } else if (refUser.userType === 'VC_GROUP' && refUser.vcGroup) {
              referredBy = refUser.vcGroup.name;
            } else {
              referredBy = refUser.email;
            }
          }

          return {
            id: u.id,
            email: u.email,
            phone: u.entrepreneur?.mobileFone ?? u.investor?.mobileFone ?? u.partner?.mobileFone ?? u.incubator?.phone ?? u.vcGroup?.phone ?? 'N/A',
            userType: u.userType,
            firstName: u.entrepreneur?.firstName ?? u.investor?.firstName ?? u.partner?.firstName ?? '',
            lastName: u.entrepreneur?.lastName ?? u.investor?.lastName ?? u.partner?.lastName ?? '',
            name: u.incubator?.name ?? u.vcGroup?.name ?? '',
            projectsCount: (u.entrepreneur?.projects?.length ?? 0) + (u.incubator?.projects?.length ?? 0),
            referralCode: u.referralCode,
            createdAt: u.createdAt,
            referralsCount: u._count?.referralsAsReferrer ?? 0,
            referredBy,
          };
        });

        return {
          items,
          total,
          hasMore: skip + limit < total,
        };
      } catch (error) {
        console.error('Error in getAll query:', error);
        throw error;
      }
    }),
  requestPersonalPitchVideo: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const loggedInUser = await ctx.db.user.findUnique({
        where: {
          id: ctx.auth.userId,
        },
      });

      const user = await ctx.db.user.findUnique({
        where: {
          id: input.userId,
        },
        include: {
          entrepreneur: true,
          investor: true,
        },
      });

      // Create connection between the requesting user and the entrepreneur
      const existingConnection = await ctx.db.connection.findUnique({
        where: {
          followerId_followingId: {
            followerId: loggedInUser?.id ?? '',
            followingId: user?.id ?? '',
          },
        },
      });

      if (!existingConnection) {
        await ctx.db.connection.create({
          data: {
            followerId: ctx.auth.userId,
            followingId: user?.id ?? '',
          },
        });
      }

      const videOwnerUserType = user?.userType;

      await sendEmail(
        videOwnerUserType === 'ENTREPRENEUR'
          ? (user?.entrepreneur?.firstName ?? '')
          : (user?.investor?.firstName ?? ''),
        'Video access requested',
        'A user has requested access to your video presentation.',
        [user?.email ?? ''],
        'Video access requested'
      );

      return { success: true };
    }),
  deleteUser: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.auth.userId },
      include: {
        entrepreneur: true,
        investor: true,
        partner: true,
        incubator: true,
        vcGroup: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get user's name based on their type
    let userName = 'User';
    if (user.entrepreneur) {
      userName = user.entrepreneur.firstName || 'User';
    } else if (user.investor) {
      userName = user.investor.firstName || 'User';
    } else if (user.partner) {
      userName = user.partner.firstName || 'User';
    } else if (user.incubator) {
      userName = user.incubator.name || 'User';
    } else if (user.vcGroup) {
      userName = user.vcGroup.name || 'User';
    }

    // Generate deletion link
    const baseUrl = process.env.NEXTAUTH_URL ?? process.env.VERCEL_URL ?? 'http://localhost:3000';
    const deletionLink = createDeletionLink(ctx.auth.userId, baseUrl);

    // Send confirmation email
    await sendEmail(
      userName,
      'We received a request to delete your Im-Vestor account.',
      'If you want to proceed with the account deletion, please click the button below. This link will expire in 24 hours. If you did not request this deletion, please ignore this email.',
      [user.email],
      'Confirm Account Deletion',
      deletionLink,
      'Delete My Account'
    );

    return { success: true, message: 'Confirmation email sent' };
  }),
  checkUserStatus: publicProcedure
    .input(z.object({ email: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      return user?.status;
    }),
  sendUpdateEmailEmail: protectedProcedure
    .input(z.object({ email: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        include: {
          entrepreneur: true,
          investor: true,
          partner: true,
          incubator: true,
          vcGroup: true,
        },
      });

      // Generate verification token and send verification email
      const verificationToken = generateEmailVerificationToken(user?.id ?? '', input.email);
      const verificationLink = generateVerificationLink(verificationToken);

      const linkAddapted = verificationLink.replace('verify-email', 'update-email');

      await sendEmail(
        user?.entrepreneur?.firstName ??
        user?.investor?.firstName ??
        user?.partner?.firstName ??
        user?.incubator?.name ??
        user?.vcGroup?.name ??
        '',
        'Update your email address on Im-Vestor!',
        'You can verify the new email address by clicking the button below.',
        [input.email],
        'Verify your email - Im-Vestor',
        linkAddapted,
        'Verify Email'
      );

      return { success: true };
    }),
});
