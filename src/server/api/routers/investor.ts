import { clerkClient } from "@clerk/nextjs/server";
import { UserType, Currency } from "@prisma/client";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { createReferralLink, generateCode } from "~/utils/referral";

export const investorRouter = createTRPCRouter({
  getByUserId: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.investor.findUnique({
      where: { userId: ctx.auth.userId },
      include: {
        country: true,
        state: true,
      },
    });
  }),
  getInvestorsRelatedToEntrepreneur: protectedProcedure
    .input(z.object({ page: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        include: {
          entrepreneur: {
            include: {
              projects: true,
            },
          },
        },
      });

      const projectSectors = [
        ...new Set(
          user?.entrepreneur?.projects?.map((project) => project.sectorId),
        ),
      ];

      const investors = await ctx.db.investor.findMany({
        where: {
          areas: {
            some: {
              id: { in: projectSectors },
            },
          },
        },
        include: {
          country: true,
          state: true,
        },
        skip: input.page ? input.page * 10 : 0,
        take: 10,
      });

      return investors;
    }),
  create: publicProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        mobileFone: z.string().min(1),
        investmentMinValue: z.number(),
        investmentMaxValue: z.number(),
        investmentNetWorth: z.number(),
        investmentAnnualIncome: z.number(),
        birthDate: z.date(),
        referralToken: z.string().optional(),
        email: z.string().email(),
        password: z.string().min(8),
        currency: z.nativeEnum(Currency),
        areas: z.array(z.number()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userToCheck = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (userToCheck) {
        throw new Error("User already exists");
      }

      const client = await clerkClient();

      const clerkUser = await client.users.createUser({
        emailAddress: [input.email],
        firstName: input.firstName,
        lastName: input.lastName,
        publicMetadata: {
          userType: UserType.INVESTOR,
        },
        password: input.password,
        skipPasswordChecks: true,
      });

      if (!clerkUser) {
        throw new Error("Failed to create user in Clerk.");
      }

      const user = await ctx.db.user.create({
        data: {
          id: clerkUser ? clerkUser.id : "",
          email: input.email,
          referralCode: generateCode(),
          userType: UserType.INVESTOR,
        },
      });

      if (input.referralToken) {
        await createReferralLink(
          input.referralToken,
          user.id,
          input.firstName,
          input.lastName,
        );
      }

      return ctx.db.investor.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          mobileFone: input.mobileFone,
          investmentMinValue: input.investmentMinValue,
          investmentMaxValue: input.investmentMaxValue,
          investmentNetWorth: input.investmentNetWorth,
          investmentAnnualIncome: input.investmentAnnualIncome,
          birthDate: input.birthDate,
          currency: input.currency,
          userId: user.id,
          areas: {
            connect: input.areas.map((area) => ({
              id: area.toString(),
            })),
          },
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
      }),
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
});
