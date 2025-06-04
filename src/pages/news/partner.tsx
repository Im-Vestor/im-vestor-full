import { useUser } from '@clerk/nextjs';
import { type UserType } from '@prisma/client';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { NotionBlockRenderer } from '~/components/notion/NotionBlockRenderer';
import { NewsGrid } from '~/components/news/NewsCard';
import { Button } from '~/components/ui/button';
import { api } from '~/utils/api';
import { Header } from '~/components/header';

export default function PartnerNewsPage() {
  const { user, isSignedIn } = useUser();
  const router = useRouter();

  const userMetadata = user?.publicMetadata as {
    userType: UserType;
    userIsAdmin?: boolean;
  };

  // Redirect if not a partner
  useEffect(() => {
    if (isSignedIn && userMetadata?.userType && !['PARTNER', 'INCUBATOR'].includes(userMetadata.userType)) {
      void router.push('/news');
    }
  }, [isSignedIn, userMetadata, router]);

  const {
    data: newsData,
    isLoading,
    error,
    refetch,
  } = api.news.getUserTypeNews.useQuery(
    {},
    {
      enabled: isSignedIn && userMetadata?.userType && ['PARTNER', 'INCUBATOR'].includes(userMetadata.userType),
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchInterval: 1000 * 60 * 10, // 10 minutes
    }
  );

  if (userMetadata?.userType && !['PARTNER', 'INCUBATOR'].includes(userMetadata.userType)) {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-7xl p-8">
          <div className="flex items-center justify-center h-64">
            <div className="rounded-3xl bg-card border border-white/10 p-8 text-center">
              <p className="text-gray-400">Access denied: This page is for partners only</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl p-8">
        <Header />

        {/* Content */}
        {isLoading ? (
          <div className="rounded-3xl bg-card border border-white/10 p-12">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-gray-400 text-lg">Loading partner news...</p>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-3xl bg-gradient-to-br from-red-900/20 to-red-800/20 border border-red-500/20 p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-2xl bg-red-500/20 flex items-center justify-center">
                  <span className="text-red-400 text-xl">!</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-red-300 mb-3">
                  Error Loading News
                </h3>
                <p className="text-red-200/80 mb-4">
                  {error.message || 'Failed to load partner news. Please try again later.'}
                </p>
                <Button
                  onClick={() => void refetch()}
                  variant="outline"
                  size="sm"
                  className="border-red-400/30 text-red-300 hover:bg-red-500/10"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        ) : newsData && newsData.blocks.length > 0 ? (
          <div className="space-y-8">
            {/* Check if we have child_page blocks for blog-style layout */}
            {newsData.blocks.some((block): block is typeof block & { type: 'child_page' } => 'type' in block && block.type === 'child_page') ? (
              <NewsGrid blocks={newsData.blocks} />
            ) : (
              /* Fallback to regular content renderer */
              <div className="rounded-3xl bg-card border border-white/10 p-8 lg:p-12">
                <NotionBlockRenderer blocks={newsData.blocks} />
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-3xl bg-gradient-to-br from-gray-800/50 to-gray-700/30 border border-white/10 p-12 text-center">
            <div className="mx-auto max-w-md">
              <div className="mb-8">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary-from to-primary-to flex items-center justify-center mb-4">
                  <span className="text-gray-900 text-xl">!</span>
                </div>
              </div>
              <h3 className="mb-4 text-2xl font-semibold text-white">
                No News Available
              </h3>
              <p className="text-gray-400 text-lg">
                There&apos;s no partner news available at the moment. Check back later for the latest partnership opportunities!
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}