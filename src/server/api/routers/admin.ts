import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { ProjectViewWithRelations } from "~/types/admin";

export const adminRouter = createTRPCRouter({
  getProjectViews: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        perPage: z.number().default(10),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Ensure user is admin
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { userType: true },
      });

      if (user?.userType !== "ADMIN") {
        throw new Error("Unauthorized");
      }

      const skip = (input.page - 1) * input.perPage;

      const where = input.search
        ? {
          OR: [
            {
              project: {
                name: {
                  contains: input.search,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              investor: {
                firstName: {
                  contains: input.search,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              investor: {
                lastName: {
                  contains: input.search,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
        : {};

      const [projectViews, total] = await Promise.all([
        ctx.db.projectView.findMany({
          skip,
          take: input.perPage,
          where,
          orderBy: { createdAt: "desc" },
          include: {
            investor: {
              select: {
                firstName: true,
                lastName: true,
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
            project: {
              select: {
                name: true,
                Entrepreneur: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        }),
        ctx.db.projectView.count({ where }),
      ]);

      return {
        items: projectViews as ProjectViewWithRelations[],
        total,
        pages: Math.ceil(total / input.perPage),
      };
    }),
});