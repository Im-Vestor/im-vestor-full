import { readFileSync } from 'fs';
import { join } from 'path';
import Head from 'next/head';
import type { GetStaticProps } from 'next';
import { useEffect } from 'react';

interface CampaignPageProps {
  htmlContent: string;
}

export default function CampaignPT({ htmlContent }: CampaignPageProps) {
  // Extract head content from HTML
  const headRegex = /<head[^>]*>([\s\S]*?)<\/head>/i;
  const headMatch = headRegex.exec(htmlContent);
  const headContent = headMatch ? headMatch[1] ?? '' : '';

  // Extract body content - everything between </head> and </body> or </html>
  const bodyStartRegex = /<\/head>/i;
  const bodyEndRegex = /<\/body>/i;
  const htmlEndRegex = /<\/html>/i;
  const bodyStartMatch = bodyStartRegex.exec(htmlContent);
  const bodyEndMatch = bodyEndRegex.exec(htmlContent);
  const htmlEndMatch = htmlEndRegex.exec(htmlContent);
  const endMatch = bodyEndMatch ?? htmlEndMatch;

  let bodyContent = htmlContent;
  if (bodyStartMatch && endMatch && bodyStartMatch.index !== undefined && endMatch.index !== undefined) {
    const startIndex = bodyStartMatch.index + bodyStartMatch[0].length;
    const endIndex = endMatch.index;
    bodyContent = htmlContent.substring(startIndex, endIndex).trim();
  }

  // Extract title from head
  const titleRegex = /<title[^>]*>([\s\S]*?)<\/title>/i;
  const titleMatch = headContent ? titleRegex.exec(headContent) : null;
  const title = titleMatch ? titleMatch[1]?.trim() ?? 'im-vestor.com — Campaign v3' : 'im-vestor.com — Campaign v3';

  // Extract styles from head
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  const styleMatches: string[] = [];
  let styleMatch;
  while ((styleMatch = styleRegex.exec(headContent)) !== null) {
    if (styleMatch[1]) {
      styleMatches.push(styleMatch[1]);
    }
  }
  const styles = styleMatches.join('\n');

  // Extract scripts from body content
  const scriptMatches: string[] = [];
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let scriptMatch;
  while ((scriptMatch = scriptRegex.exec(bodyContent)) !== null) {
    if (scriptMatch[1]) {
      scriptMatches.push(scriptMatch[1]);
    }
    // Remove script from body content
    if (scriptMatch[0]) {
      bodyContent = bodyContent.replace(scriptMatch[0], '');
    }
  }
  const scripts = scriptMatches.join('\n');

  // Execute scripts after component mounts
  useEffect(() => {
    if (scripts) {
      // Create and execute scripts
      const scriptElement = document.createElement('script');
      scriptElement.textContent = scripts;
      document.body.appendChild(scriptElement);

      return () => {
        // Cleanup
        if (scriptElement.parentNode) {
          scriptElement.parentNode.removeChild(scriptElement);
        }
      };
    }
  }, [scripts]);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Montserrat:wght@200;300;400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        <style>{`
          /* Override Tailwind CSS grid class to use flexbox */
          #campaign-page .grid {
            display: flex !important;
            gap: 28px !important;
            justify-content: center !important;
            flex-wrap: wrap !important;
          }
          /* Ensure body styles are applied */
          #campaign-page {
            background: var(--darker, #04040A);
            font-family: 'Montserrat', sans-serif;
            color: #fff;
            min-height: 100vh;
            overflow-x: hidden;
          }
        `}</style>
      </Head>
      <div id="campaign-page" dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const filePath = join(process.cwd(), 'im-vestor-campaign-v3-PT.html');
    const htmlContent = readFileSync(filePath, 'utf-8');

    return {
      props: {
        htmlContent,
      },
    };
  } catch (error) {
    console.error('Error reading HTML file:', error);
    return {
      props: {
        htmlContent: '<div>Error loading page</div>',
      },
    };
  }
};
