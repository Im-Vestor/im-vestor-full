// Utility functions for working with Notion data

export function extractPageTitle(page: any): string {
  if (!page) return 'Untitled';

  // Try to get title from properties
  if (page.properties) {
    const titleProperty = Object.values(page.properties).find((prop: any) =>
      prop.type === 'title'
    ) as any;

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

export function getPageIcon(page: any): string {
  if (!page) return '📄';

  if (page.icon) {
    if (page.icon.type === 'emoji') {
      return page.icon.emoji;
    }
    if (page.icon.type === 'external' || page.icon.type === 'file') {
      return '📄'; // Fallback for image icons
    }
  }

  return '📄';
}

export function getPageDescription(page: any): string {
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