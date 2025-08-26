// import { DollarSign, Users, Settings, Globe, CircleUser, Signal } from 'lucide-react';
import AdminLayout from '../index';
import { api } from '~/utils/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { useState } from 'react';
import { Skeleton } from "~/components/ui/skeleton";
import { BusinessCardDialog } from "~/components/business-card";
import { Input } from "~/components/ui/input";
import { Search, Users, UserPlus, Mail, Calendar, Eye } from "lucide-react";
import { useDebounce } from "~/hooks/use-debounce";
import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import {
  AdminPageHeader,
  AdminStatsCard,
  AdminContentCard,
  AdminSection,
  AdminStatsGrid,
  adminGradients,
  adminIconColors
} from "~/components/admin/shared";

export default function DashboardPage() {
  return (
    <AdminLayout>
      <Dashboard />
    </AdminLayout>
  );
}

function TableSkeleton({ columns }: { columns: number }) {
  return (
    <AdminContentCard>
      <div className="p-6 space-y-4">
        <div className="flex items-center space-x-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-[100px] bg-white/10" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={j} className="h-4 w-[100px] bg-white/10" />
            ))}
          </div>
        ))}
      </div>
    </AdminContentCard>
  );
}

export function Dashboard() {
  const [potentialUserPage, setPotentialUserPage] = useState(1);
  const [registeredUserPage, setRegisteredUserPage] = useState(1);
  const pageSize = 10;
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);

  const { data: potentialUsers, isLoading: loadingPotential } = api.potentialUser.getAll.useQuery({
    page: potentialUserPage,
    limit: pageSize,
  });

  const { data: registeredUsers, isLoading: loadingRegistered } = api.user.getAll.useQuery({
    page: registeredUserPage,
    limit: pageSize,
    search: debouncedSearch,
  });

  return (
    <AdminSection>
      {/* Header */}
      <AdminPageHeader
        title="Admin Dashboard"
        description="Manage users, monitor platform activity, and oversee support tickets from a centralized admin interface."
        icon={Users}
        iconLabel="User Management"
      />

      {/* Stats Cards */}
      <AdminStatsGrid columns={4}>
        <AdminStatsCard
          title="Potential Users"
          value={potentialUsers?.total ?? 0}
          subtitle="Waiting from events"
          icon={UserPlus}
          gradient={adminGradients.blue}
          iconColor={adminIconColors.blue}
        />

        <AdminStatsCard
          title="Registered Users"
          value={registeredUsers?.total ?? 0}
          subtitle="Active platform users"
          icon={Users}
          gradient={adminGradients.green}
          iconColor={adminIconColors.green}
        />

        <AdminStatsCard
          title="Total Projects"
          value={registeredUsers?.items?.reduce((acc, user) => acc + (user.projectsCount ?? 0), 0) ?? 0}
          subtitle="Across all users"
          icon={Eye}
          gradient={adminGradients.purple}
          iconColor={adminIconColors.purple}
        />

        <AdminStatsCard
          title="Recent Activity"
          value={potentialUsers?.items?.length ?? 0}
          subtitle="New this month"
          icon={Calendar}
          gradient={adminGradients.orange}
          iconColor={adminIconColors.orange}
        />
      </AdminStatsGrid>

      <div className="grid gap-6">
        {/* Potential Users Table */}
        <AdminContentCard
          title="Waiting from Events"
          description="Users who registered at events and are waiting to join the platform"
          icon={UserPlus}
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-ui-text/80 font-medium">Name</TableHead>
                  <TableHead className="text-ui-text/80 font-medium">Email</TableHead>
                  <TableHead className="text-ui-text/80 font-medium">Phone</TableHead>
                  <TableHead className="text-ui-text/80 font-medium">Event</TableHead>
                  <TableHead className="text-ui-text/80 font-medium">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingPotential ? (
                  <TableSkeleton columns={5} />
                ) : potentialUsers?.items.map((user) => (
                  <TableRow key={user.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="font-medium text-primary">{user.name}</TableCell>
                    <TableCell className="text-ui-text/90">
                      <a href={`mailto:${user.email}`} className="hover:underline flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </a>
                    </TableCell>
                    <TableCell className="text-ui-text/70">{user.phone ?? '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-white/10 text-ui-text/80 border-white/20">
                        {user.event ?? '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-ui-text/70 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="text-sm text-ui-text/60">
              Total: {potentialUsers?.total ?? 0} potential users
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={potentialUserPage === 1}
                onClick={() => setPotentialUserPage(p => p - 1)}
                className="border-white/20 hover:border-primary/50 hover:bg-primary/10"
              >
                Previous
              </Button>
              <div className="text-sm text-ui-text/80 px-3 py-1 bg-white/5 rounded-md">
                Page {potentialUserPage}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!potentialUsers?.hasMore}
                onClick={() => setPotentialUserPage(p => p + 1)}
                className="border-white/20 hover:border-primary/50 hover:bg-primary/10"
              >
                Next
              </Button>
            </div>
          </div>
        </AdminContentCard>

        {/* Registered Users Table */}
        <AdminContentCard
          title="Registered Users"
          description="Active users on the platform with their project counts and business cards"
          icon={Users}
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ui-text/40" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-ui-text/80 font-medium">Name</TableHead>
                  <TableHead className="text-ui-text/80 font-medium">Email</TableHead>
                  <TableHead className="text-ui-text/80 font-medium">Phone</TableHead>
                  <TableHead className="text-ui-text/80 font-medium">Type</TableHead>
                  <TableHead className="text-ui-text/80 font-medium">Projects</TableHead>
                  <TableHead className="text-ui-text/80 font-medium">Business Card</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingRegistered ? (
                  <TableSkeleton columns={6} />
                ) : registeredUsers?.items.map((user) => (
                  <TableRow key={user.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell>
                      <Link
                        href={`/profile/${user.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        <Users className="h-3 w-3" />
                        {user.name || `${user.firstName} ${user.lastName}`.trim()}
                      </Link>
                    </TableCell>
                    <TableCell className="text-ui-text/90">
                      <a href={`mailto:${user.email}`} className="hover:underline flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </a>
                    </TableCell>
                    <TableCell className="text-ui-text/70">{user.phone}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-white/10 text-ui-text/80 border-white/20">
                        {user.userType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-primary/20 text-primary border-primary/30">
                        {user.projectsCount ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <BusinessCardDialog
                        trigger={
                          <Button variant="outline" size="sm" className="border-white/20 hover:border-primary/50 hover:bg-primary/10">
                            View Card
                          </Button>
                        }
                        userName={user.name || `${user.firstName} ${user.lastName}`.trim()}
                        referralCode={user.referralCode}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="text-sm text-ui-text/60">
              Total: {registeredUsers?.total ?? 0} registered users
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={registeredUserPage === 1}
                onClick={() => setRegisteredUserPage(p => p - 1)}
                className="border-white/20 hover:border-primary/50 hover:bg-primary/10"
              >
                Previous
              </Button>
              <div className="text-sm text-ui-text/80 px-3 py-1 bg-white/5 rounded-md">
                Page {registeredUserPage}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!registeredUsers?.hasMore}
                onClick={() => setRegisteredUserPage(p => p + 1)}
                className="border-white/20 hover:border-primary/50 hover:bg-primary/10"
              >
                Next
              </Button>
            </div>
          </div>
        </AdminContentCard>
      </div>
    </AdminSection>
  );
}