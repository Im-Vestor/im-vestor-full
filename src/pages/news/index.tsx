import { useUser } from '@clerk/nextjs';
import { type UserType } from '@prisma/client';
import { Loader2 } from 'lucide-react';
import { api } from '~/utils/api';
import { Header } from '~/components/header';
import { NewsGrid } from '~/components/news/NewsCard';
import { getNewsDescription, type NewsUserType, toNewsUserType } from '~/types/news';

export default function NewsPage() {
  const { user, isLoaded } = useUser();

  const userMetadata = user?.publicMetadata as
    | {
        userType: UserType;
      }
    | undefined;

  const userType = userMetadata?.userType;

  const {
    data: newsData,
    isLoading,
    error,
  } = api.news.getUserTypeNews.useQuery(
    {
      userType: userType ? toNewsUserType(userType) : undefined,
    },
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: isLoaded, // Fetch once Clerk is loaded; backend can infer userType from session if needed
    }
  );

  if (isLoading) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl p-8">
        <Header />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-gray-400">Loading news...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl p-8">
        <Header />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-400 mb-4">Error loading news</p>
            <p className="text-gray-400 text-sm">{error.message}</p>
          </div>
        </div>
      </main>
    );
  }

  const blocks = newsData?.blocks ?? [];
  const sectionTitle = newsData?.sectionTitle ?? 'Latest News';
  const currentUserType = newsData?.userType ?? userMetadata?.userType ?? 'ENTREPRENEUR';

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      <Header />

      {/* Featured Articles */}
      <section className="mb-16">
        <NewsGrid
          blocks={blocks}
          title={sectionTitle}
          description={getNewsDescription(currentUserType as NewsUserType)}
        />
      </section>
    </main>
  );
}
