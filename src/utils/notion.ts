// Utility functions for working with Notion data
import { type BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";

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

export function getPageDescription(page: NotionPage): string {
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

  return 'Notion Page';
}