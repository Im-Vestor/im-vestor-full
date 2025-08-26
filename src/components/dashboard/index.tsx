import { useUser } from '@clerk/nextjs';
import { type UserType } from '@prisma/client';
import {
  BookOpen,
  Plus,
  Search,
  Share2,
  Users,
  Eye,
  Calendar,
  Briefcase,
  ArrowRight,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '~/utils/api';
import { Skeleton } from '~/components/ui/skeleton';
import { cn } from '~/lib/utils';
import { ActivityPanel } from './activity-panel';
import { RecommendationsPanel } from './recommendations-panel';
import { NewsPanel } from './news-panel';
import { Hypertrain } from '../hypertrain/hypertrain';

interface QuickAction {
  icon: React.ElementType;
  label: string;
  href: string;
  color: string;
}

const quickActionsByUserType: Record<UserType, QuickAction[]> = {
  ENTREPRENEUR: [
    {
      icon: Plus,
      label: 'Create Project',
      href: '/companies/create',
      color: 'text-emerald-500',
    },
    {
      icon: Users,
      label: 'Find Investors',
      href: '/investors',
      color: 'text-blue-500',
    },
    {
      icon: Share2,
      label: 'Invite Partners',
      href: '/referral/share',
      color: 'text-purple-500',
    },
  ],
  INVESTOR: [
    {
      icon: Search,
      label: 'Search Projects',
      href: '/projects',
      color: 'text-blue-500',
    },
    {
      icon: BookOpen,
      label: 'Pitch of the Week',
      href: '/pitch-of-the-week',
      color: 'text-amber-500',
    },
    {
      icon: Share2,
      label: 'Invite Partners',
      href: '/referral/share',
      color: 'text-purple-500',
    },
  ],
  VC_GROUP: [
    {
      icon: Plus,
      label: 'Share Investment',
      href: '/companies/create',
      color: 'text-emerald-500',
    },
    {
      icon: Search,
      label: 'Search Projects',
      href: '/projects',
      color: 'text-blue-500',
    },
    {
      icon: Share2,
      label: 'Invite Partners',
      href: '/referral/share',
      color: 'text-purple-500',
    },
  ],
  PARTNER: [
    {
      icon: Share2,
      label: 'Share Referral',
      href: '/referral/share',
      color: 'text-purple-500',
    },
    {
      icon: Users,
      label: 'My Network',
      href: '/referral/list',
      color: 'text-blue-500',
    },
  ],
  INCUBATOR: [
    {
      icon: Plus,
      label: 'Add Project',
      href: '/companies/create',
      color: 'text-emerald-500',
    },
    {
      icon: Users,
      label: 'My Network',
      href: '/connections',
      color: 'text-blue-500',
    },
    {
      icon: Share2,
      label: 'Invite Partners',
      href: '/referral/share',
      color: 'text-purple-500',
    },
  ],
  ADMIN: [],
};

export default function Dashboard() {
  const { user } = useUser();
  const userType = user?.publicMetadata.userType as UserType;

  const { data: userData, isLoading: isLoadingUser } = api.user.getUser.useQuery();
  api.news.getUserTypeNews.useQuery(
    {},
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
  const { data: recommendations } = api.recommendations.getRecommendations.useQuery();

  const quickActions = quickActionsByUserType[userType] ?? [];

  // Get the user's name based on their type
  const getUserName = () => {
    if (!userData) return '';

    switch (userType) {
      case 'ENTREPRENEUR':
        return userData.entrepreneur
          ? `${userData.entrepreneur.firstName} ${userData.entrepreneur.lastName}`
          : '';
      case 'INVESTOR':
        return userData.investor
          ? `${userData.investor.firstName} ${userData.investor.lastName}`
          : '';
      case 'PARTNER':
        return userData.partner ? `${userData.partner.firstName} ${userData.partner.lastName}` : '';
      case 'INCUBATOR':
        return userData.incubator ? userData.incubator.name : '';
      case 'VC_GROUP':
        return userData.vcGroup ? userData.vcGroup.name : '';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center gap-6">
        {isLoadingUser ? (
          <>
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-32" />
            </div>
          </>
        ) : (
          <>
            <Image
              src={user?.imageUrl ?? '/images/male-avatar.svg'}
              alt="Profile"
              width={64}
              height={64}
              className="rounded-full ring-2 ring-border"
            />
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Welcome back, {getUserName()}
              </h1>
              <p className="text-lg text-muted-foreground">{userType.replace('_', ' ')}</p>
            </div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        {quickActions.map(action => (
          <Link key={action.label} href={action.href}>
            <div className="group relative overflow-hidden rounded-xl bg-card/30 p-6 transition-all hover:bg-card/50">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn('rounded-full bg-card/30 p-3', `text-${action.color}`)}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="text-lg font-medium text-white">{action.label}</span>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Hypertrain />

      {/* Metrics Overview */}
      {recommendations?.metrics && (
        <div className="grid gap-4 md:grid-cols-3">
          {'totalViews' in recommendations.metrics && (
            <div className="group relative overflow-hidden rounded-xl bg-card/30 p-6 transition-all hover:bg-card/50">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">Total Views</h3>
                  <Eye className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {recommendations.metrics.totalViews}
                </p>
              </div>
            </div>
          )}
          {'totalMeetings' in recommendations.metrics && (
            <div className="group relative overflow-hidden rounded-xl bg-card/30 p-6 transition-all hover:bg-card/50">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">Total Meetings</h3>
                  <Calendar className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {recommendations.metrics.totalMeetings}
                </p>
              </div>
            </div>
          )}
          {'totalProjects' in recommendations.metrics && (
            <div className="group relative overflow-hidden rounded-xl bg-card/30 p-6 transition-all hover:bg-card/50">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">Total Projects</h3>
                  <Briefcase className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {recommendations.metrics.totalProjects}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Latest News - Full Width */}
      <div className="w-full">
        <NewsPanel />
      </div>

      {/* Activity Overview - Full Width */}
      <div className="w-full">
        <ActivityPanel />
      </div>

      {/* Recommendations */}
      <RecommendationsPanel />
    </div>
  );
}
