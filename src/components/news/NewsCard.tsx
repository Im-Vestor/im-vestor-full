import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, ArrowRight } from 'lucide-react';
import { type BlockObjectResponse, type PartialBlockObjectResponse, type PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { extractPageTitle, getPageIcon, extractFirstLineFromBlocks } from '~/utils/notion';
import { api } from '~/utils/api';

interface NewsCardProps {
  block: BlockObjectResponse | PartialBlockObjectResponse;
  showDate?: boolean;
}

export const NewsCard: React.FC<NewsCardProps> = ({ block, showDate = true }) => {
  // Type guard to check if block has type property
  if (!('type' in block) || block.type !== 'child_page') return null;

  const title = extractPageTitle(block);
  const icon = getPageIcon(block);

  // Fetch page content to get the first line as description and cover image
  const { data: pageData } = api.news.getPageContent.useQuery(
    { pageId: block.id },
    {
      staleTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
    }
  );

  const description = pageData ? extractFirstLineFromBlocks(pageData.blocks) : 'Loading...';

  // Extract cover image from page data
  const getCoverImage = (page: PageObjectResponse) => {
    if (!page.cover) return null;
    if (page.cover.type === 'external') {
      return page.cover.external.url;
    } else if (page.cover.type === 'file') {
      return page.cover.file.url;
    }
    return null;
  };

  const coverImage = pageData?.page ? getCoverImage(pageData.page as PageObjectResponse) : null;

  // Extract date from block if available
  const createdDate = block.created_time ? new Date(block.created_time).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : null;

  return (
    <Link href={`/news/page/${block.id}`} className="group">
      <article className="h-full rounded-xl border-2 border-white/10 bg-card overflow-hidden hover:border-white/20 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-2xl">
        {/* Cover Image/Icon */}
        <div className="relative h-48 bg-gradient-to-br from-primary-from to-primary-to">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <div className="text-6xl text-gray-900/80">
                {icon}
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Date */}
          {showDate && createdDate && (
            <div className="flex items-center gap-2 text-white/50 text-sm mb-3">
              <Calendar className="h-4 w-4" />
              <span>{createdDate}</span>
            </div>
          )}

          {/* Title */}
          <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-[#EFD687] transition-colors duration-200">
            {title}
          </h3>

          {/* Description */}
          <p className="text-white/60 text-sm leading-relaxed mb-4 line-clamp-3">
            {description}
          </p>

          {/* Read More Link */}
          <div className="flex items-center gap-2 text-[#EFD687] group-hover:gap-3 transition-all duration-200">
            <span className="text-sm font-medium">Read more</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
          </div>
        </div>
      </article>
    </Link>
  );
};

interface NewsGridProps {
  blocks: (BlockObjectResponse | PartialBlockObjectResponse)[];
  title?: string;
  description?: string;
}

export const NewsGrid: React.FC<NewsGridProps> = ({ blocks, title, description }) => {
  // Filter for child_page blocks (news articles) with proper type guard
  const newsBlocks = blocks.filter((block): block is BlockObjectResponse =>
    'type' in block && block.type === 'child_page'
  );

  if (newsBlocks.length === 0) {
    return (
      <div className="rounded-xl border-2 border-white/10 bg-card p-12 text-center">
        <div className="mx-auto max-w-md">
          <div className="mb-6 text-6xl opacity-60">📰</div>
          <h3 className="mb-4 text-2xl font-semibold text-white">
            No Articles Available
          </h3>
          <p className="text-white/60 text-lg">
            There are no news articles available at the moment. Check back later for the latest updates!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      {(title ?? description) && (
        <div className="text-center mb-12">
          {title && (
            <h2 className="text-3xl font-bold text-white mb-4">{title}</h2>
          )}
          {description && (
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">{description}</p>
          )}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
        {newsBlocks.map((block) => (
          <NewsCard key={block.id} block={block} />
        ))}
      </div>
    </div>
  );
};