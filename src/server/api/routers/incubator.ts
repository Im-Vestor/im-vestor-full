import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';
import { UserType } from '@prisma/client';
import { clerkClient } from '@clerk/nextjs/server';
import { createReferralLink, generateCode } from '~/utils/referral';

export const incubatorRouter = createTRPCRouter({
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
});
