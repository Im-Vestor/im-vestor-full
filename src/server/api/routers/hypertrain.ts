import { HyperTrainItemType } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc';

export const hypertrainRouter = createTRPCRouter({
  getHyperTrainItems: publicProcedure.query(async ({ ctx }) => {
    const hypertrainItems = await ctx.db.hyperTrainItem.findMany({
      where: {
        liveUntil: {
          gte: new Date(),
        },
      },
    });
    return hypertrainItems;
  }),
  getHyperTrainItemByExternalId: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const hypertrainItem = await ctx.db.hyperTrainItem.findUnique({
      where: {
        externalId: input,
        liveUntil: {
          gte: new Date(),
        },
      },
    });

    return hypertrainItem;
  }),
  createHyperTrainItem: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        image: z.string().optional(),
        link: z.string(),
        type: z.nativeEnum(HyperTrainItemType),
        liveUntil: z.date(),
        externalId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const existingItem = await ctx.db.hyperTrainItem.findUnique({
          where: {
            externalId: input.externalId,
          },
        });

        if (existingItem) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Item already exists',
          });
        }

        const hypertrainItem = await ctx.db.hyperTrainItem.create({
          data: {
            name: input.name,
            description: input.description,
            image: input.image,
            link: input.link,
            type: input.type,
            liveUntil: input.liveUntil,
            externalId: input.externalId,
          },
        });

        return hypertrainItem;
      } catch (error) {
        console.error('Error creating hypertrain item:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create hypertrain item',
        });
      }
    }),

  updateHyperTrainItem: protectedProcedure
    .input(
      z.object({
        externalId: z.string(),
        description: z.string().max(150, 'Description must be at most 150 characters').optional(),
        image: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const existingItem = await ctx.db.hyperTrainItem.findUnique({
          where: {
            externalId: input.externalId,
          },
        });

        if (!existingItem) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Hypertrain item not found',
          });
        }

        const updatedItem = await ctx.db.hyperTrainItem.update({
          where: {
            externalId: input.externalId,
          },
          data: {
            description: input.description,
            image: input.image,
            updatedAt: new Date(),
          },
        });

        return updatedItem;
      } catch (error) {
        console.error('Error updating hypertrain item:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update hypertrain item',
        });
      }
    }),
});
