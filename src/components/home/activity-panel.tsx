import { Bell, Mail } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { useUser } from '@clerk/nextjs';

import { api } from '~/utils/api';
import Link from 'next/link';
import { type Notification } from '@prisma/client';

export function ActivityPanel() {
  const { isSignedIn, isLoaded } = useUser();

  const { data: notifications } = api.notifications.getUnreadNotifications.useQuery(undefined, {
    enabled: isLoaded && !!isSignedIn,
    retry: (failureCount, error) => {
      // Retry up to 3 times for auth errors
      if (error?.data?.code === 'UNAUTHORIZED' && failureCount < 3) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
  const { data: negotiations } = api.user.getUser.useQuery(undefined, {
    enabled: isLoaded && !!isSignedIn,
    retry: (failureCount, error) => {
      // Retry up to 3 times for auth errors
      if (error?.data?.code === 'UNAUTHORIZED' && failureCount < 3) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Activity Overview</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Messages */}
        <div className="group relative overflow-hidden rounded-xl bg-card/30 p-6 transition-all hover:bg-card/50">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-card/30 p-3">
                <Mail className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-lg font-medium text-white">New Messages</p>
                <p className="text-muted-foreground text-xs">
                  {notifications?.filter((n: Notification) => n.type === 'POKE').length ?? 0} unread messages
                </p>
              </div>
            </div>
            <Link href="/messages">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
                View
              </Button>
            </Link>
          </div>
        </div>

        {/* Negotiations */}
        <div className="group relative overflow-hidden rounded-xl bg-card/30 p-6 transition-all hover:bg-card/50">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-card/30 p-3">
                <Bell className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-lg font-medium text-white">Active Negotiations</p>
                <p className="text-muted-foreground text-xs">
                  {negotiations?.openNegotiations.length ?? 0} negotiations need your attention
                </p>
              </div>
            </div>
            <Link href="/negotiations">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
                View
              </Button>
            </Link>
          </div>
        </div>

        {/* Help & Support */}
        <div className="group relative overflow-hidden rounded-xl bg-card/30 p-6 transition-all hover:bg-card/50">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-card/30 p-3">
                <Bell className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-lg font-medium text-white">Need Help?</p>
                <p className="text-muted-foreground text-xs">
                  Contact us at{' '}
                  <a href="mailto:help@im-vestor.com" className="text-primary hover:underline">
                    help@im-vestor.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}