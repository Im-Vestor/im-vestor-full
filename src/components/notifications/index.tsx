import { Bell } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { api } from '~/utils/api';
import { useAuthenticatedQuery } from '~/hooks/useAuthenticatedQuery';
import { Button } from '../ui/button';

export const Notifications = () => {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const path = usePathname();

  const authQueryOptions = useAuthenticatedQuery(() => null, {
    enabled: true,
    retryCount: 3,
    retryDelay: 1000,
  });

  const { data, error, refetch } = api.notifications.getUnreadCount.useQuery(void 0, {
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    ...authQueryOptions,
  });

  useEffect(() => {
    if (error?.data?.code === 'UNAUTHORIZED' && isLoaded && isSignedIn) {
      const timer = setTimeout(() => {
        void refetch();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [error, isLoaded, isSignedIn, refetch]);

  const count = data?.count ?? 0;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={() => void router.push('/notifications')}
    >
      <Bell fill={count > 0 ? 'currentColor' : 'none'} className={`size-4 ${path === '/notifications' ? 'text-[#EFD687]' : ''}`} />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-5 flex items-center justify-center font-medium">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Button>
  );
};
