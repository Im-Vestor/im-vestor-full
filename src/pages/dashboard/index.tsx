import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Header } from '~/components/header';
import Dashboard from '~/components/dashboard';

export default function DashboardPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      void router.push('/login');
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      <Header />
      <div className="mt-12">
        <Dashboard />
      </div>
    </main>
  );
}
