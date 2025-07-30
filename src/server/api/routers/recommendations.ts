import { UserType } from '@prisma/client';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';

export const recommendationsRouter = createTRPCRouter({
  getRecommendations: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: {
        id: ctx.auth.userId,
      },
      include: {
        investor: {
          include: {
            areas: true,
          },
        },
        entrepreneur: {
          include: {
            projects: {
              include: {
                sector: true,
              },
            },
          },
        },
        vcGroup: {
          include: {
            interestedAreas: true,
          },
        },
        incubator: {
          include: {
            areas: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get projects with high traction (views, meetings, negotiations)
    const projectsWithCounts = await ctx.db.$transaction(async (tx) => {
      const projects = await tx.project.findMany({
        where: {
          visibility: 'PUBLIC',
        },
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
        },
        take: 5,
      });

      const projectIds = projects.map(p => p.id);

      // Get view counts using raw SQL
      const viewCountsRaw = await tx.$queryRaw<Array<{ project_id: string; count: number }>>`
        SELECT "projectId" as project_id, COUNT(*) as count
        FROM "ProjectView"
        WHERE "projectId" IN (${projectIds.join(',')})
        GROUP BY "projectId"
      `;

      // Get match counts using raw SQL
      const matchCountsRaw = await tx.$queryRaw<Array<{ project_id: string; count: number }>>`
        SELECT "projectId" as project_id, COUNT(*) as count
        FROM "Match"
        WHERE "projectId" IN (${projectIds.join(',')})
        GROUP BY "projectId"
      `;

      const viewCountMap = new Map(viewCountsRaw.map(v => [v.project_id, v.count]));
      const matchCountMap = new Map(matchCountsRaw.map(m => [m.project_id, m.count]));

      return projects.map(project => ({
        ...project,
        viewCount: viewCountMap.get(project.id) || 0,
        matchCount: matchCountMap.get(project.id) || 0,
      }));
    });

    // Calculate traction score (0-100) based on views and matches
    const hyperTrainProjects = projectsWithCounts.map(project => {
      const maxViews = Math.max(...projectsWithCounts.map(p => p.viewCount));
      const maxMatches = Math.max(...projectsWithCounts.map(p => p.matchCount));

      const viewsScore = maxViews > 0 ? (project.viewCount / maxViews) * 50 : 0;
      const matchesScore = maxMatches > 0 ? (project.matchCount / maxMatches) * 50 : 0;
      const traction = Math.round(viewsScore + matchesScore);

      return {
        ...project,
        traction,
      };
    });

    switch (user.userType) {
      case UserType.INVESTOR:
      case UserType.VC_GROUP: {
        // For investors and VC groups, recommend projects in their interested areas
        const interestedAreas = user.userType === UserType.INVESTOR
          ? user.investor?.areas.map(a => a.id)
          : user.vcGroup?.interestedAreas.map(a => a.id);

        const recommendedProjects = await ctx.db.project.findMany({
          where: {
            sectorId: {
              in: interestedAreas,
            },
            visibility: 'PUBLIC',
          },
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
          },
          orderBy: [
            {
              isBoosted: 'desc',
            },
            {
              createdAt: 'desc',
            },
          ],
          take: 5,
        });

        return {
          recommendedProjects,
          hyperTrainProjects: hyperTrainProjects,
          metrics: {
            totalViews: await ctx.db.projectView.count({
              where: {
                investorId: user.investor?.id,
              },
            }),
            totalMeetings: await ctx.db.meeting.count({
              where: {
                investors: {
                  some: {
                    id: user.investor?.id,
                  },
                },
              },
            }),
            totalConnections: await ctx.db.connection.count({
              where: {
                OR: [
                  { followerId: user.id },
                  { followingId: user.id },
                ],
              },
            }),
          },
        };
      }

      case UserType.ENTREPRENEUR: {
        // For entrepreneurs, recommend investors interested in their project areas
        const projectAreas = user.entrepreneur?.projects.map(p => p.sectorId) || [];

        const recommendedInvestors = await ctx.db.investor.findMany({
          where: {
            areas: {
              some: {
                id: {
                  in: projectAreas,
                },
              },
            },
          },
          include: {
            user: true,
            country: true,
            state: true,
          },
          take: 5,
        });

        return {
          recommendedInvestors,
          hyperTrainProjects: hyperTrainProjects,
          metrics: {
            totalViews: await ctx.db.projectView.count({
              where: {
                project: {
                  entrepreneurId: user.entrepreneur?.id,
                },
              },
            }),
            totalMeetings: await ctx.db.meeting.count({
              where: {
                entrepreneurId: user.entrepreneur?.id,
              },
            }),
            totalConnections: await ctx.db.connection.count({
              where: {
                OR: [
                  { followerId: user.id },
                  { followingId: user.id },
                ],
              },
            }),
          },
        };
      }

      case UserType.INCUBATOR: {
        // For incubators, recommend projects in their areas of expertise
        const interestedAreas = user.incubator?.areas.map(a => a.id);

        const recommendedProjects = await ctx.db.project.findMany({
          where: {
            sectorId: {
              in: interestedAreas,
            },
            visibility: 'PUBLIC',
          },
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
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        });

        return {
          recommendedProjects,
          hyperTrainProjects: hyperTrainProjects,
          metrics: {
            totalProjects: await ctx.db.project.count({
              where: {
                incubatorId: user.incubator?.id,
              },
            }),
            totalConnections: await ctx.db.connection.count({
              where: {
                OR: [
                  { followerId: user.id },
                  { followingId: user.id },
                ],
              },
            }),
          },
        };
      }

      case UserType.PARTNER: {
        // For partners, show their referral metrics
        const referrals = await ctx.db.referral.findMany({
          where: {
            referrerId: user.id,
          },
          include: {
            referred: true,
          },
          take: 5,
          orderBy: {
            joinedAt: 'desc',
          },
        });

        return {
          recentReferrals: referrals,
          hyperTrainProjects: hyperTrainProjects,
          metrics: {
            totalReferrals: await ctx.db.referral.count({
              where: {
                referrerId: user.id,
              },
            }),
            totalConnections: await ctx.db.connection.count({
              where: {
                OR: [
                  { followerId: user.id },
                  { followingId: user.id },
                ],
              },
            }),
          },
        };
      }

      default:
        return {
          hyperTrainProjects: hyperTrainProjects,
          metrics: {
            totalConnections: await ctx.db.connection.count({
              where: {
                OR: [
                  { followerId: user.id },
                  { followingId: user.id },
                ],
              },
            }),
          },
        };
    }
  }),
});