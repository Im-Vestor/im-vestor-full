// Utility functions for working with Notion data
import { type BlockObjectResponse, type PartialBlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";

// Type definitions for Notion page properties
interface NotionProperty {
  type: string;
  title?: Array<{ plain_text: string }>;
  rich_text?: Array<{ plain_text: string }>;
}

interface NotionPage {
  properties?: Record<string, NotionProperty>;
  child_page?: { title: string };
  icon?: {
    type: 'emoji' | 'external' | 'file';
    emoji?: string;
    external?: { url: string };
    file?: { url: string };
  };
}

export function extractPageTitle(page: NotionPage): string {
  if (!page) return 'Untitled';

  // Try to get title from properties
  if (page.properties) {
    const titleProperty = Object.values(page.properties).find((prop: NotionProperty) =>
      prop.type === 'title'
    );

    if (titleProperty?.title?.[0]?.plain_text) {
      return titleProperty.title[0].plain_text;
    }

    // For database pages, try common title property names
    const commonTitleProps = ['Name', 'Title', 'Page'];
    for (const propName of commonTitleProps) {
      const prop = page.properties[propName];
      if (prop?.title?.[0]?.plain_text) {
        return prop.title[0].plain_text;
      }
    }
  }

  // Try to get from the page object directly if it's a regular page
  if (page.child_page?.title) {
    return page.child_page.title;
  }

  return 'Untitled Page';
}

export function getPageIcon(page: NotionPage): string {
  if (!page) return '📄';

  if (page.icon) {
    if (page.icon.type === 'emoji' && page.icon.emoji) {
      return page.icon.emoji;
    }
    if (page.icon.type === 'external' || page.icon.type === 'file') {
      return '📄'; // Fallback for image icons
    }
  }

  return '📄';
}

export function getPageDescription(page: NotionPage) {
  // Try to get description from properties
  if (page?.properties) {
    const descProps = ['Description', 'Summary', 'Excerpt'];
    for (const propName of descProps) {
      const prop = page.properties[propName];
      if (prop?.rich_text?.[0]?.plain_text) {
        return prop.rich_text[0].plain_text;
      }
    }
  }
}

// Extract the first line of text from notion blocks to use as description
export function extractFirstLineFromBlocks(blocks: (BlockObjectResponse | PartialBlockObjectResponse)[]): string {
  if (!blocks || blocks.length === 0) return 'No content available';

  for (const block of blocks) {
    // Check if block has type property
    if (!('type' in block)) continue;

    // Handle different block types that contain text
    switch (block.type) {
      case 'paragraph':
        if ('paragraph' in block && block.paragraph?.rich_text?.[0]?.plain_text) {
          return block.paragraph.rich_text[0].plain_text;
        }
        break;
      case 'heading_1':
        if ('heading_1' in block && block.heading_1?.rich_text?.[0]?.plain_text) {
          return block.heading_1.rich_text[0].plain_text;
        }
        break;
      case 'heading_2':
        if ('heading_2' in block && block.heading_2?.rich_text?.[0]?.plain_text) {
          return block.heading_2.rich_text[0].plain_text;
        }
        break;
      case 'heading_3':
        if ('heading_3' in block && block.heading_3?.rich_text?.[0]?.plain_text) {
          return block.heading_3.rich_text[0].plain_text;
        }
        break;
      case 'bulleted_list_item':
        if ('bulleted_list_item' in block && block.bulleted_list_item?.rich_text?.[0]?.plain_text) {
          return block.bulleted_list_item.rich_text[0].plain_text;
        }
        break;
      case 'numbered_list_item':
        if ('numbered_list_item' in block && block.numbered_list_item?.rich_text?.[0]?.plain_text) {
          return block.numbered_list_item.rich_text[0].plain_text;
        }
        break;
      case 'quote':
        if ('quote' in block && block.quote?.rich_text?.[0]?.plain_text) {
          return block.quote.rich_text[0].plain_text;
        }
        break;
      case 'callout':
        if ('callout' in block && block.callout?.rich_text?.[0]?.plain_text) {
          return block.callout.rich_text[0].plain_text;
        }
        break;
      default:
        continue;
    }
  }

  return 'No text content found';
}

// Extract cover image from Notion page
export function getPageCoverImage(page: any): string | null {
  if (!page?.cover) return null;

  if (page.cover.type === 'external' && page.cover.external?.url) {
    return page.cover.external.url as string;
  } else if (page.cover.type === 'file' && page.cover.file?.url) {
    return page.cover.file.url as string;
  }

  return null;
}