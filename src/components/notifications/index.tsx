import {
  type Negotiation,
  type Notification,
  NotificationType,
  type Project,
} from '@prisma/client';

// Extend the Notification type to include investorId
type NotificationWithInvestorId = Notification & {
  investorId?: string | null;
};
import { Bell, Building2, Trash2 } from 'lucide-react';
import { api } from '~/utils/api';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';

import { useUser } from '@clerk/nextjs';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuthenticatedQuery } from '~/hooks/useAuthenticatedQuery';

const NotificationTextMap: Record<string, { text: string; link: string }> = {
  [NotificationType.PROJECT_VIEW]: {
    text: 'An investor viewed your project',
    link: '/investor/' + '{{investorId}}',
  },
  [NotificationType.MEETING_CANCELLED]: { text: 'A meeting has been cancelled', link: '/meetings' },
  [NotificationType.MEETING_CREATED]: { text: 'A meeting has been created', link: '/meetings' },
  [NotificationType.NEGOTIATION_CANCELLED]: {
    text: 'A negotiation has been cancelled',
    link: '/entrepreneur/negotiations',
  },
  [NotificationType.NEGOTIATION_GO_TO_NEXT_STAGE]: {
    text: 'A negotiation has been updated',
    link: '/entrepreneur/negotiations',
  },
  [NotificationType.NEGOTIATION_CREATED]: {
    text: 'You have a new negotiation',
    link: '/entrepreneur/negotiations',
  },
  [NotificationType.POKE]: { text: 'You have a new poke!', link: '#' },
  [NotificationType.SUPPORT_TICKET_REPLY]: {
    text: 'Click here to view support ticket reply',
    link: '/support-tickets',
  },
  [NotificationType.SUPPORT_TICKET_STATUS_UPDATED]: {
    text: 'Your support ticket status has been updated',
    link: '/support-tickets',
  },
  [NotificationType.SUPPORT_TICKET_CREATED]: {
    text: 'A new support ticket requires your attention',
    link: '/support-tickets',
  },
  [NotificationType.SUPPORT_TICKET_RECEIVED]: {
    text: 'Your support ticket has been received and will be reviewed soon',
    link: '/support-tickets',
  },
  [NotificationType.PITCH_REQUEST]: {
    text: 'An investor has requested a pitch video for your project',
    link: '/projects',
  },
};

type UserDetails = {
  openNegotiations: (Negotiation & { project: Project })[];
};

export const Notifications = ({ userDetails }: { userDetails: UserDetails }) => {
  const { isSignedIn, isLoaded } = useUser();
  const [negotiationNotifications, setNegotiationNotifications] = useState<
    NotificationWithInvestorId[]
  >([]);
  const [notifications, setNotifications] = useState<NotificationWithInvestorId[]>([]);
  const router = useRouter();

  const authQueryOptions = useAuthenticatedQuery(() => null, {
    enabled: true,
    retryCount: 3,
    retryDelay: 1000,
  });

  const {
    data: notificationsFromQuery,
    error: notificationsError,
    refetch,
  } = api.notifications.getUnreadNotifications.useQuery(void 0, {
    staleTime: 600000, // 10 minutes in milliseconds
    refetchInterval: 600000, // 10 minutes in milliseconds
    ...authQueryOptions,
  });

  const { mutateAsync: readNotification } = api.notifications.readNotification.useMutation({
    onMutate: data => {
      setNotifications(notifications.filter(notification => notification.id !== data.id));
    },
  });

  const { mutateAsync: readAllNotifications } = api.notifications.readAllNotifications.useMutation({
    onMutate: () => {
      // Don't clear support ticket notifications when marking all as read
      setNotifications(
        notifications.filter(
          n =>
            n.type === NotificationType.SUPPORT_TICKET_REPLY ||
            n.type === NotificationType.SUPPORT_TICKET_STATUS_UPDATED
        )
      );
    },
  });

  const noNotifications =
    notifications &&
    notifications.length === 0 &&
    negotiationNotifications &&
    negotiationNotifications.length === 0 &&
    notificationsFromQuery &&
    notificationsFromQuery.length === 0;

  const noNegotiations = userDetails.openNegotiations.length === 0;

  useEffect(() => {
    // For now, don't separate negotiation notifications since NEGOTIATION_CREATED doesn't exist
    setNegotiationNotifications([]);
    setNotifications(notificationsFromQuery ?? []);
  }, [notificationsFromQuery]);

  // Handle auth errors by retrying when auth state changes
  useEffect(() => {
    if (notificationsError?.data?.code === 'UNAUTHORIZED' && isLoaded && isSignedIn) {
      // If we get an auth error but user is signed in, retry after a short delay
      const timer = setTimeout(() => {
        void refetch();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [notificationsError, isLoaded, isSignedIn, refetch]);

  const handleNotificationClick = (notification: NotificationWithInvestorId) => {
    if (NotificationTextMap[notification.type]?.link.includes('{{investorId}}')) {
      const investorId = notification.investorId ?? '';

      void router.push(
        NotificationTextMap[notification.type]?.link.replace('{{investorId}}', investorId) ?? '#'
      );
    } else {
      void router.push(NotificationTextMap[notification.type]?.link ?? '#');
    }
  };

  // Calculate total notification count
  const totalNotifications = notifications.length + userDetails.openNegotiations.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {noNotifications && noNegotiations ? (
            <Bell fill="none" className="size-4" />
          ) : (
            <Bell fill="currentColor" className="size-4" />
          )}
          {totalNotifications > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-5 flex items-center justify-center font-medium">
              {totalNotifications > 99 ? '99+' : totalNotifications}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
          <DropdownMenuItem className="p-0 hover:bg-transparent focus:bg-transparent hover:text-foreground">
            <Button
              variant="secondary"
              onClick={() => void readAllNotifications()}
              className="w-full justify-start"
            >
              <p className="text-sm text-muted-foreground">Mark all as read</p>
            </Button>
          </DropdownMenuItem>
          {userDetails.openNegotiations.map(negotiation => (
            <DropdownMenuItem
              key={negotiation.id}
              onClick={() => void router.push(`/projects/${negotiation.project.id}`)}
              className="p-0 hover:bg-transparent focus:bg-transparent hover:text-foreground flex items-center gap-1 justify-between border-b border-white/10"
            >
              <Button
                variant="secondary"
                onClick={() => void readAllNotifications()}
                className="w-full justify-start text-left"
              >
                {negotiation.project.logo ? (
                  <Image
                    src={negotiation.project.logo ?? ''}
                    alt={negotiation.project.name ?? ''}
                    width={16}
                    height={16}
                    className="rounded-sm"
                  />
                ) : (
                  <Building2 className="size-4 text-muted-foreground" />
                )}
                <p className="text-sm text-muted-foreground">
                  {negotiation.project.name} | want to move forward?
                </p>
              </Button>
            </DropdownMenuItem>
          ))}
          {notifications.map(notification => (
            <DropdownMenuItem
              key={notification.id}
              className="flex items-center gap-1 focus:bg-transparent focus:text-foreground pl-4"
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex-1 cursor-pointer">
                <span
                  className={
                    notification.type.includes('SUPPORT_TICKET') ? 'text-primary font-medium' : ''
                  }
                >
                  {NotificationTextMap[notification.type]?.text ?? 'You have a new notification'}
                </span>
                <span className="text-xs text-neutral-500 ml-2">
                  {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                </span>
              </div>
              {notification.type.includes('SUPPORT_TICKET') ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={e => e.stopPropagation()}>
                      <Trash2 className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Support Notification</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this support ticket notification? This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => void readNotification({ id: notification.id })}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={e => {
                    e.stopPropagation();
                    void readNotification({ id: notification.id });
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
