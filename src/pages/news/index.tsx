import { useUser } from '@clerk/nextjs';
import { type UserType } from '@prisma/client';
import { Loader2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { NotionBlockRenderer } from '~/components/notion/NotionBlockRenderer';
import { Button } from '~/components/ui/button';
import { api } from '~/utils/api';

export default function NewsPage() {
  const { user, isSignedIn } = useUser();
  const router = useRouter();

  const userMetadata = user?.publicMetadata as {
    userType: UserType;
    userIsAdmin?: boolean;
  };

  // Auto-redirect to user-specific news pages
  useEffect(() => {
    if (isSignedIn && userMetadata?.userType) {
      switch (userMetadata.userType) {
        case 'ENTREPRENEUR':
          void router.push('/news/entrepreneur');
          break;
        case 'INVESTOR':
        case 'VC_GROUP':
          void router.push('/news/investor');
          break;
        case 'PARTNER':
        case 'INCUBATOR':
          void router.push('/news/partner');
          break;
      }
    }
  }, [isSignedIn, userMetadata, router]);

  const {
    data: newsData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = api.news.getGeneralNews.useQuery(undefined, {
    enabled: isSignedIn,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 10, // 10 minutes
  });

  if (!isSignedIn) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl p-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Please sign in to view news</p>
        </div>
      </main>
    );
  }

  // Show loading while redirecting
  if (userMetadata?.userType) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl p-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-gray-500">Redirecting to your news page...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            General News
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stay updated with the latest news and updates from our platform
          </p>
        </div>
        <Button
          onClick={() => void refetch()}
          disabled={isRefetching}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-gray-500">Loading news...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                <span className="text-red-600 dark:text-red-400">!</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
                Error Loading News
              </h3>
              <p className="text-red-700 dark:text-red-300">
                {error.message || 'Failed to load news content. Please try again later.'}
              </p>
              <Button
                onClick={() => void refetch()}
                variant="outline"
                size="sm"
                className="mt-3 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      ) : newsData && newsData.blocks.length > 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <NotionBlockRenderer blocks={newsData.blocks} />
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto max-w-sm">
            <div className="mb-4 text-4xl">📰</div>
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              No News Available
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              There's no news content available at the moment. Check back later for updates!
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
