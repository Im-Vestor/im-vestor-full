import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Header } from '~/components/header';
import Home from '~/components/home';

export default function HomePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      void router.push('/login');
    }
  }, [isLoaded, isSignedIn, router]);

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
        <Home />
      </div>
    </main>
  );
}
