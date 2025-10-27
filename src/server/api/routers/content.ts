import { z } from 'zod';
import { createTRPCRouter, publicProcedure, adminProcedure } from '~/server/api/trpc';

export const contentRouter = createTRPCRouter({
  getByKey: publicProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ ctx, input }) => {
      const content = await ctx.db.siteContent.findUnique({
        where: { key: input.key },
      });
      return content ?? null;
    }),

  upsertByKey: adminProcedure
    .input(z.object({
      key: z.string(),
      title: z.string().min(1),
      contentHtml: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const saved = await ctx.db.siteContent.upsert({
        where: { key: input.key },
        update: { title: input.title, contentHtml: input.contentHtml },
        create: { key: input.key, title: input.title, contentHtml: input.contentHtml },
      });
      return saved;
    }),
});


