import { type NotificationType } from '@prisma/client';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Header } from '~/components/header';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { api } from '~/utils/api';
import { getNotificationIcon, NotificationTextMap } from '~/utils/notifications';

type FilterTab = 'ALL' | 'POKE' | 'MEETING' | 'NEGOTIATION' | 'SUPPORT';

const TABS: { label: string; value: FilterTab }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Pokes', value: 'POKE' },
  { label: 'Meetings', value: 'MEETING' },
  { label: 'Negotiations', value: 'NEGOTIATION' },
  { label: 'Support', value: 'SUPPORT' },
];

const matchesFilter = (type: NotificationType, filter: FilterTab): boolean => {
  if (filter === 'ALL') return true;
  return type.startsWith(filter);
};

export default function NotificationsPage() {
  const router = useRouter();
  const utils = api.useUtils();
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  const { data: notifications, isLoading } = api.notifications.getAll.useQuery(undefined, {
    staleTime: 0,
  });

  const { mutate: readAllNotifications } = api.notifications.readAllNotifications.useMutation({
    onSuccess: () => {
      void utils.notifications.getAll.invalidate();
      void utils.notifications.getUnreadNotifications.invalidate();
    },
  });

  const { mutate: readNotification } = api.notifications.readNotification.useMutation({
    onSuccess: () => {
      void utils.notifications.getAll.invalidate();
      void utils.notifications.getUnreadNotifications.invalidate();
    },
    onError: () => {
      toast.error('Failed to update notification');
    },
  });

  // Auto-mark all as read when page opens
  useEffect(() => {
    readAllNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNotificationClick = (notification: {
    id: string;
    type: NotificationType;
    investorId?: string | null;
    senderId?: string | null;
    read: boolean;
  }) => {
    if (!notification.read) {
      readNotification({ id: notification.id });
    }

    const entry = NotificationTextMap[notification.type];
    if (!entry) return;

    let link = entry.link;
    if (link.includes('{{investorId}}')) {
      link = link.replace('{{investorId}}', notification.investorId ?? '');
    }
    if (link.includes('{{senderId}}')) {
      if (!notification.senderId) return;
      link = link.replace('{{senderId}}', notification.senderId);
    }

    void router.push(link);
  };

  const filtered = notifications?.filter(n => matchesFilter(n.type, activeTab)) ?? [];
  const hasUnread = notifications?.some(n => !n.read) ?? false;

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-4 md:p-8">
      <Header />
      <div className="mt-12">
        <div className="rounded-lg border border-white/10 bg-card p-6 md:p-12">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-semibold">Notifications</h1>
            {hasUnread && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => readAllNotifications()}
              >
                <CheckCheck className="mr-2 size-4" />
                Mark all as read
              </Button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="mb-6 flex gap-1 border-b border-white/10">
            {TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors',
                  activeTab === tab.value
                    ? 'border-b-2 border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <Bell className="size-10 opacity-40" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {filtered.map(notification => {
                const { icon: Icon, color } = getNotificationIcon(notification.type);
                const entry = NotificationTextMap[notification.type];
                const isUnread = !notification.read;

                return (
                  <div
                    key={notification.id}
                    onClick={() =>
                      handleNotificationClick({
                        id: notification.id,
                        type: notification.type,
                        investorId: notification.investorId,
                        senderId: notification.senderId,
                        read: notification.read,
                      })
                    }
                    className={cn(
                      'flex cursor-pointer gap-4 border-b border-white/10 p-4 transition-colors hover:bg-white/5',
                      isUnread && 'border-l-2 border-l-primary bg-white/[0.03]'
                    )}
                  >
                    <div className={cn('mt-0.5 shrink-0', color)}>
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={cn(
                            'text-sm',
                            isUnread ? 'font-medium text-foreground' : 'text-muted-foreground'
                          )}
                        >
                          {notification.message && notification.type === 'POKE'
                            ? 'You have a new poke!'
                            : (entry?.text ?? 'You have a new notification')}
                        </span>
                        <span className="shrink-0 text-xs text-neutral-500">
                          {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                        </span>
                      </div>
                      {notification.type === 'POKE' && notification.message && (
                        <blockquote className="mt-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm italic text-muted-foreground">
                          &ldquo;{notification.message}&rdquo;
                        </blockquote>
                      )}
                    </div>
                    {isUnread && (
                      <div className="mt-2 shrink-0">
                        <span className="block size-2 rounded-full bg-primary" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
