import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc';
import { ProjectStage, UserType } from '@prisma/client';
import { clerkClient } from '@clerk/nextjs/server';
import { createReferralLink, generateCode } from '~/utils/referral';
import { sendEmail } from '~/utils/email';

export const vcGroupRouter = createTRPCRouter({
  getByUserId: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.vcGroup.findUnique({
      where: { userId: ctx.auth.userId },
      include: {
        members: true,
        country: true,
        state: true,
        interestedAreas: true,
        favoriteProjects: true,
        investedProjects: true,
      },
    });
  }),

  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return await ctx.db.vcGroup.findUnique({
      where: { id: input.id },
      include: {
        members: true,
        country: true,
        state: true,
        interestedAreas: true,
        favoriteProjects: true,
      },
    });
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

      return ctx.db.vcGroup.findUnique({
        where: { userId: input.userId },
        include: {
          members: true,
          country: true,
          state: true,
          interestedAreas: true,
          investedProjects: true,
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
        ownerEmail: z.string().email(),
        ownerPhone: z.string().optional(),
        referralToken: z.string().optional(),
        linkedinUrl: z.string().optional(),
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
          userType: UserType.VC_GROUP,
        },
        password: input.password,
        skipPasswordChecks: true,
      });

      const user = await ctx.db.user.create({
        data: {
          id: clerkUser.id,
          email: input.email,
          referralCode: generateCode(),
          userType: UserType.VC_GROUP,
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

      return ctx.db.vcGroup.create({
        data: {
          userId: user.id,
          name: input.name,
          bio: input.bio,
          phone: input.phone,
          email: input.email,
          stateId: input.stateId,
          countryId: input.countryId,
          linkedinUrl: input.linkedinUrl,
          members: {
            create: {
              name: input.ownerName,
              role: input.ownerRole,
              email: input.ownerEmail,
              phone: input.ownerPhone,
              owner: true,
            },
          },
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
        managedCapital: z.number().optional(),
        averageInvestmentSize: z.number().optional(),
        brochureUrl: z.string().optional(),
        investmentPolicy: z.string().optional(),
        principalStartups: z.string().optional(),
        principalExits: z.string().optional(),
        linkedinUrl: z.string().optional(),
        youtubeUrl: z.string().optional(),
        instagram: z.string().optional(),
        twitter: z.string().optional(),

        interestedAreas: z.array(z.number()),
        stages: z.array(z.nativeEnum(ProjectStage)),
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

      await ctx.db.vcGroup.update({
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
          managedCapital: input.managedCapital,
          averageInvestmentSize: input.averageInvestmentSize,
          brochureUrl: input.brochureUrl,
          investmentPolicy: input.investmentPolicy,
          principalStartups: input.principalStartups,
          principalExits: input.principalExits,
          linkedinUrl: input.linkedinUrl,
          youtubeUrl: input.youtubeUrl,
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
          interestedAreas: {
            connect: input.interestedAreas.map(area => ({
              id: area.toString(),
            })),
          },
          stages: input.stages,
        },
      });
    }),

  // Member CRUD operations
  getMembers: protectedProcedure.query(async ({ ctx }) => {
    const vcGroup = await ctx.db.vcGroup.findUnique({
      where: { userId: ctx.auth.userId },
      include: { members: true },
    });

    if (!vcGroup) {
      throw new Error('VC Group not found');
    }

    return vcGroup.members;
  }),

  createMember: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        photo: z.string().optional(),
        role: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        owner: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const vcGroup = await ctx.db.vcGroup.findUnique({
        where: { userId: ctx.auth.userId },
      });

      if (!vcGroup) {
        throw new Error('VC Group not found');
      }

      return await ctx.db.vcGroupMember.create({
        data: {
          ...input,
          vcGroupId: vcGroup.id,
        },
      });
    }),

  updateMember: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        photo: z.string().optional(),
        role: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        owner: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Verify the member belongs to the user's VC group
      const member = await ctx.db.vcGroupMember.findFirst({
        where: {
          id,
          vcGroup: { userId: ctx.auth.userId },
        },
      });

      if (!member) {
        throw new Error('Member not found or access denied');
      }

      return await ctx.db.vcGroupMember.update({
        where: { id },
        data: updateData,
      });
    }),

  deleteMember: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify the member belongs to the user's VC group
      const member = await ctx.db.vcGroupMember.findFirst({
        where: {
          id: input.id,
          vcGroup: { userId: ctx.auth.userId },
        },
      });

      if (!member) {
        throw new Error('Member not found or access denied');
      }

      // Prevent deleting the only owner
      if (member.owner) {
        const ownerCount = await ctx.db.vcGroupMember.count({
          where: {
            vcGroup: { userId: ctx.auth.userId },
            owner: true,
          },
        });

        if (ownerCount <= 1) {
          throw new Error(
            'Cannot delete the only owner. Please assign another member as owner first.'
          );
        }
      }

      return await ctx.db.vcGroupMember.delete({
        where: { id: input.id },
      });
    }),

  shareProject: protectedProcedure
    .input(z.object({ projectId: z.string(), currentUserEmail: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const vcGroup = await ctx.db.vcGroup.findUnique({
        where: { userId: ctx.auth.userId },
        include: {
          members: true,
        },
      });

      if (!vcGroup) {
        throw new Error('VC Group not found');
      }

      const vcMembersWithoutCurrentUser = vcGroup.members.filter(
        member => member.email !== input.currentUserEmail
      );

      const memberThatSharedTheProject = vcGroup.members.find(
        member => member.email === input.currentUserEmail
      );

      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
      });

      console.log('vcMembersWithoutCurrentUser', vcMembersWithoutCurrentUser);
      console.log('memberThatSharedTheProject', memberThatSharedTheProject);
      console.log('project', project);
      console.log('currentUserEmail', input.currentUserEmail);

      for (const member of vcMembersWithoutCurrentUser) {
        await sendEmail(
          member.name,
          `See ${project?.name} on Im-Vestor.`,
          `${memberThatSharedTheProject?.name} has shared a project with you.`,
          member.email,
          `See ${project?.name} on Im-Vestor.`,
          `https://www.im-vestor.com/companies/${input.projectId}`,
          'See Project'
        );
      }
    }),
});
