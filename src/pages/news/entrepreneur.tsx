import React from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '~/utils/api';
import { NewsGrid } from '~/components/news/NewsCard';

export default function EntrepreneurNews() {
  const {
    data: newsData,
    isLoading,
    error,
  } = api.news.getUserTypeNews.useQuery(
    {},
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  if (isLoading) {
    return (
      <main className="mx-auto min-h-screen max-w-7xl p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-gray-400">Loading entrepreneur news...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto min-h-screen max-w-7xl p-8">
        <div className="rounded-3xl bg-gradient-to-br from-red-800/20 to-red-700/10 border border-red-500/20 p-12 text-center">
          <div className="mx-auto max-w-md">
            <div className="mb-6 text-6xl opacity-60">⚠️</div>
            <h3 className="mb-4 text-2xl font-semibold text-white">
              Failed to Load News
            </h3>
            <p className="text-gray-400 text-lg mb-6">
              {error.message || 'An error occurred while loading the news.'}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const blocks = newsData?.blocks ?? [];

  return (
    <main className="mx-auto min-h-screen max-w-7xl p-8">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          🚀 Entrepreneur News
        </h1>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
          Stay updated with the latest insights, trends, and opportunities in the entrepreneurial world.
          From startup funding to market analysis, get the intelligence you need to grow your business.
        </p>
      </div>

      {/* Featured Articles */}
      <section className="mb-16">
        <NewsGrid
          blocks={blocks}
          title="Latest for Entrepreneurs"
          description="Curated content specifically for entrepreneurs and startup founders"
        />
      </section>

      {/* Categories */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="rounded-3xl bg-gradient-to-br from-green-800/20 to-emerald-700/10 border border-green-500/20 p-8 text-center">
          <div className="text-4xl mb-4">💡</div>
          <h3 className="text-xl font-semibold text-white mb-3">Innovation</h3>
          <p className="text-gray-400">Breakthrough technologies and disruptive business models</p>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-blue-800/20 to-cyan-700/10 border border-blue-500/20 p-8 text-center">
          <div className="text-4xl mb-4">💰</div>
          <h3 className="text-xl font-semibold text-white mb-3">Funding</h3>
          <p className="text-gray-400">Investment rounds, funding strategies, and capital markets</p>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-purple-800/20 to-pink-700/10 border border-purple-500/20 p-8 text-center">
          <div className="text-4xl mb-4">📈</div>
          <h3 className="text-xl font-semibold text-white mb-3">Growth</h3>
          <p className="text-gray-400">Scaling strategies and market expansion insights</p>
        </div>
      </section>

      {/* Tips Section */}
      <section className="rounded-3xl bg-gradient-to-br from-indigo-800/20 to-purple-700/10 border border-indigo-500/20 p-12 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">💼 Entrepreneur&apos;s Toolkit</h2>
        <p className="text-gray-400 text-lg mb-8 max-w-3xl mx-auto">
          Access our curated collection of resources, templates, and tools designed to help you
          build and scale your startup more effectively.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {['Business Plans', 'Pitch Decks', 'Financial Models', 'Legal Templates'].map((tool: string, index: number) => (
            <div key={tool} className="bg-white/5 rounded-2xl p-6 hover:bg-white/10 transition-colors cursor-pointer">
              <div className="text-2xl mb-3">{['📋', '🎯', '📊', '⚖️'][index]}</div>
              <h4 className="font-semibold text-white">{tool}</h4>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}