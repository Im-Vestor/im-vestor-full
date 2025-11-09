'use client';

import { Building2, Calendar1, Newspaper, UserSearch } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '~/utils/api';
import { Marquee } from '../ui/marquee';
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

const publicPitchLinkHypertrainItem = {
  id: 'public-pitch-link',
  name: 'Public Pitch',
  description: 'Check out the projects in the public pitch',
  link: '/public-pitch',
  type: 'PUBLIC_PITCH',
  image: null,
};

export function Hypertrain() {
  const { data: hypertrainItems, isPending: isHypertrainItemsPending } =
    api.hypertrain.getHyperTrainItems.useQuery();

  const baseItems = hypertrainItems
    ? [...hypertrainItems, publicPitchLinkHypertrainItem]
    : [publicPitchLinkHypertrainItem];

  if (isHypertrainItemsPending) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Hypertrain</h2>
        </div>

        <div className="rounded-xl bg-card/30 p-6">
          <div className={`flex gap-6`}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="w-[408px] h-32 rounded-lg" />
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
        {!hypertrainItems || hypertrainItems.length === 0 ? (
          <div className="flex items-center justify-center w-full h-full py-8">
            <p className="text-neutral-400">No items found</p>
          </div>
        ) : (
          <Marquee pauseOnHover className="[--duration:15s]">
            {baseItems.map(item => (
              <div key={item.id} className="flex-shrink-0 w-96 min-w-96 h-32 group cursor-pointer">
                <Link
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-full block"
                >
                  <div
                    className={`bg-card/50 rounded-lg h-full p-4 border ${getTypeColor(item.type)} transition-all duration-300 hover:scale-105`}
                  >
                    <div className="flex items-start gap-4">
                      {item.image ? (
                        <div className="size-16 bg-muted rounded-lg flex-shrink-0 overflow-hidden relative">
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        </div>
                      ) : item.type === 'NEWS' ? (
                        <div
                          className={`size-16 flex items-center justify-center rounded-lg flex-shrink-0 overflow-hidden relative ${getTypeColor(item.type)}`}
                        >
                          <Newspaper className="size-6" />
                        </div>
                      ) : item.type === 'INVESTOR' ? (
                        <div
                          className={`size-16 flex items-center justify-center rounded-lg flex-shrink-0 overflow-hidden relative ${getTypeColor(item.type)}`}
                        >
                          <UserSearch className="size-6" />
                        </div>
                      ) : item.type === 'PROJECT' ? (
                        <div
                          className={`size-16 flex items-center justify-center rounded-lg flex-shrink-0 overflow-hidden relative ${getTypeColor(item.type)}`}
                        >
                          <Building2 className="size-6" />
                        </div>
                      ) : item.type === 'WEEKLY_PITCH' ? (
                        <div
                          className={`size-16 flex items-center justify-center rounded-lg flex-shrink-0 overflow-hidden relative ${getTypeColor(item.type)}`}
                        >
                          <Calendar1 className="size-6" />
                        </div>
                      ) : null}
                      <div className="flex flex-col min-w-0 w-full">
                        <div className="flex justify-between w-full p-1 overflow-hidden">
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
          </Marquee>
        )}
      </div>
    </div>
  );
}
