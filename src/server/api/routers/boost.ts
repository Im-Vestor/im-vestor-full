import { z } from 'zod';
import { db } from '~/server/db';
import { sendEmail } from '~/utils/email';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { addDays } from 'date-fns';

export const boostRouter = createTRPCRouter({
  boostProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { projectId } = input;

      // fetch entrepreneur -> send poke in notification and email -> remove 1 poke from entrepreneur

      const entrepreneur = await db.entrepreneur.findUnique({
        where: { userId: ctx.auth.userId },
        include: {
          user: true,
        },
      });

      if (!entrepreneur) {
        throw new Error('Entrepreneur not found');
      }

      const user = await db.user.findUnique({
        where: { id: ctx.auth.userId },
        include: {
          entrepreneur: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const project = await db.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      if (project.entrepreneurId !== entrepreneur.id) {
        throw new Error('Project does not belong to entrepreneur');
      }

      if (project.boostedUntil !== null && project.boostedUntil > new Date()) {
        throw new Error('Project is already boosted');
      }

      if (user.availableBoosts <= 0) {
        throw new Error('You do not have any boosts available');
      }

      // update project
      await ctx.db.project.update({
        where: { id: projectId },
        data: {
          boostedUntil: addDays(new Date(), 30),
        },
      });

      // send email
      await sendEmail(
        entrepreneur.firstName + ' ' + entrepreneur.lastName,
        'Your project has been boosted!',
        'Now it will be visible on the top of the list!',
        [entrepreneur.user.email],
        'Your project has been boosted!'
      );

      // remove 1 boost from user
      await ctx.db.user.update({
        where: { id: user.id },
        data: {
          availableBoosts: { decrement: 1 },
        },
      });
    }),
});
