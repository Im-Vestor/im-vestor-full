'use client';

import { Building2, Calendar1, Newspaper, UserSearch } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { api } from '~/utils/api';
import { Skeleton } from '../ui/skeleton';

const getTypeColor = (type: string) => {
  switch (type) {
    case 'PROJECT':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
    case 'INVESTOR':
      return 'bg-green-500/10 text-green-400 border-green-500/30';
    case 'NEWS':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    case 'WEEKLY_PITCH':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
  }
};

const weeklyPitchLinkHypertrainItem = {
  id: 'weekly-pitch-link',
  name: 'Weekly Pitch',
  description: 'Check out the projects in the weekly pitch',
  link: '/pitch-of-the-week',
  type: 'WEEKLY_PITCH',
  image: null,
};

export function Hypertrain() {
  const [isPaused, setIsPaused] = useState(false);

  const { data: hypertrainItems, isPending: isHypertrainItemsPending } =
    api.hypertrain.getHyperTrainItems.useQuery();

  const duplicatedHypertrainItems = hypertrainItems
    ? [...hypertrainItems, weeklyPitchLinkHypertrainItem, ...hypertrainItems]
    : [];

  const itemWidth = 408;
  const totalItems =
    hypertrainItems?.length && hypertrainItems.length > 2 ? hypertrainItems.length : 0;
  const scrollDistance = itemWidth * totalItems;

  if (isHypertrainItemsPending) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Hypertrain</h2>
        </div>

        <div className="rounded-xl bg-card/30 p-6">
          <div className={`flex gap-6`}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="w-[408px] h-20 rounded-lg" />
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

      <div className="relative overflow-hidden rounded-xl bg-card/30 p-6">
        <div
          className={`flex gap-6 animate-scroll ${isPaused ? 'paused' : ''}`}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          style={
            {
              animationDuration: '40s',
              '--scroll-distance': `-${scrollDistance}px`,
            } as React.CSSProperties & { '--scroll-distance': string }
          }
        >
          {hypertrainItems?.length !== 0 &&
            duplicatedHypertrainItems?.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex-shrink-0 w-96 group cursor-pointer">
                <Link href={item.link} target="_blank" rel="noopener noreferrer" className="block">
                  <div
                    className={`bg-card/50 rounded-lg p-4 border ${getTypeColor(item.type)} transition-all duration-300 hover:scale-105`}
                  >
                    <div className="flex items-start gap-4">
                      {item.image ? (
                        <div className="size-12 bg-muted rounded-lg flex-shrink-0 overflow-hidden relative">
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        </div>
                      ) : item.type === 'NEWS' ? (
                        <div
                          className={`size-12 flex items-center justify-center rounded-lg flex-shrink-0 overflow-hidden relative ${getTypeColor(item.type)}`}
                        >
                          <Newspaper className="size-6" />
                        </div>
                      ) : item.type === 'INVESTOR' ? (
                        <div
                          className={`size-12 flex items-center justify-center rounded-lg flex-shrink-0 overflow-hidden relative ${getTypeColor(item.type)}`}
                        >
                          <UserSearch className="size-6" />
                        </div>
                      ) : item.type === 'PROJECT' ? (
                        <div
                          className={`size-12 flex items-center justify-center rounded-lg flex-shrink-0 overflow-hidden relative ${getTypeColor(item.type)}`}
                        >
                          <Building2 className="size-6" />
                        </div>
                      ) : item.type === 'WEEKLY_PITCH' ? (
                        <div
                          className={`size-12 flex items-center justify-center rounded-lg flex-shrink-0 overflow-hidden relative ${getTypeColor(item.type)}`}
                        >
                          <Calendar1 className="size-6" />
                        </div>
                      ) : null}
                      <div className="flex flex-col min-w-0 w-full">
                        <div className="flex justify-between w-full overflow-hidden">
                          <h3 className="font-medium text-white truncate">{item.name}</h3>
                          {item.type === 'WEEKLY_PITCH' ? (
                            <span className="px-2 py-1 w-fit text-xs font-bold rounded border bg-blue-500/10 text-blue-400 border-blue-500/30">
                              PITCH
                            </span>
                          ) : (
                            <span
                              className={`px-2 py-1 w-fit text-xs font-bold rounded border ${getTypeColor(item.type)}`}
                            >
                              {item.type}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 w-full">{item.description}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}

          {hypertrainItems?.length === 0 && (
            <div className="flex items-center justify-center w-full h-full">
              <p className="text-neutral-400">No items found</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(var(--scroll-distance));
          }
        }

        .animate-scroll {
          animation: scroll 20s linear infinite;
        }

        .animate-scroll.paused {
          animation-play-state: paused;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
