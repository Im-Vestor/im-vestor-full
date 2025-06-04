import { type BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { BlogPost } from "~/utils/notion";

interface BlogPostProps {
  post: BlogPost;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function renderBlock(block: BlockObjectResponse): JSX.Element {
  const { type, id } = block;

  switch (type) {
    case 'paragraph':
      return (
        <p key={id} className="mb-4 text-gray-700 leading-relaxed">
          {block.paragraph.rich_text.map((text, index) => (
            <span key={index} className={text.annotations.bold ? 'font-semibold' : ''}>
              {text.plain_text}
            </span>
          ))}
        </p>
      );

    case 'heading_1':
      return (
        <h1 key={id} className="text-3xl font-bold text-gray-900 mb-6 mt-8">
          {block.heading_1.rich_text.map(text => text.plain_text).join('')}
        </h1>
      );

    case 'heading_2':
      return (
        <h2 key={id} className="text-2xl font-semibold text-gray-900 mb-4 mt-6">
          {block.heading_2.rich_text.map(text => text.plain_text).join('')}
        </h2>
      );

    case 'heading_3':
      return (
        <h3 key={id} className="text-xl font-semibold text-gray-900 mb-3 mt-5">
          {block.heading_3.rich_text.map(text => text.plain_text).join('')}
        </h3>
      );

    case 'bulleted_list_item':
      return (
        <li key={id} className="mb-2 text-gray-700 ml-4">
          {block.bulleted_list_item.rich_text.map(text => text.plain_text).join('')}
        </li>
      );

    case 'numbered_list_item':
      return (
        <li key={id} className="mb-2 text-gray-700 ml-4">
          {block.numbered_list_item.rich_text.map(text => text.plain_text).join('')}
        </li>
      );

    case 'quote':
      return (
        <blockquote key={id} className="border-l-4 border-blue-500 pl-4 py-2 mb-4 italic text-gray-600 bg-gray-50">
          {block.quote.rich_text.map(text => text.plain_text).join('')}
        </blockquote>
      );

    case 'code':
      return (
        <pre key={id} className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-4 overflow-x-auto">
          <code>{block.code.rich_text.map(text => text.plain_text).join('')}</code>
        </pre>
      );

    case 'divider':
      return <hr key={id} className="my-8 border-gray-300" />;

    case 'image':
      const imageUrl = block.image.type === 'file'
        ? block.image.file.url
        : block.image.external?.url;

      if (imageUrl) {
        return (
          <div key={id} className="mb-6">
            <img
              src={imageUrl}
              alt={block.image.caption?.map(text => text.plain_text).join('') || ''}
              className="w-full rounded-lg shadow-md"
            />
            {block.image.caption && block.image.caption.length > 0 && (
              <p className="text-sm text-gray-500 text-center mt-2 italic">
                {block.image.caption.map(text => text.plain_text).join('')}
              </p>
            )}
          </div>
        );
      }
      return <div key={id}></div>;

    default:
      return (
        <div key={id} className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-700">
            Unsupported block type: {type}
          </p>
        </div>
      );
  }
}

export function BlogPost({ post }: BlogPostProps) {
  return (
    <article className="max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          {post.icon && (
            <span className="text-4xl">{post.icon}</span>
          )}
          {post.iconUrl && (
            <img
              src={post.iconUrl}
              alt=""
              className="w-12 h-12 object-contain"
            />
          )}
          <h1 className="text-4xl font-bold text-gray-900 leading-tight">
            {post.title}
          </h1>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-6 text-sm text-gray-500 border-b border-gray-200 pb-6">
          {post.createdTime && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span>Published {formatDate(post.createdTime)}</span>
            </div>
          )}

          {post.readingTime && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>{post.readingTime} min read</span>
            </div>
          )}

          {post.wordCount && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              <span>{post.wordCount.toLocaleString()} words</span>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="prose prose-lg max-w-none">
        {post.content?.map((block) => renderBlock(block))}
      </div>

      {/* Footer */}
      {post.publicUrl && (
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <a
            href={post.publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors font-medium"
          >
            <span>View on Notion</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </footer>
      )}
    </article>
  );
}