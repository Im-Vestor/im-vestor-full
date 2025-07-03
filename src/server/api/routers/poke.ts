import { NotificationType } from '@prisma/client';
import { z } from 'zod';
import { db } from '~/server/db';
import { sendEmail } from '~/utils/email';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { createNotifications } from './notifications';

export const pokeRouter = createTRPCRouter({
  sendPokeToInvestor: protectedProcedure
    .input(z.object({ investorId: z.string(), message: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { investorId, message } = input;

      // fetch investor -> send poke in notification and email -> remove 1 poke from entrepreneur

      const investor = await db.investor.findUnique({
        where: { id: investorId },
        include: {
          user: true,
        },
      });

      if (!investor) {
        throw new Error('Investor not found');
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

      const entrepreneur = user.entrepreneur;

      if (!entrepreneur) {
        throw new Error('Entrepreneur not found');
      }

      // send email
      await sendEmail(
        investor.firstName + ' ' + investor.lastName,
        message,
        'You have received a poke from ' +
          entrepreneur.firstName +
          ' ' +
          entrepreneur.lastName +
          '!',
        investor.user.email,
        'You have received a poke from ' +
          entrepreneur.firstName +
          ' ' +
          entrepreneur.lastName +
          '!',
        `https://www.im-vestor.com/entrepreneur/${entrepreneur.id}`,
        'Check out my profile!'
      );

      // send notification
      await createNotifications(ctx.db, [investor.user.id], NotificationType.POKE);

      // remove 1 poke from user
      await ctx.db.user.update({
        where: { id: user.id },
        data: {
          availablePokes: { decrement: 1 },
        },
      });
    }),
});
