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
import { Search, Users, UserPlus, Mail, Calendar, Eye, UserX, ArrowUpDown } from "lucide-react";
import { useDebounce } from "~/hooks/use-debounce";
import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "~/components/ui/alert-dialog";
import { toast } from "sonner";
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
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i} className="border-white/5">
          {Array.from({ length: columns }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-[100px] bg-white/10" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function Dashboard() {
  const [potentialUserPage, setPotentialUserPage] = useState(1);
  const [registeredUserPage, setRegisteredUserPage] = useState(1);
  const pageSize = 10;
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [sortBy, setSortBy] = useState<'createdAt' | 'userType' | 'email'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (field: 'createdAt' | 'userType' | 'email') => {
    if (sortBy === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const { data: potentialUsers, isLoading: loadingPotential } = api.potentialUser.getAll.useQuery({
    page: potentialUserPage,
    limit: pageSize,
  });

  const { data: registeredUsers, isLoading: loadingRegistered, refetch: refetchRegisteredUsers } = api.user.getAll.useQuery({
    page: registeredUserPage,
    limit: pageSize,
    search: debouncedSearch,
    sortBy,
    sortDirection,
  });

  // Removed legacy delete mutation; using only forceDeleteUser

  // Force delete mutation (more aggressive)
  const forceDeleteUserMutation = api.admin.forceDeleteUser.useMutation({
    onSuccess: async (data) => {
      toast.success(data.message);
      await refetchRegisteredUsers();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Generate confirmation token for destructive operations
  const generateConfirmationToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  return (
    <AdminSection>
      {/* Header */}
      <AdminPageHeader
        title="Admin Home"
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
                      {new Date(user.createdAt).toISOString().split('T')[0]}
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
                  <TableHead className="text-ui-text/80 font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort('email')}
                      className="inline-flex items-center gap-1 hover:text-primary"
                    >
                      Email
                      {sortBy === 'email' && (
                        <ArrowUpDown className={`h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-ui-text/80 font-medium">Phone</TableHead>
                  <TableHead className="text-ui-text/80 font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort('userType')}
                      className="inline-flex items-center gap-1 hover:text-primary"
                    >
                      Type
                      {sortBy === 'userType' && (
                        <ArrowUpDown className={`h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-ui-text/80 font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort('createdAt')}
                      className="inline-flex items-center gap-1 hover:text-primary"
                    >
                      Created At
                      {sortBy === 'createdAt' && (
                        <ArrowUpDown className={`h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-ui-text/80 font-medium">Projects</TableHead>
                  <TableHead className="text-ui-text/80 font-medium">Business Card</TableHead>
                  <TableHead className="text-ui-text/80 font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingRegistered ? (
                  <TableSkeleton columns={8} />
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
                    <TableCell className="text-ui-text/70 text-sm">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}
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
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="border-red-500/20 hover:border-red-500/50 hover:bg-red-500/10"
                          >
                            <UserX className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="sm:max-w-lg">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-lg">Force Delete User Account</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm">
                              This will <strong>force delete</strong> the account for <strong>{user.name || `${user.firstName} ${user.lastName}`.trim()}</strong> ({user.email}).
                              This uses a database transaction to ensure complete removal and will:
                              <ul className="list-disc list-inside mt-2 space-y-1">
                                <li><strong>Delete from Clerk authentication system</strong></li>
                                <li>Remove ALL user data using database transaction</li>
                                <li>Delete all associated projects, files, and records</li>
                                <li>Remove all notifications, meetings, and connections</li>
                                <li>Delete all support tickets and referrals</li>
                                <li><strong>Allow user to create new account with same email</strong></li>
                              </ul>
                              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-xs">
                                ⚠️ This is a FORCE deletion using database transactions - guaranteed to remove all traces of the user.
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <label htmlFor="deletion-reason" className="text-sm font-medium">
                                Reason for deletion (required)
                              </label>
                              <Input
                                id="deletion-reason"
                                placeholder="Enter reason for account deletion..."
                                className="w-full"
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="confirmation-token" className="text-sm font-medium">
                                Confirmation Token
                              </label>
                              <Input
                                id="confirmation-token"
                                placeholder="Enter confirmation token..."
                                className="w-full"
                              />
                              <p className="text-xs text-muted-foreground">
                                Generate token: <button
                                  type="button"
                                  onClick={() => {
                                    const token = generateConfirmationToken();
                                    const input = document.getElementById('confirmation-token') as HTMLInputElement;
                                    if (input) input.value = token;
                                  }}
                                  className="text-blue-500 hover:text-blue-700 underline"
                                >
                                  Click here
                                </button>
                              </p>
                            </div>
                          </div>

                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="w-full sm:w-auto">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                const reason = (document.getElementById('deletion-reason') as HTMLInputElement)?.value;
                                const token = (document.getElementById('confirmation-token') as HTMLInputElement)?.value;

                                if (!reason?.trim()) {
                                  toast.error('Please provide a reason for deletion');
                                  return;
                                }

                                if (!token?.trim()) {
                                  toast.error('Please provide a confirmation token');
                                  return;
                                }

                                forceDeleteUserMutation.mutate({
                                  userId: user.id,
                                  confirmationToken: token,
                                  reason: reason
                                });
                              }}
                              disabled={forceDeleteUserMutation.isPending}
                              className="w-full sm:w-auto bg-destructive hover:bg-destructive/90"
                            >
                              {forceDeleteUserMutation.isPending ? 'Force Deleting...' : 'Force Delete Account'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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