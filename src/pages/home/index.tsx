import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import { useEffect, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '~/components/header';
import { HomeSkeleton } from '~/components/home';
import { api } from '~/utils/api';
import { isProfileCompleted } from '~/utils/profile-completion';

// Lazy load the Home component to improve initial render
const Home = dynamic(() => import('~/components/home'), {
  loading: () => <HomeSkeleton />,
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
        <div className="h-16 bg-card rounded-xl border-2 border-white/10 mb-8 animate-pulse" />
        <HomeSkeleton />
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
        <Suspense fallback={<HomeSkeleton />}>
          <Home />
        </Suspense>
      </div>
    </main>
  );
}
