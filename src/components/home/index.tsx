import { useUser } from '@clerk/nextjs';
import { type UserType } from '@prisma/client';
import {
  ArrowRight,
  Bell,
  BookOpen,
  Calendar,
  HelpCircle,
  Search,
  Share2,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { NewsGrid } from '~/components/news/NewsCard';
import { Skeleton } from '~/components/ui/skeleton';
import { PartnersSection } from '~/components/ui/partners-section';
import { api } from '~/utils/api';
import { Hypertrain } from '../hypertrain/hypertrain';

export default function Home() {
  const { user, isLoaded } = useUser();
  const userType = user?.publicMetadata.userType as UserType;

  const { data: userData, isLoading: isLoadingUser } = api.user.getUser.useQuery(undefined, {
    enabled: isLoaded && !!user,
  });
  const { data: news, isLoading: isLoadingNews } = api.news.getUserTypeNews.useQuery(
    {},
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const { data: hypertrainItems } = api.hypertrain.getHyperTrainItems.useQuery(undefined, {
    enabled: isLoaded && !!user,
  });

  // Don't render until authentication is loaded
  if (!isLoaded) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-6">
          <div className="h-16 w-16 bg-card rounded-full border-2 border-white/10 animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-8 w-64 bg-card rounded border-2 border-white/10 animate-pulse"></div>
            <div className="h-4 w-32 bg-card rounded border-2 border-white/10 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Get the user's name based on their type
  const getUserName = () => {
    if (!userData) return '';

    switch (userType) {
      case 'ENTREPRENEUR':
        return userData.entrepreneur
          ? `${userData.entrepreneur.firstName} ${userData.entrepreneur.lastName}`
          : '';
      case 'INVESTOR':
        return userData.investor
          ? `${userData.investor.firstName} ${userData.investor.lastName}`
          : '';
      case 'PARTNER':
        return userData.partner ? `${userData.partner.firstName} ${userData.partner.lastName}` : '';
      case 'INCUBATOR':
        return userData.incubator ? userData.incubator.name : '';
      case 'VC_GROUP':
        return userData.vcGroup ? userData.vcGroup.name : '';
      default:
        return '';
    }
  };

  // Get the first news article for the featured section
  const firstNewsArticle = news?.blocks?.[0];
  const hasNews = !isLoadingNews &&
    firstNewsArticle &&
    'type' in firstNewsArticle &&
    firstNewsArticle.type === 'child_page';

  return (
    <div className="space-y-8">
      {/* User Greeting Section */}
      <div className="flex items-center gap-6">
        {isLoadingUser ? (
          <>
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-32" />
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full border-2 border-white/10 overflow-hidden">
              {userData?.imageUrl ? (
                <Image
                  src={userData.imageUrl}
                  alt={`${getUserName()}'s profile`}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-card flex items-center justify-center">
                  <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Welcome back, {getUserName()}</h1>
              <p className="text-lg text-white/70 uppercase">{userType.replace('_', ' ')}</p>
            </div>
          </>
        )}
      </div>

      {/* Main Action Cards */}
      <div className={`grid gap-4 ${userType === 'ENTREPRENEUR' ? 'md:grid-cols-1' : 'md:grid-cols-2'}`}>
        {userType !== 'ENTREPRENEUR' && (
          <Link href={userType === 'INCUBATOR' ? "/investors" : "/projects"}>
            <div className="rounded-xl border-2 border-white/10 bg-card p-6 transition-all hover:border-white/20 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Search className="w-6 h-6 text-white" />
                  <span className="text-lg font-medium text-white">
                    {userType === 'INCUBATOR' ? 'Search Investors' : 'Search Projects'}
                  </span>
                </div>
                <ArrowRight className="w-5 h-5 text-white/70" />
              </div>
            </div>
          </Link>
        )}

        <Link href="/pitch-of-the-week">
          <div className="rounded-xl border-2 border-white/10 bg-card p-6 transition-all hover:border-white/20 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <BookOpen className="w-6 h-6 text-white" />
                <span className="text-lg font-medium text-white">Pitch of the Week</span>
              </div>
              <ArrowRight className="w-5 h-5 text-white/70" />
            </div>
          </div>
        </Link>
      </div>

      {/* Hypertrain Area */}
      {hypertrainItems && hypertrainItems.length > 0 && <Hypertrain />}

      {/* Latest News Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Latest News</h3>
          <Link
            href="/news"
            className="flex items-center gap-2 text-white/70 hover:text-[#EFD687] transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoadingNews ? (
          <div className="rounded-xl border-2 border-white/10 bg-card p-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ) : hasNews ? (
          <div className="w-full">
            <NewsGrid blocks={news.blocks.slice(0, 1)} title="" description="" />
          </div>
        ) : (
          <div className="rounded-xl border-2 border-white/10 bg-card overflow-hidden">
            <div className="w-full h-24 bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                </div>
                <p className="text-sm">No news available</p>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
                <Calendar className="w-4 h-4" />
                <span>No recent updates</span>
              </div>
              <h4 className="text-lg font-medium text-white mb-2">Check back later</h4>
              <p className="text-white/60 mb-4">We&apos;ll have fresh content for you soon</p>
            </div>
          </div>
        )}
      </div>

      <PartnersSection variant="internal" />

      {/* Footer Utility Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/referral/share">
          <div className="rounded-xl border-2 border-white/10 bg-card p-6 transition-all hover:border-white/20 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Share2 className="w-6 h-6 text-white" />
                <span className="text-white">Invite Partners</span>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/meetings">
          <div className="rounded-xl border-2 border-white/10 bg-card p-6 transition-all hover:border-white/20 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Bell className="w-6 h-6 text-white" />
                <span className="text-white">0 negotiations ongoing</span>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/support">
          <div className="rounded-xl border-2 border-white/10 bg-card p-6 transition-all hover:border-white/20 cursor-pointer">
            <div className="flex items-center gap-4">
              <HelpCircle className="w-6 h-6 text-white" />
              <div>
                <div className="text-white">
                  Need Help? <span className="text-sm text-white/60">help@im-vestor.com</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
