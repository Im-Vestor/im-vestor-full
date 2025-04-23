import { type Notification, NotificationType } from '@prisma/client';
import { Bell, Trash2 } from 'lucide-react';
import { api } from '~/utils/api';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';

const NotificationTextMap = {
  [NotificationType.PROJECT_VIEW]: 'An investor viewed your project',
  [NotificationType.MEETING_CANCELLED]: 'A meeting has been cancelled',
  [NotificationType.MEETING_CREATED]: 'A meeting has been created',
  [NotificationType.NEGOTIATION_CANCELLED]: 'A negotiation has been cancelled',
  [NotificationType.NEGOTIATION_GO_TO_NEXT_STAGE]: 'A negotiation has been updated',
};

export const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const { data: notificationsFromQuery, isFetching: isFetchingNotifications } =
    api.notifications.getUnreadNotifications.useQuery();

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

  const noNotifications = notifications && notifications.length === 0;

  useEffect(() => {
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
          {notifications?.map(notification => (
            <DropdownMenuItem
              key={notification.id}
              className="flex items-center gap-1 focus:bg-transparent focus:text-foreground pl-4"
            >
              {NotificationTextMap[notification.type]}
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
