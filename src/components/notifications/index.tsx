import {
  type Negotiation,
  type Notification,
  NotificationType,
  type Project,
} from '@prisma/client';
import { ArrowUpRight, Bell, Trash2 } from 'lucide-react';
import { api } from '~/utils/api';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

import { useUser } from '@clerk/nextjs';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const NotificationTextMap: Record<string, string> = {
  [NotificationType.PROJECT_VIEW]: 'An investor viewed your project',
  [NotificationType.MEETING_CANCELLED]: 'A meeting has been cancelled',
  [NotificationType.MEETING_CREATED]: 'A meeting has been created',
  [NotificationType.NEGOTIATION_CANCELLED]: 'A negotiation has been cancelled',
  [NotificationType.NEGOTIATION_GO_TO_NEXT_STAGE]: 'A negotiation has been updated',
  [NotificationType.NEGOTIATION_CREATED]: 'You have a new negotiation',
  SUPPORT_REPLY: 'You have a new reply to your support ticket',
};

type UserDetails = {
  openNegotiations: (Negotiation & { project: Project })[];
};

export const Notifications = ({ userDetails }: { userDetails: UserDetails }) => {
  const { isSignedIn } = useUser();
  const [negotiationNotifications, setNegotiationNotifications] = useState<Notification[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();
  const { data: notificationsFromQuery, isFetching: isFetchingNotifications } =
    api.notifications.getUnreadNotifications.useQuery(undefined, {
      staleTime: 600000, // 10 minutes in milliseconds
      refetchInterval: 600000, // 10 minutes in milliseconds
      enabled: !!isSignedIn,
    });

  const { mutateAsync: readNotification } = api.notifications.readNotification.useMutation({
    onMutate: data => {
      setNotifications(notifications.filter(notification => notification.id !== data.id));
    },
  });

  const { mutateAsync: readAllNotifications } = api.notifications.readAllNotifications.useMutation({
    onMutate: () => {
      setNotifications([]);
    },
  });

  const noNotifications =
    notifications &&
    notifications.length === 0 &&
    negotiationNotifications &&
    negotiationNotifications.length === 0;

  useEffect(() => {
    // For now, don't separate negotiation notifications since NEGOTIATION_CREATED doesn't exist
    setNegotiationNotifications([]);
    setNotifications(notificationsFromQuery ?? []);
  }, [notificationsFromQuery]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isFetchingNotifications || noNotifications}>
        <Button variant="ghost" size="icon">
          {noNotifications ? (
            <Bell fill="none" className="size-4" />
          ) : (
            <Bell fill="currentColor" className="size-4" />
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
                <ArrowUpRight className="size-4" />
                <p className="text-sm text-muted-foreground">
                  {negotiation.project.name} | want to move forward?
                </p>
              </Button>
            </DropdownMenuItem>
          ))}
          {notifications?.map(notification => (
            <DropdownMenuItem
              key={notification.id}
              className="flex items-center gap-1 focus:bg-transparent focus:text-foreground pl-4"
            >
              {NotificationTextMap[notification.type] ?? 'You have a new notification'}
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
              </span>
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
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
