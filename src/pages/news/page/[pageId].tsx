import { useRouter } from 'next/router';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { NotionBlockRenderer } from '~/components/notion/NotionBlockRenderer';
import { Button } from '~/components/ui/button';
import { extractPageTitle, getPageIcon, getPageDescription } from '~/utils/notion';
import { api } from '~/utils/api';
import { Header } from '~/components/header';

export default function NotionPageView() {
  const router = useRouter();
  const { pageId } = router.query;

  const {
    data: pageData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = api.news.getPageContent.useQuery(
    { pageId: pageId as string },
    {
      enabled: !!pageId && typeof pageId === 'string',
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchInterval: 1000 * 60 * 10, // 10 minutes
    }
  );

  if (isLoading) {
    return (
      <main className="mx-auto min-h-screen max-w-4xl p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <p className="text-gray-500">Loading page...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto min-h-screen max-w-7xl p-6">
        <Header />
        {/* Back Button */}
        <div className="mb-8">
          <Link href="/news" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to News</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                <span className="text-red-600 dark:text-red-400 text-lg">!</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                Error Loading Page
              </h3>
              <p className="text-red-700 dark:text-red-300 mb-4">
                {error.message || 'Failed to load page content. Please try again later.'}
              </p>
              <Button
                onClick={() => void refetch()}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const pageTitle = extractPageTitle(pageData?.page);
  const pageIcon = getPageIcon(pageData?.page);
  const pageDescription = getPageDescription(pageData?.page);

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-6">
      <Header />

      {/* Navigation */}
      <nav className="mb-8">
        <Link href="/news" className="inline-flex items-center gap-2 text-gray-300 hover:text-white dark:hover:text-gray-100 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back to News</span>
        </Link>
      </nav>

      {/* Page Header */}
      <header className="mb-12">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            {/* Page Icon & Title */}
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl">
                  {pageIcon}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-4xl font-bold text-white mb-2 leading-tight break-words">
                  {pageTitle}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  {pageDescription}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      {pageData && pageData.blocks.length > 0 ? (
        <article className="mb-16">
          <div className="space-y-6 rounded-xl border-2 border-white/10 bg-card md:px-16 px-4 py-12">
            <NotionBlockRenderer blocks={pageData.blocks} />
          </div>
        </article>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto max-w-sm">
            <div className="mb-6 text-6xl opacity-60">{pageIcon}</div>
            <h3 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
              Empty Page
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              This page doesn't have any content yet.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}