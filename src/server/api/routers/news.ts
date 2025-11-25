import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Client } from '@notionhq/client';
import { type BlockObjectResponse, type PartialBlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';
import { env } from '~/env';
import { type NewsUserType, getNewsSectionTitle } from '~/types/news';

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

  // Get news specific to user type (gets user type from input parameter or Clerk session or defaults to entrepreneur)
  // Returns posts from GERAL page + posts from user type specific page
  getUserTypeNews: publicProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        userType: z.enum(['ENTREPRENEUR', 'INVESTOR', 'PARTNER', 'VC_GROUP', 'INCUBATOR', 'ADMIN']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Get user type from input parameter first, then from Clerk's session metadata, fallback to entrepreneur for public access
        const userType = (input.userType ??
          ctx.auth?.sessionClaims?.publicMetadata?.userType ??
          'ENTREPRENEUR') as NewsUserType;

        console.log('User type being used:', userType);

        let userTypePageId: string | undefined;
        const sectionTitle = getNewsSectionTitle(userType);

        // Get the user type specific page ID - each user type has its own page with the same name
        switch (userType) {
          case 'ENTREPRENEUR':
            userTypePageId = env.NOTION_PAGE_ID_ENTREPRENEUR;
            break;
          case 'INVESTOR':
            userTypePageId = env.NOTION_PAGE_ID_INVESTOR;
            break;
          case 'PARTNER':
            userTypePageId = env.NOTION_PAGE_ID_PARTNER;
            break;
          case 'VC_GROUP':
            userTypePageId = env.NOTION_PAGE_ID_VC_GROUP;
            break;
          case 'INCUBATOR':
            userTypePageId = env.NOTION_PAGE_ID_INCUBATOR;
            break;
          case 'ADMIN':
            // Admins don't have a specific page, will only get general news
            userTypePageId = undefined;
            break;
          default:
            // Fallback to entrepreneur content
            userTypePageId = env.NOTION_PAGE_ID_ENTREPRENEUR;
            break;
        }

        // Check if Notion API key is configured
        if (!env.NOTION_API_KEY) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Notion API key not configured',
          });
        }

        const allBlocks: Array<BlockObjectResponse | PartialBlockObjectResponse> = [];
        const seenPageIds = new Set<string>();

        // Fetch posts from GERAL page (NOTION_PAGE_ID_GERAL)
        if (env.NOTION_PAGE_ID_GERAL) {
          try {
            console.log('Fetching posts from GERAL page:', env.NOTION_PAGE_ID_GERAL);
            const generalResponse = await notion.blocks.children.list({
              block_id: env.NOTION_PAGE_ID_GERAL,
              page_size: 50,
            });

            // Add general posts to the list
            for (const block of generalResponse.results) {
              if ('type' in block && block.type === 'child_page' && !seenPageIds.has(block.id)) {
                allBlocks.push(block);
                seenPageIds.add(block.id);
              }
            }

            console.log('GERAL posts fetched:', generalResponse.results.length);
          } catch (error) {
            console.error('Error fetching GERAL posts:', error);
            // Continue even if GERAL page fails
          }
        }

        // Fetch posts from user type specific page
        if (userTypePageId) {
          try {
            console.log('Fetching posts from user type page:', userTypePageId);
            const userTypeResponse = await notion.blocks.children.list({
              block_id: userTypePageId,
              page_size: 50,
              start_cursor: input.cursor,
            });

            // Add user type specific posts to the list
            for (const block of userTypeResponse.results) {
              if ('type' in block && block.type === 'child_page' && !seenPageIds.has(block.id)) {
                allBlocks.push(block);
                seenPageIds.add(block.id);
              }
            }

            console.log('User type posts fetched:', userTypeResponse.results.length);
          } catch (error) {
            console.error('Error fetching user type posts:', error);
            // Continue even if user type page fails
          }
        }

        // Sort blocks by created_time (newest first) if available
        allBlocks.sort((a, b) => {
          const timeA = a.created_time ? new Date(a.created_time).getTime() : 0;
          const timeB = b.created_time ? new Date(b.created_time).getTime() : 0;
          return timeB - timeA;
        });

        console.log('Total combined posts:', allBlocks.length);

        return {
          blocks: allBlocks,
          hasMore: false, // We're fetching all posts, so no pagination needed for now
          nextCursor: undefined,
          userType, // Return the user type for reference
          sectionTitle, // Return the appropriate section title
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
              message:
                'Notion page not found. Please check if the page ID is correct and the integration has access to it.',
            });
          }

          if (error.message.includes('unauthorized')) {
            throw new TRPCError({
              code: 'UNAUTHORIZED',
              message:
                'Notion API unauthorized. Please check if the API key is correct and the integration has access to the page.',
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
              message:
                'Notion page not found. Please check if the page ID is correct and the integration has access to it.',
            });
          }

          if (error.message.includes('unauthorized')) {
            throw new TRPCError({
              code: 'UNAUTHORIZED',
              message:
                'Notion API unauthorized. Please check if the API key is correct and the integration has access to the page.',
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
