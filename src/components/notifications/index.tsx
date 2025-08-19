import {
  type Negotiation,
  type Notification,
  NotificationType,
  type Project,
} from '@prisma/client';
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

const NotificationTextMap: Record<string, string> = {
  [NotificationType.PROJECT_VIEW]: 'An investor viewed your project',
  [NotificationType.MEETING_CANCELLED]: 'A meeting has been cancelled',
  [NotificationType.MEETING_CREATED]: 'A meeting has been created',
  [NotificationType.NEGOTIATION_CANCELLED]: 'A negotiation has been cancelled',
  [NotificationType.NEGOTIATION_GO_TO_NEXT_STAGE]: 'A negotiation has been updated',
  [NotificationType.NEGOTIATION_CREATED]: 'You have a new negotiation',
  [NotificationType.POKE]: 'You have a new poke!',
  [NotificationType.SUPPORT_TICKET_REPLY]: 'Click here to view support ticket reply',
  [NotificationType.SUPPORT_TICKET_STATUS_UPDATED]: 'Your support ticket status has been updated',
  [NotificationType.SUPPORT_TICKET_CREATED]: 'A new support ticket requires your attention',
  [NotificationType.SUPPORT_TICKET_RECEIVED]:
    'Your support ticket has been received and will be reviewed soon',
};

type UserDetails = {
  openNegotiations: (Negotiation & { project: Project })[];
};

export const Notifications = ({ userDetails }: { userDetails: UserDetails }) => {
  const { isSignedIn } = useUser();
  const [negotiationNotifications, setNegotiationNotifications] = useState<Notification[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();

  const { data: notificationsFromQuery } = api.notifications.getUnreadNotifications.useQuery(
    undefined,
    {
      staleTime: 600000, // 10 minutes in milliseconds
      refetchInterval: 600000, // 10 minutes in milliseconds
      enabled: !!isSignedIn,
    }
  );

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

  const handleNotificationClick = (notification: Notification) => {
    if (notification.type === NotificationType.SUPPORT_TICKET_REPLY) {
      void router.push('/support-tickets');
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
              onClick={() => void router.push(`/companies/${negotiation.project.id}`)}
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
                  {NotificationTextMap[notification.type] ?? 'You have a new notification'}
                </span>
                <span className="text-sm text-muted-foreground ml-2">
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
