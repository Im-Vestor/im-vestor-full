import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import { useEffect, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '~/components/header';
import { api } from '~/utils/api';
import { isProfileCompleted } from '~/utils/profile-completion';

// Lazy load the Home component to improve initial render
const Home = dynamic(() => import('~/components/home'), {
  loading: () => (
    <div className="space-y-8">
      <div className="flex items-center gap-6">
        <div className="h-16 w-16 bg-card rounded-full border-2 border-white/10 animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-8 w-64 bg-card rounded border-2 border-white/10 animate-pulse"></div>
          <div className="h-4 w-32 bg-card rounded border-2 border-white/10 animate-pulse"></div>
        </div>
      </div>
    </div>
  ),
  ssr: false,
});

export default function HomePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const hasRedirected = useRef(false);
  const { data: userData } = api.user.getUser.useQuery(undefined, {
    enabled: isLoaded && isSignedIn,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected.current) return;

    if (isLoaded && !isSignedIn) {
      hasRedirected.current = true;
      void router.push('/login');
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (hasRedirected.current) return;
    if (isLoaded && isSignedIn && userData) {
      const profileCompleted = isProfileCompleted(userData);
      if (!profileCompleted) {
        hasRedirected.current = true;
        void router.replace('/profile');
      }
    }
  }, [isLoaded, isSignedIn, userData, router]);

  // Don't render anything until authentication is loaded
  if (!isLoaded) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl p-4 md:p-8">
        <div className="animate-pulse">
          <div className="h-16 bg-card rounded-xl border-2 border-white/10 mb-8"></div>
          <div className="space-y-8">
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 bg-card rounded-full border-2 border-white/10"></div>
              <div className="space-y-2">
                <div className="h-8 w-64 bg-card rounded border-2 border-white/10"></div>
                <div className="h-4 w-32 bg-card rounded border-2 border-white/10"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Don't render if not signed in
  if (!isSignedIn) {
    return null;
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-4 md:p-8">
      <Header />
      <div className="mt-12">
        <Suspense
          fallback={
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 bg-card rounded-full border-2 border-white/10 animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-8 w-64 bg-card rounded border-2 border-white/10 animate-pulse"></div>
                  <div className="h-4 w-32 bg-card rounded border-2 border-white/10 animate-pulse"></div>
                </div>
              </div>
            </div>
          }
        >
          <Home />
        </Suspense>
      </div>
    </main>
  );
}
