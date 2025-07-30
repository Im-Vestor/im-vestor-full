import { api } from '~/utils/api';
import { Skeleton } from '~/components/ui/skeleton';
import { NewsGrid } from '~/components/news/NewsCard';
import { Button } from '~/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function NewsPanel() {
  const { data: newsData, isLoading: isLoadingNews } = api.news.getUserTypeNews.useQuery(
    {},
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Latest News</h2>
        <Link href="/news">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="space-y-4">
        {isLoadingNews ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
        ) : (
          <div className="w-full">
            <NewsGrid
              blocks={(newsData?.blocks || []).slice(0, 3)}
              title=""
              description=""
            />
          </div>
        )}
      </div>
    </div>
  );
}