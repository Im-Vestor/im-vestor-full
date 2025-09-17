export type ProjectViewWithRelations = {
  id: string;
  createdAt: Date;
  projectId: string;
  investorId: string | null;
  vcGroupId: string | null;
  project: {
    name: string;
    Entrepreneur: {
      firstName: string;
      lastName: string;
    } | null;
  };
  investor: {
    firstName: string;
    lastName: string;
    user: {
      email: string;
    };
  } | null;
};

import type { UserType, NotificationType } from '@prisma/client';

export type NotificationLog = {
  id: string;
  createdAt: Date;
  type: NotificationType;
  read: boolean;
  userId: string;
  investorId: string;
  user: {
    email: string;
    userType: UserType;
  };
};

export type PlatformActivitySummary = {
  notificationCounts: Array<{
    type: NotificationType;
    _count: {
      type: number;
    };
  }>;
  projectViewsCount: number;
  newUsersCount: number;
  newProjectsCount: number;
  meetingsCount: number;
  supportTicketsCount: number;
  negotiationsCount: number;
  period: {
    from: Date;
    to: Date;
    days: number;
  };
};
