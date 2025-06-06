import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { type BlockObjectResponse, type PartialBlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';

// Type definitions for Notion block content
interface NotionRichText {
  type: string;
  plain_text: string;
  href?: string;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
    color?: string;
  };
}

interface NotionBlockContent {
  rich_text?: NotionRichText[];
  checked?: boolean;
  caption?: NotionRichText[];
  file?: { url: string };
  external?: { url: string };
  icon?: { type: 'emoji'; emoji: string } | { type: 'external'; external: { url: string } };
  title?: string;
  children?: (BlockObjectResponse | PartialBlockObjectResponse)[];
  url?: string;
  name?: string;
}

interface NotionBlockRendererProps {
  blocks: (BlockObjectResponse | PartialBlockObjectResponse)[];
  className?: string;
}

export const NotionBlockRenderer: React.FC<NotionBlockRendererProps> = ({ blocks, className = '' }) => {
  const renderBlock = (block: BlockObjectResponse | PartialBlockObjectResponse): React.ReactNode => {
    if (!('type' in block)) return null;

    const { type, id } = block;
    const value = (block as unknown as Record<string, NotionBlockContent>)[type] ?? {};

    switch (type) {
      case 'paragraph':
        return (
          <p key={id} className="mb-4 text-white dark:text-gray-300 leading-relaxed">
            <RichText text={value?.rich_text ?? []} />
          </p>
        );

      case 'heading_1':
        return (
          <h1 key={id} className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
            <RichText text={value?.rich_text ?? []} />
          </h1>
        );

      case 'heading_2':
        return (
          <h2 key={id} className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            <RichText text={value?.rich_text ?? []} />
          </h2>
        );

      case 'heading_3':
        return (
          <h3 key={id} className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
            <RichText text={value?.rich_text ?? []} />
          </h3>
        );

      case 'bulleted_list_item':
        return (
          <li key={id} className="mb-2 text-white dark:text-gray-300 ml-4">
            <RichText text={value?.rich_text ?? []} />
          </li>
        );

      case 'numbered_list_item':
        return (
          <li key={id} className="mb-2 text-white dark:text-gray-300 ml-4">
            <RichText text={value?.rich_text ?? []} />
          </li>
        );

      case 'to_do':
        return (
          <div key={id} className="flex items-start mb-2">
            <input
              type="checkbox"
              checked={value?.checked ?? false}
              readOnly
              className="mt-1 mr-3 accent-blue-500"
            />
            <span className={`text-white dark:text-gray-300 ${value?.checked ? 'line-through opacity-60' : ''}`}>
              <RichText text={value?.rich_text ?? []} />
            </span>
          </div>
        );

      case 'quote':
        return (
          <blockquote key={id} className="mb-4 pl-4 border-l-4 border-blue-500 italic text-gray-600 dark:text-gray-400">
            <RichText text={value?.rich_text ?? []} />
          </blockquote>
        );

      case 'code':
        return (
          <pre key={id} className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
            <code className="text-sm font-mono text-gray-800 dark:text-gray-200">
              <RichText text={value?.rich_text ?? []} />
            </code>
          </pre>
        );

      case 'divider':
        return <hr key={id} className="my-8 border-gray-300 dark:border-white" />;

      case 'image':
        const imageUrl = value?.file?.url ?? value?.external?.url;
        const caption = value?.caption?.[0]?.plain_text;
        return (
          <div key={id} className="mb-6">
            {imageUrl && (
              <Image
                src={imageUrl}
                alt={caption ?? 'Image'}
                width={800}
                height={600}
                className="w-full h-auto rounded-lg shadow-lg"
                priority={false}
              />
            )}
            {caption && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                {caption}
              </p>
            )}
          </div>
        );

      case 'video':
        const videoUrl = value?.file?.url ?? value?.external?.url;
        return (
          <div key={id} className="mb-6">
            {videoUrl && (
              <video
                controls
                className="w-full h-auto rounded-lg shadow-lg"
                src={videoUrl}
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        );

      case 'callout':
        return (
          <div key={id} className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg">
            <div className="flex items-start">
              {value?.icon && (
                <span className="mr-3 text-lg">
                  {value.icon.type === 'emoji' ? value.icon.emoji : '💡'}
                </span>
              )}
              <div className="text-blue-800 dark:text-blue-200">
                <RichText text={value?.rich_text ?? []} />
              </div>
            </div>
          </div>
        );

      case 'toggle':
        return (
          <details key={id} className="mb-4 border border-gray-200 dark:border-white rounded-lg">
            <summary className="p-3 bg-gray-50 dark:bg-gray-800 cursor-pointer font-medium">
              <RichText text={value?.rich_text ?? []} />
            </summary>
            <div className="p-3">
              {value?.children && <NotionBlockRenderer blocks={value.children} />}
            </div>
          </details>
        );

      case 'child_page':
        return (
          <Link key={id} href={`/news/page/${id}`}>
            <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white flex items-center justify-center text-lg group-hover:from-blue-600 group-hover:to-indigo-700 transition-all duration-200 shadow-sm">
                    📄
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-900 dark:group-hover:text-blue-100 transition-colors duration-200 text-lg">
                    {value?.title ?? 'Untitled Page'}
                  </h4>
                  <p className="text-blue-700 dark:text-blue-300 group-hover:text-blue-800 dark:group-hover:text-blue-200 transition-colors duration-200 flex items-center gap-1 mt-1">
                    <span>Click to read more</span>
                    <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                  </p>
                </div>
              </div>
            </div>
          </Link>
        );

      case 'child_database':
        return (
          <div key={id} className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-green-500 rounded text-white flex items-center justify-center text-sm">
                  🗃️
                </div>
              </div>
              <div>
                <h4 className="font-medium text-green-900 dark:text-green-100">
                  {value?.title ?? 'Untitled Database'}
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Database (click to view in Notion)
                </p>
              </div>
            </div>
          </div>
        );

      case 'embed':
        const embedUrl = value?.url;
        return (
          <div key={id} className="mb-6">
            {embedUrl && (
              <div className="aspect-video">
                <iframe
                  src={embedUrl}
                  className="w-full h-full rounded-lg border border-gray-200 dark:border-gray-700"
                  allowFullScreen
                  title="Embedded content"
                />
              </div>
            )}
            {value?.caption && value.caption.length > 0 && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                <RichText text={value.caption} />
              </p>
            )}
          </div>
        );

      case 'bookmark':
        const bookmarkUrl = value?.url;
        const bookmarkCaption = value?.caption;
        return (
          <div key={id} className="mb-6">
            {bookmarkUrl && (
              <a
                href={bookmarkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors"
              >
                <div className="text-blue-600 dark:text-blue-400 hover:underline">
                  {bookmarkCaption?.[0]?.plain_text ?? bookmarkUrl}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {bookmarkUrl}
                </div>
              </a>
            )}
          </div>
        );

      case 'file':
        const fileUrl = value?.file?.url ?? value?.external?.url;
        const fileName = value?.name ?? (value?.file as { name?: string })?.name;
        return (
          <div key={id} className="mb-6">
            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="text-2xl">📎</span>
                <span className="text-gray-900 dark:text-gray-100">{fileName ?? 'Download file'}</span>
              </a>
            )}
            {value?.caption && value.caption.length > 0 && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                <RichText text={value.caption} />
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const groupConsecutiveListItems = (blocks: (BlockObjectResponse | PartialBlockObjectResponse)[]) => {
    const grouped: (BlockObjectResponse | PartialBlockObjectResponse | (BlockObjectResponse | PartialBlockObjectResponse)[])[] = [];
    let currentBulletList: (BlockObjectResponse | PartialBlockObjectResponse)[] = [];
    let currentNumberedList: (BlockObjectResponse | PartialBlockObjectResponse)[] = [];

    blocks.forEach((block) => {
      if (!('type' in block)) {
        if (currentBulletList.length > 0) {
          grouped.push([...currentBulletList]);
          currentBulletList = [];
        }
        if (currentNumberedList.length > 0) {
          grouped.push([...currentNumberedList]);
          currentNumberedList = [];
        }
        grouped.push(block);
        return;
      }

      if (block.type === 'bulleted_list_item') {
        if (currentNumberedList.length > 0) {
          grouped.push([...currentNumberedList]);
          currentNumberedList = [];
        }
        currentBulletList.push(block);
      } else if (block.type === 'numbered_list_item') {
        if (currentBulletList.length > 0) {
          grouped.push([...currentBulletList]);
          currentBulletList = [];
        }
        currentNumberedList.push(block);
      } else {
        if (currentBulletList.length > 0) {
          grouped.push([...currentBulletList]);
          currentBulletList = [];
        }
        if (currentNumberedList.length > 0) {
          grouped.push([...currentNumberedList]);
          currentNumberedList = [];
        }
        grouped.push(block);
      }
    });

    if (currentBulletList.length > 0) {
      grouped.push([...currentBulletList]);
    }
    if (currentNumberedList.length > 0) {
      grouped.push([...currentNumberedList]);
    }

    return grouped;
  };

  const groupedBlocks = groupConsecutiveListItems(blocks);

  return (
    <div className={`notion-content ${className}`}>
      {groupedBlocks.map((blockOrGroup, index) => {
        if (Array.isArray(blockOrGroup)) {
          const firstBlock = blockOrGroup[0];
          if (!firstBlock || !('type' in firstBlock)) return null;

          if (firstBlock.type === 'bulleted_list_item') {
            return (
              <ul key={`ul-${index}`} className="mb-4 list-disc list-inside space-y-1">
                {blockOrGroup.map(renderBlock)}
              </ul>
            );
          } else if (firstBlock.type === 'numbered_list_item') {
            return (
              <ol key={`ol-${index}`} className="mb-4 list-decimal list-inside space-y-1">
                {blockOrGroup.map(renderBlock)}
              </ol>
            );
          }
        }
        return renderBlock(blockOrGroup as BlockObjectResponse | PartialBlockObjectResponse);
      })}
    </div>
  );
};

// Rich text renderer for handling formatted text
const RichText: React.FC<{ text: NotionRichText[] }> = ({ text }) => {
  if (!text || !Array.isArray(text)) return null;

  return (
    <>
      {text.map((value, index) => {
        const {
          annotations = {},
          plain_text: content = '',
          href,
        } = value;

        const {
          bold = false,
          code = false,
          color = 'default',
          italic = false,
          strikethrough = false,
          underline = false,
        } = annotations;

        let className = '';
        if (bold) className += 'font-bold ';
        if (italic) className += 'italic ';
        if (strikethrough) className += 'line-through ';
        if (underline) className += 'underline ';
        if (code) className += 'font-mono bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded text-sm ';

        if (color && color !== 'default') {
          className += `text-${color}-600 dark:text-${color}-400 `;
        }

        if (href) {
          return (
            <a
              key={index}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${className} text-blue-600 dark:text-blue-400 hover:underline`}
            >
              {content}
            </a>
          );
        }

        return (
          <span key={index} className={className}>
            {content}
          </span>
        );
      })}
    </>
  );
};