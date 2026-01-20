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
import { useMemo, memo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { NewsGrid } from '~/components/news/NewsCard';
import { Skeleton } from '~/components/ui/skeleton';
import { api } from '~/utils/api';
import { useTranslation } from '~/hooks/use-translation';
import { toNewsUserType } from '~/types/news';

// Lazy load heavy components
const PartnersSection = dynamic(() => import('~/components/ui/partners-section').then(mod => ({ default: mod.PartnersSection })), {
  loading: () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64 mx-auto" />
      <Skeleton className="h-32 w-full" />
    </div>
  ),
  ssr: false,
});

const Hypertrain = dynamic(() => import('../hypertrain/hypertrain').then(mod => ({ default: mod.Hypertrain })), {
  loading: () => (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  ),
  ssr: false,
});

// Memoize the component to prevent unnecessary re-renders
const Home = memo(function Home() {
  const { user, isLoaded, isSignedIn } = useUser();
  const userType = user?.publicMetadata.userType as UserType;
  const t = useTranslation();

  const { data: userData, isLoading: isLoadingUser } = api.user.getUser.useQuery(undefined, {
    enabled: isLoaded && isSignedIn && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes - cache user data to avoid unnecessary requests
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });
  // Defer news loading - only fetch when needed
  const { data: news, isLoading: isLoadingNews } = api.news.getUserTypeNews.useQuery(
    {
      userType: userType ? toNewsUserType(userType) : undefined,
    },
    {
      refetchOnWindowFocus: false,
      staleTime: 10 * 60 * 1000, // 10 minutes - increased cache time
      enabled: isLoaded && !!userType, // Only fetch when user is loaded and has a type
    }
  );

  // Defer hypertrain loading - only fetch when component is visible
  const { data: hypertrainItems } = api.hypertrain.getHyperTrainItems.useQuery(undefined, {
    enabled: isLoaded && !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  // Get the referrer's name based on their type (memoized to avoid recalculation)
  // This must be called before any conditional returns to satisfy React Hooks rules
  const referrerName = useMemo(() => {
    const referral = userData?.referralsAsReferred?.[0];
    if (!referral?.referrer) return null;

    const referrer = referral.referrer;
    const referrerType = referrer.userType;

    switch (referrerType) {
      case 'ENTREPRENEUR':
        return referrer.entrepreneur
          ? `${referrer.entrepreneur.firstName} ${referrer.entrepreneur.lastName}`
          : null;
      case 'INVESTOR':
        return referrer.investor
          ? `${referrer.investor.firstName} ${referrer.investor.lastName}`
          : null;
      case 'PARTNER':
        return referrer.partner
          ? `${referrer.partner.firstName} ${referrer.partner.lastName}`
          : null;
      case 'INCUBATOR':
        return referrer.incubator ? referrer.incubator.name : null;
      case 'VC_GROUP':
        return referrer.vcGroup ? referrer.vcGroup.name : null;
      default:
        return null;
    }
  }, [userData?.referralsAsReferred]);

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
  const hasNews =
    !isLoadingNews &&
    !!firstNewsArticle &&
    (('type' in firstNewsArticle && firstNewsArticle.type === 'child_page') ||
      ('object' in firstNewsArticle && firstNewsArticle.object === 'page'));

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
                  loading="eager"
                  priority
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

      {/* Referrer Information */}
      {referrerName && (
        <div className="rounded-xl border-2 border-[#E5CD82]/20 bg-[#E5CD82]/10 p-4">
          <p className="text-white/90">
            {t('youWereReferredBy')} <span className="font-semibold text-[#E5CD82]">{referrerName}</span>
          </p>
        </div>
      )}

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

        <Link href="/public-pitch">
          <div className="rounded-xl border-2 border-white/10 bg-card p-6 transition-all hover:border-white/20 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <BookOpen className="w-6 h-6 text-white" />
                <span className="text-lg font-medium text-white">Public Pitch</span>
              </div>
              <ArrowRight className="w-5 h-5 text-white/70" />
            </div>
          </div>
        </Link>
      </div>

      {/* Hypertrain Area - Lazy loaded */}
      {hypertrainItems && hypertrainItems.length > 0 && (
        <Suspense fallback={
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        }>
          <Hypertrain />
        </Suspense>
      )}

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
          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-xl" />
              ))}
            </div>
          }>
            <div className="w-full">
              <NewsGrid blocks={news.blocks.slice(0, 3)} title="" description="" />
            </div>
          </Suspense>
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

      {/* Partners Section - Lazy loaded */}
      <Suspense fallback={
        <div className="space-y-4">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-32 w-full" />
        </div>
      }>
        <PartnersSection variant="internal" />
      </Suspense>

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
});

export default Home;
