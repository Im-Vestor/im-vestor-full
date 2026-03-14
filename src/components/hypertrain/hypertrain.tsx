'use client';

import { Building2, Calendar1, Newspaper, Play, UserSearch } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { memo, useMemo } from 'react';
import { api } from '~/utils/api';
import { extractFirstLineFromBlocks, extractPageTitle, getPageCoverImage } from '~/utils/notion';
import { type PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { Marquee } from '../ui/marquee';
import { Skeleton } from '../ui/skeleton';

const VIDEO_REGEX = /\.(mp4|webm|ogg|mov)$/i;

const DOT_GRID_STYLE = {
  backgroundImage: `radial-gradient(circle at 20% 50%, currentColor 1px, transparent 1px), radial-gradient(circle at 80% 20%, currentColor 1px, transparent 1px)`,
  backgroundSize: '24px 24px',
} as const;

const SKELETON_ITEMS = Array.from({ length: 3 });

type TypeConfig = {
  label: string;
  accent: string;
  gradient: string;
  bgGradient: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const typeConfig: Record<string, TypeConfig> = {
  DEFAULT: {
    label: '',
    accent: 'text-gray-400 border-gray-400/40 bg-gray-400/10',
    gradient: 'from-gray-950/80 via-gray-900/30 to-transparent',
    bgGradient: 'bg-gradient-to-br from-neutral-900 to-neutral-950',
    Icon: Building2,
  },
  PROJECT: {
    label: 'PROJECT',
    accent: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10',
    gradient: 'from-yellow-950/80 via-yellow-900/30 to-transparent',
    bgGradient: 'bg-gradient-to-br from-yellow-950 via-neutral-950 to-neutral-900',
    Icon: Building2,
  },
  INVESTOR: {
    label: 'INVESTOR',
    accent: 'text-emerald-400 border-emerald-400/40 bg-emerald-400/10',
    gradient: 'from-emerald-950/80 via-emerald-900/30 to-transparent',
    bgGradient: 'bg-gradient-to-br from-emerald-950 via-neutral-950 to-neutral-900',
    Icon: UserSearch,
  },
  NEWS: {
    label: 'NEWS',
    accent: 'text-violet-400 border-violet-400/40 bg-violet-400/10',
    gradient: 'from-violet-950/80 via-violet-900/30 to-transparent',
    bgGradient: 'bg-gradient-to-br from-violet-950 via-neutral-950 to-neutral-900',
    Icon: Newspaper,
  },
  PUBLIC_PITCH: {
    label: 'PITCH',
    accent: 'text-sky-400 border-sky-400/40 bg-sky-400/10',
    gradient: 'from-sky-950/80 via-sky-900/30 to-transparent',
    bgGradient: 'bg-gradient-to-br from-sky-950 via-neutral-950 to-neutral-900',
    Icon: Calendar1,
  },
};

const publicPitchLinkHypertrainItem = {
  id: 'public-pitch-link',
  name: 'Public Pitch',
  description: 'Check out the projects in the public pitch',
  link: '/public-pitch',
  type: 'PUBLIC_PITCH',
  image: null,
  externalId: null,
};

type HypertrainItemLike = {
  id: string;
  name: string;
  description?: string | null;
  link: string;
  type: string;
  image?: string | null;
  externalId?: string | null;
};

const HypertrainCard = memo(function HypertrainCard({ item }: { item: HypertrainItemLike }) {
  const isNews = item.type === 'NEWS' && !!item.externalId;

  const { data: newsPageData } = api.news.getPageContent.useQuery(
    { pageId: item.externalId ?? '' },
    {
      enabled: isNews,
      staleTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  );

  const newsTitle = newsPageData?.page
    ? extractPageTitle(newsPageData.page as Parameters<typeof extractPageTitle>[0])
    : null;
  const newsCoverImage = newsPageData?.page
    ? getPageCoverImage(newsPageData.page as PageObjectResponse)
    : null;
  const newsDescription =
    newsPageData?.blocks && newsPageData.blocks.length > 0
      ? extractFirstLineFromBlocks(newsPageData.blocks as any)
      : null;

  const displayName = (isNews ? newsTitle : null) ?? item.name;
  const displayImage = (isNews ? newsCoverImage : null) ?? item.image ?? null;
  const displayDescription = (isNews ? newsDescription : null) ?? item.description ?? '';
  const displayLink = item.link.replace('/companies', '/projects');

  const config = typeConfig[item.type] ?? typeConfig.DEFAULT!;
  const { Icon, accent, label, bgGradient } = config;
  const isVideo = !!displayImage && VIDEO_REGEX.test(displayImage);

  return (
    <div className="flex-shrink-0 w-72 min-w-72 h-40 group cursor-pointer">
      <Link href={displayLink} target="_blank" rel="noopener noreferrer" className="h-full block">
        <div className="relative rounded-xl h-full overflow-hidden border border-white/[0.07] transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-black/50">
          {displayImage ? (
            isVideo ? (
              <video
                src={`${displayImage}#t=0.001`}
                className="absolute inset-0 w-full h-full object-cover"
                muted
                preload="metadata"
                playsInline
              />
            ) : (
              <Image src={displayImage} alt={displayName} fill className="object-cover" />
            )
          ) : (
            /* No-media: geometric gradient bg */
            <div className="absolute inset-0">
              <div className="absolute inset-0 opacity-20" style={DOT_GRID_STYLE} />
              <div className={`absolute inset-0 ${bgGradient}`} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon className="size-10 opacity-15 text-white" />
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="size-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Play className="size-4 text-white fill-white ml-0.5" />
              </div>
            </div>
          )}

          <div className="absolute top-3 right-3">
            <span
              className={`px-2 py-0.5 text-[10px] font-bold tracking-widest rounded-full border backdrop-blur-md ${accent}`}
            >
              {label || item.type}
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="font-semibold text-white text-sm leading-snug truncate drop-shadow-sm">
              {displayName}
            </h3>
            {displayDescription && (
              <p className="text-[11px] text-white/60 mt-0.5 line-clamp-1 leading-relaxed">
                {displayDescription}
              </p>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
});

export function Hypertrain() {
  const { data: hypertrainItems, isPending: isHypertrainItemsPending } =
    api.hypertrain.getHyperTrainItems.useQuery(undefined, {
      staleTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    });

  const baseItems = useMemo<HypertrainItemLike[]>(
    () =>
      hypertrainItems
        ? [...(hypertrainItems as unknown as HypertrainItemLike[]), publicPitchLinkHypertrainItem]
        : [publicPitchLinkHypertrainItem],
    [hypertrainItems]
  );

  if (isHypertrainItemsPending) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Hypertrain</h2>
        </div>
        <div className="rounded-xl bg-card/30 p-6">
          <div className="flex gap-4">
            {SKELETON_ITEMS.map((_, index) => (
              <Skeleton key={index} className="w-72 h-40 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Hypertrain</h2>
      </div>

      <div className="relative overflow-hidden rounded-xl">
        {!hypertrainItems || hypertrainItems.length === 0 ? (
          <div className="flex items-center justify-center w-full h-full py-8">
            <p className="text-neutral-400">No items found</p>
          </div>
        ) : (
          <Marquee pauseOnHover className="[--duration:15s]">
            {baseItems.map(item => (
              <HypertrainCard key={item.id} item={item} />
            ))}
          </Marquee>
        )}
      </div>
    </div>
  );
}
