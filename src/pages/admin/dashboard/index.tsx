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
import { Search } from "lucide-react";
import { useDebounce } from "~/hooks/use-debounce";
import Link from "next/link";

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
      {[1, 2, 3, 4, 5].map((row) => (
        <TableRow key={row}>
          {Array(columns).fill(0).map((_, i) => (
            <TableCell key={i}>
              <Skeleton className="h-6 w-full" />
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
    <>
      <div className="grid gap-6 mt-6">
        {/* Potential Users Table */}
        <div className="bg-card rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Waiting from events</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingPotential ? (
                <TableSkeleton columns={5} />
              ) : potentialUsers?.items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone ?? '-'}</TableCell>
                  <TableCell>{user.event ?? '-'}</TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              Total: {potentialUsers?.total ?? 0}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={potentialUserPage === 1}
                onClick={() => setPotentialUserPage(p => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={!potentialUsers?.hasMore}
                onClick={() => setPotentialUserPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        {/* Registered Users Table */}
        <div className="bg-card rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Registered Users</h3>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Projetos</TableHead>
                <TableHead>Business Card</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingRegistered ? (
                <TableSkeleton columns={6} />
              ) : registeredUsers?.items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Link
                      href={`/profile/${user.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border-b border-blue-600 hover:border-blue-800"
                    >
                      {user.name || `${user.firstName} ${user.lastName}`.trim()}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <a href={`mailto:${user.email}`} className="hover:underline">
                      {user.email}
                    </a>
                  </TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>{user.userType}</TableCell>
                  <TableCell>{user.projectsCount ?? 0}</TableCell>
                  <TableCell>
                    <BusinessCardDialog
                      trigger={
                        <Button variant="outline" size="sm">
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
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              Total: {registeredUsers?.total ?? 0}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={registeredUserPage === 1}
                onClick={() => setRegisteredUserPage(p => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={!registeredUsers?.hasMore}
                onClick={() => setRegisteredUserPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div >
    </>
  );
}