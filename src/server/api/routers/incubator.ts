import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc';
import { UserType } from '@prisma/client';
import { clerkClient } from '@clerk/nextjs/server';
import { createReferralLink, generateCode } from '~/utils/referral';
import { sendEmail } from '~/utils/email';

export const incubatorRouter = createTRPCRouter({
  getByUserId: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.incubator.findUnique({
      where: { userId: ctx.auth.userId },
      include: {
        country: true,
        state: true,
        projects: true,
        areas: true,
        offers: true,
      },
    });
  }),
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        bio: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email(),
        password: z.string().min(8),
        stateId: z.number().optional(),
        countryId: z.number().optional(),
        ownerName: z.string().min(1),
        ownerRole: z.string().min(1),
        ownerPhone: z.string().optional(),
        ownerEmail: z.string().email(),
        referralToken: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userToCheck = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (userToCheck) {
        throw new Error('User already exists');
      }

      const client = await clerkClient();

      const clerkUser = await client.users.createUser({
        emailAddress: [input.email],
        firstName: input.name,
        publicMetadata: {
          userType: UserType.INCUBATOR,
        },
        password: input.password,
        skipPasswordChecks: true,
      });

      const user = await ctx.db.user.create({
        data: {
          id: clerkUser.id,
          email: input.email,
          referralCode: generateCode(),
          userType: UserType.INCUBATOR,
        },
      });

      if (input.referralToken) {
        await createReferralLink(input.referralToken, user.id, input.name, '');
      }

      await sendEmail(
        input.name,
        'Welcome to Im-Vestor!',
        'Thank you for signing up to Im-Vestor. We are excited to have you on board.',
        input.email,
        'Welcome to Im-Vestor!'
      );

      return ctx.db.incubator.create({
        data: {
          userId: user.id,
          name: input.name,
          bio: input.bio,
          phone: input.phone,
          email: input.email,
          stateId: input.stateId,
          countryId: input.countryId,
          ownerName: input.ownerName,
          ownerRole: input.ownerRole,
          ownerPhone: input.ownerPhone,
          ownerEmail: input.ownerEmail,
        },
      });
    }),
  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        bio: z.string().optional(),
        description: z.string().optional(),
        website: z.string().optional(),
        email: z.string().email(),
        stateId: z.number().optional(),
        countryId: z.number().optional(),
        logo: z.string().optional(),
        phone: z.string().optional(),
        openingDate: z.date().optional(),
        startupsIncubated: z.number().optional(),
        startupsInIncubator: z.number().optional(),
        brochureUrl: z.string().optional(),
        acceptStartupsOutsideRegion: z.boolean().optional(),
        linkedinUrl: z.string().optional(),
        facebook: z.string().optional(),
        instagram: z.string().optional(),
        twitter: z.string().optional(),

        areas: z.array(z.number()),
        offers: z.array(z.number()),

        associatedIncubators: z.string().optional(),
        associatedUniversities: z.string().optional(),
        activePrograms: z.string().optional(),

        ownerName: z.string().min(1).optional(),
        ownerEmail: z.string().email().optional(),
        ownerPhone: z.string().optional(),
        ownerRole: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log('input', input);

      if (input.logo) {
        await ctx.db.user.update({
          where: { id: ctx.auth.userId },
          data: {
            imageUrl: input.logo,
          },
        });
      }

      const incubator = await ctx.db.incubator.update({
        where: { userId: ctx.auth.userId },
        data: {
          name: input.name,
          bio: input.bio,
          description: input.description,
          website: input.website,
          email: input.email,
          logo: input.logo,
          phone: input.phone,
          openingDate: input.openingDate,
          startupsIncubated: input.startupsIncubated,
          startupsInIncubator: input.startupsInIncubator,
          acceptStartupsOutsideRegion: input.acceptStartupsOutsideRegion,
          ownerName: input.ownerName,
          ownerEmail: input.ownerEmail,
          ownerPhone: input.ownerPhone,
          ownerRole: input.ownerRole,
          activePrograms: input.activePrograms,
          associatedIncubators: input.associatedIncubators,
          associatedUniversities: input.associatedUniversities,
          brochureUrl: input.brochureUrl,
          linkedinUrl: input.linkedinUrl,
          facebook: input.facebook,
          instagram: input.instagram,
          twitter: input.twitter,
          state: {
            connect: {
              id: input.stateId,
            },
          },
          country: {
            connect: {
              id: input.countryId,
            },
          },
          areas: {
            connect: input.areas.map(area => ({
              id: area.toString(),
            })),
          },
          offers: {
            connect: input.offers.map(offer => ({
              id: offer.toString(),
            })),
          },
        },
      });

      return incubator;
    }),
});
