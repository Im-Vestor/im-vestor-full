import { NotificationType } from '@prisma/client';
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

const NotificationTextMap = {
  [NotificationType.PROJECT_VIEW]: 'An investor viewed your project',
};

export const Notifications = () => {
  const utils = api.useUtils();
  
  const { data: notifications, isFetching: isFetchingNotifications } =
    api.notifications.getUnreadNotifications.useQuery();

  const { mutateAsync: readNotification, isPending: isReadingNotification } =
    api.notifications.readNotification.useMutation({
      onSuccess: () => {
        void utils.notifications.getUnreadNotifications.invalidate();
      },
    });

  const noNotifications = notifications && notifications.length === 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        disabled={isReadingNotification || isFetchingNotifications || noNotifications}
      >
        <Button variant="ghost" size="icon">
          {noNotifications ? (
            <Bell fill="none" className="size-4" />
          ) : (
            <Bell fill="currentColor" className="size-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {notifications?.map(notification => (
          <DropdownMenuItem
            key={notification.id}
            className="flex items-center gap-2 focus:bg-transparent focus:text-foreground"
            disabled={isReadingNotification}
          >
            <Bell fill="currentColor" className="size-2" />
            {NotificationTextMap[notification.type]}
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void readNotification({ id: notification.id })}
            >
              <Trash2 className="size-4" />
            </Button>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
