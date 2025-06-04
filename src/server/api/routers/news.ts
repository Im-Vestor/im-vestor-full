import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Client } from '@notionhq/client';
import { type UserType } from '@prisma/client';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc';
import { env } from '~/env';

const notion = new Client({
  auth: env.NOTION_API_KEY,
});

export const newsRouter = createTRPCRouter({
  // Get general news (for all users or public)
  getGeneralNews: publicProcedure.query(async () => {
    try {
      if (!env.NOTION_NEWS_PAGE_ID) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'News page not configured',
        });
      }

      const response = await notion.blocks.children.list({
        block_id: env.NOTION_NEWS_PAGE_ID,
        page_size: 50,
      });

      return {
        blocks: response.results,
        hasMore: response.has_more,
        nextCursor: response.next_cursor,
      };
    } catch (error) {
      console.error('Error fetching general news:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch news',
      });
    }
  }),

  // Get news specific to user type (gets user type from Clerk session)
  getUserTypeNews: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Get user type from Clerk's session metadata
        const userType = ctx.auth.sessionClaims?.publicMetadata?.userType as string;

        if (!userType) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'User type not found in session metadata',
          });
        }

        console.log('User type from Clerk:', userType);

        let pageId: string | undefined;

        switch (userType) {
          case 'ENTREPRENEUR':
            pageId = env.NOTION_PAGE_ID_ENTREPRENEUR;
            break;
          case 'INVESTOR':
            pageId = env.NOTION_PAGE_ID_INVESTOR;
            break;
          case 'PARTNER':
            pageId = env.NOTION_PAGE_ID_PARTNER;
            break;
          case 'VC_GROUP':
            // VC Groups get investor content as they're investment-focused
            pageId = env.NOTION_PAGE_ID_INVESTOR;
            break;
          case 'INCUBATOR':
            // Incubators get partner content as they work with partnerships
            pageId = env.NOTION_PAGE_ID_PARTNER;
            break;
          case 'ADMIN':
            // Admins get general news
            pageId = env.NOTION_NEWS_PAGE_ID;
            break;
        }

        if (!pageId) {
          // Fallback to general news if specific page not configured
          pageId = env.NOTION_NEWS_PAGE_ID;
        }

        console.log('Using page ID:', pageId);

        if (!pageId) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `News page not configured for user type: ${userType}`,
          });
        }

        // Check if Notion API key is configured
        if (!env.NOTION_API_KEY) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Notion API key not configured',
          });
        }

        console.log('Making Notion API call...');

        const response = await notion.blocks.children.list({
          block_id: pageId,
          page_size: 50,
          start_cursor: input.cursor,
        });

        console.log('Notion API response received, blocks count:', response.results.length);

        return {
          blocks: response.results,
          hasMore: response.has_more,
          nextCursor: response.next_cursor,
          userType: userType as UserType, // Return the user type for reference
        };
      } catch (error) {
        console.error('Detailed error in getUserTypeNews:', error);

        // Provide more specific error messages
        if (error instanceof TRPCError) {
          throw error;
        }

        if (error instanceof Error) {
          if (error.message.includes('page_not_found')) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Notion page not found. Please check if the page ID is correct and the integration has access to it.',
            });
          }

          if (error.message.includes('unauthorized')) {
            throw new TRPCError({
              code: 'UNAUTHORIZED',
              message: 'Notion API unauthorized. Please check if the API key is correct and the integration has access to the page.',
            });
          }

          if (error.message.includes('rate_limited')) {
            throw new TRPCError({
              code: 'TOO_MANY_REQUESTS',
              message: 'Notion API rate limit exceeded. Please try again later.',
            });
          }

          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Notion API error: ${error.message}`,
          });
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch news',
        });
      }
    }),

  // Get page info (title, etc.)
  getPageInfo: publicProcedure
    .input(
      z.object({
        pageId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const page = await notion.pages.retrieve({
          page_id: input.pageId,
        });

        return page;
      } catch (error) {
        console.error('Error fetching page info:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch page info',
        });
      }
    }),

  // Get individual page content by page ID
  getPageContent: publicProcedure
    .input(
      z.object({
        pageId: z.string(),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        // Check if Notion API key is configured
        if (!env.NOTION_API_KEY) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Notion API key not configured',
          });
        }

        console.log('Fetching page content for:', input.pageId);

        // Get page info first
        const page = await notion.pages.retrieve({
          page_id: input.pageId,
        });

        // Get page blocks
        const response = await notion.blocks.children.list({
          block_id: input.pageId,
          page_size: 50,
          start_cursor: input.cursor,
        });

        console.log('Page content response received, blocks count:', response.results.length);

        return {
          page,
          blocks: response.results,
          hasMore: response.has_more,
          nextCursor: response.next_cursor,
        };
      } catch (error) {
        console.error('Detailed error in getPageContent:', error);

        if (error instanceof Error) {
          if (error.message.includes('page_not_found')) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Notion page not found. Please check if the page ID is correct and the integration has access to it.',
            });
          }

          if (error.message.includes('unauthorized')) {
            throw new TRPCError({
              code: 'UNAUTHORIZED',
              message: 'Notion API unauthorized. Please check if the API key is correct and the integration has access to the page.',
            });
          }

          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Notion API error: ${error.message}`,
          });
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch page content',
        });
      }
    }),
});