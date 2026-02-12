import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Client } from '@notionhq/client';
import {
  type BlockObjectResponse,
  type PartialBlockObjectResponse,
  type PageObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';
import { env } from '~/env';
import { type NewsUserType, getNewsSectionTitle } from '~/types/news';

const notion = new Client({
  auth: env.NOTION_API_KEY,
});

type NewsItem = BlockObjectResponse | PartialBlockObjectResponse | PageObjectResponse;

function isFullBlock(block: BlockObjectResponse | PartialBlockObjectResponse): block is BlockObjectResponse {
  return 'type' in block;
}

async function listAllBlockChildren(blockId: string) {
  const results: Array<BlockObjectResponse | PartialBlockObjectResponse> = [];
  let cursor: string | undefined = undefined;

  // Defensive pagination: Notion returns max 100, we use 50 to keep payloads smaller
  for (;;) {
    const resp = await notion.blocks.children.list({
      block_id: blockId,
      page_size: 50,
      start_cursor: cursor,
    });
    results.push(...resp.results);
    if (!resp.has_more || !resp.next_cursor) break;
    cursor = resp.next_cursor;
  }

  return results;
}

async function queryAllDatabasePages(databaseId: string) {
  const pages: PageObjectResponse[] = [];
  let cursor: string | undefined = undefined;

  for (;;) {
    const resp = await notion.databases.query({
      database_id: databaseId,
      page_size: 50,
      start_cursor: cursor,
    });

    for (const item of resp.results) {
      // Notion typings: resp.results are PageObjectResponse | PartialPageObjectResponse
      if ('object' in item && item.object === 'page') {
        pages.push(item as PageObjectResponse);
      }
    }

    if (!resp.has_more || !resp.next_cursor) break;
    cursor = resp.next_cursor;
  }

  return pages;
}

async function resolveGeneralPageIdFromNewsRoot() {
  if (!env.NOTION_NEWS_PAGE_ID) return undefined;

  const children = await listAllBlockChildren(env.NOTION_NEWS_PAGE_ID);
  const general = children.find((b) => {
    if (!isFullBlock(b) || b.type !== 'child_page') return false;
    const title = (b as any).child_page?.title as string | undefined;
    return title?.trim().toLowerCase() === 'geral';
  });
  return general?.id;
}

async function collectNewsItemsFromContainer(containerId: string) {
  const items: NewsItem[] = [];
  const seenIds = new Set<string>();

  // BFS through blocks to find child pages, databases, and links, even if nested (columns/toggles/etc.)
  const queue: Array<{ id: string; depth: number }> = [{ id: containerId, depth: 0 }];
  const MAX_DEPTH = 6;

  while (queue.length) {
    const current = queue.shift();
    if (!current) continue;
    if (current.depth > MAX_DEPTH) continue;

    const children = await listAllBlockChildren(current.id);

    for (const child of children) {
      if (isFullBlock(child) && child.type === 'child_page') {
        if (!seenIds.has(child.id)) {
          items.push(child);
          seenIds.add(child.id);
        }
        continue;
      }

      if (isFullBlock(child) && child.type === 'child_database') {
        try {
          const pages = await queryAllDatabasePages(child.id);
          for (const page of pages) {
            if (!seenIds.has(page.id)) {
              items.push(page);
              seenIds.add(page.id);
            }
          }
        } catch {
          // ignore databases we can't access
        }
        continue;
      }

      if (isFullBlock(child) && child.type === 'link_to_page') {
        const link = (child as any).link_to_page as
          | { type: 'page_id'; page_id: string }
          | { type: 'database_id'; database_id: string };
        if (link.type === 'page_id') {
          const pageId = link.page_id;
          if (!seenIds.has(pageId)) {
            try {
              const page = await notion.pages.retrieve({ page_id: pageId });
              if ('object' in page && page.object === 'page') {
                items.push(page as PageObjectResponse);
                seenIds.add(pageId);
              }
            } catch {
              // ignore broken links / missing access
            }
          }
        } else if (link.type === 'database_id') {
          const dbId = link.database_id;
          try {
            const pages = await queryAllDatabasePages(dbId);
            for (const page of pages) {
              if (!seenIds.has(page.id)) {
                items.push(page);
                seenIds.add(page.id);
              }
            }
          } catch (error) {
            // ignore databases we can't access
          }
        }
        continue;
      }

      // Recurse into nested structures (columns, toggles, etc.)
      if (isFullBlock(child) && child.has_children) {
        queue.push({ id: child.id, depth: current.depth + 1 });
      }
    }
  }

  return items;
}

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
        limit: z.number().min(1).max(100).default(20),
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

        const allItems: NewsItem[] = [];
        const seenIds = new Set<string>();

        // Fetch posts from GERAL page (NOTION_PAGE_ID_GERAL)
        const generalContainerId =
          env.NOTION_PAGE_ID_GERAL ?? (await resolveGeneralPageIdFromNewsRoot());

        if (generalContainerId) {
          try {
            console.log('Fetching posts from GERAL container:', generalContainerId);
            const generalItems = await collectNewsItemsFromContainer(generalContainerId);
            for (const item of generalItems) {
              const id = item.id;
              if (!seenIds.has(id)) {
                allItems.push(item);
                seenIds.add(id);
              }
            }
            console.log('GERAL items collected:', generalItems.length);
          } catch (error) {
            console.error('Error fetching GERAL posts:', error);
            // Continue even if GERAL page fails
          }
        } else {
          console.warn(
            'GERAL container not configured (NOTION_PAGE_ID_GERAL) and could not be resolved from NOTION_NEWS_PAGE_ID.'
          );
        }

        // Fetch posts from user type specific page
        if (userTypePageId) {
          try {
            console.log('Fetching posts from user type page:', userTypePageId);
            const userItems = await collectNewsItemsFromContainer(userTypePageId);
            for (const item of userItems) {
              const id = item.id;
              if (!seenIds.has(id)) {
                allItems.push(item);
                seenIds.add(id);
              }
            }

            console.log('User type items collected:', userItems.length);
          } catch (error) {
            console.error('Error fetching user type posts:', error);
            // Continue even if user type page fails
          }
        }

        // Sort blocks by created_time (newest first) if available
        allItems.sort((a, b) => {
          const timeA = 'created_time' in a ? new Date(a.created_time).getTime() : 0;
          const timeB = 'created_time' in b ? new Date(b.created_time).getTime() : 0;
          return timeB - timeA;
        });

        console.log('Total combined items:', allItems.length);

        // Implement cursor-based pagination
        let startIndex = 0;
        if (input.cursor) {
          // Find the index of the item with the cursor timestamp
          startIndex = allItems.findIndex(item => {
            const itemTime = 'created_time' in item ? item.created_time : '';
            return itemTime === input.cursor;
          });
          // Start from the next item after the cursor
          startIndex = startIndex >= 0 ? startIndex + 1 : 0;
        }

        const paginatedItems = allItems.slice(startIndex, startIndex + input.limit);
        const hasMore = startIndex + input.limit < allItems.length;
        const lastItem = paginatedItems[paginatedItems.length - 1];
        const nextCursor = hasMore && lastItem && 'created_time' in lastItem
          ? lastItem.created_time
          : undefined;

        return {
          blocks: paginatedItems,
          hasMore,
          nextCursor,
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
