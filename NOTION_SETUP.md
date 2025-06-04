# Notion News Integration Setup

This guide will help you set up the Notion integration for the news feature in your Im-Vestor application.

## Prerequisites

1. A Notion account
2. Admin access to your Notion workspace
3. Access to your application's environment variables

## Step 1: Create a Notion Integration

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Choose a name for your integration (e.g., "Im-Vestor News")
4. Select the workspace where you want to create the integration
5. Click "Submit"
6. Copy the "Internal Integration Token" - this will be your `NOTION_API_KEY`

## Step 2: Create Notion Pages for News Content

Create separate Notion pages for different user types and general news:

### Required Pages:
1. **General News Page** - For all users or fallback content
2. **Entrepreneur News Page** - Content specific to entrepreneurs
3. **Investor News Page** - Content specific to investors
4. **Partner News Page** - Content specific to partners

### To create each page:
1. Create a new page in your Notion workspace
2. Add content using any Notion blocks (text, headings, images, etc.)
3. Copy the page ID from the URL (the long string after the last `/`)

Example URL: `https://www.notion.so/My-News-Page-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
Page ID: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

## Step 3: Share Pages with Your Integration

For each page you created:
1. Click the "Share" button in the top-right corner
2. Click "Invite"
3. Search for your integration name and select it
4. Make sure it has "Read" access
5. Click "Invite"

## Step 4: Add Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Notion Integration
NOTION_API_KEY=secret_your_integration_token_here
NOTION_NEWS_PAGE_ID=your_general_news_page_id_here
NOTION_PAGE_ID_ENTREPRENEUR=your_entrepreneur_page_id_here
NOTION_PAGE_ID_INVESTOR=your_investor_page_id_here
NOTION_PAGE_ID_PARTNER=your_partner_page_id_here

# Legacy (if you have existing Notion integrations)
NOTION_PAGE_ID=your_main_page_id_here
```

## Step 5: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to `/news` in your application
3. You should be automatically redirected to your user-type specific news page
4. The content from your Notion pages should be displayed

## Supported Notion Block Types

The integration supports most common Notion block types:

- **Text blocks**: Paragraphs, headings (H1, H2, H3)
- **Lists**: Bulleted lists, numbered lists, to-do lists
- **Rich content**: Images, videos, code blocks
- **Interactive**: Callouts, quotes, toggles
- **Formatting**: Bold, italic, strikethrough, underline, inline code

## Troubleshooting

### "Page not configured" error
- Make sure the environment variable for the page ID is set correctly
- Verify the page ID is copied correctly (no extra characters)

### "Failed to fetch news" error
- Check that your `NOTION_API_KEY` is correct
- Ensure the integration has access to the pages
- Verify the pages exist and are not deleted

### Content not displaying
- Check the browser console for any JavaScript errors
- Ensure the pages have content (not empty)
- Try refreshing the page or clearing the cache

### Permission issues
- Make sure your integration has "Read" access to all the pages
- Check that the integration is added to the correct workspace

## Content Management Tips

1. **Organize content with headings** - Use H1, H2, H3 for better structure
2. **Use callouts for important information** - These will be highlighted in the UI
3. **Add images and videos** - They will be automatically displayed with proper styling
4. **Keep content updated** - The app caches content for 5 minutes for performance
5. **Use the refresh button** - Each news page has a refresh button to fetch latest content

## Security Notes

- Never commit your `NOTION_API_KEY` to version control
- The integration only has read access to shared pages
- Users can only see content from pages specific to their user type
- All API calls are made server-side for security

## Need Help?

If you encounter any issues:
1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Test the Notion API connection using Notion's API explorer
4. Ensure your integration has the correct permissions