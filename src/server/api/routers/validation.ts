import { clerkClient } from '@clerk/nextjs/server';
import { z } from 'zod';

import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';

export const validationRouter = createTRPCRouter({
  validateSignUp: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
        mobileFone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const fieldErrors: { email?: string; password?: string; mobileFone?: string } = {};

      // Email already in our DB
      const existingUser = await ctx.db.user.findUnique({ where: { email: input.email } });
      if (existingUser) {
        fieldErrors.email = 'Email already in use';
      }

      // Email already in Clerk
      try {
        const client = await clerkClient();
        const users = await client.users.getUserList({ emailAddress: [input.email] });
        if (Array.isArray(users) ? users.length > 0 : (users as any)?.totalCount > 0) {
          fieldErrors.email = 'Email already in use';
        }
      } catch {
        // ignore Clerk lookup failures for validation; don't block user
      }

      // Password rule aligned to current forms (min 8). Clerk will enforce stricter policies if configured.
      const password = input.password ?? '';
      if (password.length < 8) {
        fieldErrors.password = 'Password must be at least 8 characters';
      }

      // Mobile phone uniqueness across profiles
      const phone = input.mobileFone?.trim();
      if (phone) {
        const [existingInvestor, existingEntrepreneur, existingPartner] = await Promise.all([
          ctx.db.investor.findFirst({ where: { mobileFone: phone } }),
          ctx.db.entrepreneur.findFirst({ where: { mobileFone: phone } }),
          ctx.db.partner.findFirst({ where: { mobileFone: phone } }),
        ]);
        if (existingInvestor || existingEntrepreneur || existingPartner) {
          fieldErrors.mobileFone = 'Mobile phone already in use';
        }
      }

      const valid = Object.keys(fieldErrors).length === 0;
      return { valid, fieldErrors };
    }),
});


