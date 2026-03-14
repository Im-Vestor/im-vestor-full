import { NotificationType } from '@prisma/client';
import { Bell, Calendar, Eye, HelpCircle, MessageSquare, Video, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const NotificationTextMap: Record<string, { text: string; link: string }> = {
  [NotificationType.PROJECT_VIEW]: {
    text: 'An investor viewed your project',
    link: '/investor/{{investorId}}',
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
  [NotificationType.POKE]: { text: 'You have a new poke!', link: '/entrepreneur/{{senderId}}' },
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
  [NotificationType.PITCH_TICKET_PURCHASED]: {
    text: 'Your Pitch of the Week ticket is ready! Schedule your pitch now.',
    link: '/pitch-of-the-week/create',
  },
  [NotificationType.VIDEO_ACCESS_REQUESTED]: {
    text: 'An investor has requested access to your company video',
    link: '/projects',
  },
  [NotificationType.MESSAGE_RECEIVED]: {
    text: 'You have a new message',
    link: '/messages',
  },
};

export type NotificationIconConfig = {
  icon: LucideIcon;
  color: string;
};

export const getNotificationIcon = (type: NotificationType): NotificationIconConfig => {
  if (type === NotificationType.POKE) return { icon: Zap, color: 'text-primary' };
  if (type.startsWith('MEETING')) return { icon: Calendar, color: 'text-blue-400' };
  if (type.startsWith('NEGOTIATION')) return { icon: Bell, color: 'text-green-400' };
  if (type.startsWith('SUPPORT_TICKET')) return { icon: HelpCircle, color: 'text-amber-400' };
  if (type === NotificationType.PROJECT_VIEW) return { icon: Eye, color: 'text-purple-400' };
  if (type.startsWith('PITCH')) return { icon: Video, color: 'text-sky-400' };
  if (type === NotificationType.MESSAGE_RECEIVED) return { icon: MessageSquare, color: 'text-blue-400' };
  return { icon: Bell, color: 'text-muted-foreground' };
};
