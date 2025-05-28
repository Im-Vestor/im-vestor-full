import Image from 'next/image';
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

type SortDirection = "asc" | "desc";

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

  const { data: registeredUsers, isLoading: loadingRegistered, error: registeredUsersError } = api.user.getAll.useQuery({
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
                  <TableCell>{user.phone || '-'}</TableCell>
                  <TableCell>{user.event || '-'}</TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              Total: {potentialUsers?.total || 0}
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

          {registeredUsersError && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400">Error loading users: {registeredUsersError.message}</p>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Referral Code</TableHead>
                <TableHead>Business Card</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingRegistered ? (
                <TableSkeleton columns={5} />
              ) : registeredUsers?.items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    {user.name || `${user.firstName} ${user.lastName}`.trim()}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.userType}</TableCell>
                  <TableCell>{user.referralCode}</TableCell>
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
              Total: {registeredUsers?.total || 0}
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

function CountryAccessItem({
  country,
  flag,
  percentage,
}: {
  country: string;
  flag: string;
  percentage: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-xl">{flag}</div>
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-sm">{country}</span>
          <span className="text-sm">{percentage}%</span>
        </div>
        <div className="h-1.5 w-full bg-accent rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 rounded-full"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

function SupportItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm">{label}</span>
        <span className="text-sm">{value}</span>
      </div>
      <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full`}
          style={{ width: `${(value / 16) * 100}%` }}
        ></div>
      </div>
    </div>
  );
}

function MeetingReport({
  id,
  description,
  tag,
}: {
  id: string;
  description: string;
  tag?: string;
}) {
  return (
    <div className="border-b border-white/10 pb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">Reunião #{id}</span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Reportado por</span>
          <div className="h-6 w-6 rounded-full bg-accent overflow-hidden">
            <Image
              src="/images/logo.png"
              alt="User Avatar"
              width={24}
              height={24}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{description}</p>
      {tag && (
        <div className="flex">
          <span className="text-xs px-2 py-0.5 rounded bg-destructive/20 text-destructive">
            {tag}
          </span>
        </div>
      )}
    </div>
  );
}

function RevenueChart() {
  // This would normally use a chart library like recharts
  // For this example, we'll create a simple visual representation
  return (
    <div className="relative h-full w-full flex items-end justify-between gap-1 pb-4">
      {[11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map(hour => (
        <div key={hour} className="flex-1 flex items-end gap-0.5 h-full">
          <div
            className="w-1/3 bg-yellow-400 rounded-t-sm"
            style={{ height: `${Math.random() * 70 + 20}%` }}
          ></div>
          <div
            className="w-1/3 bg-indigo-500 rounded-t-sm"
            style={{ height: `${Math.random() * 50 + 10}%` }}
          ></div>
          <div
            className="w-1/3 bg-blue-500 rounded-t-sm"
            style={{ height: `${Math.random() * 60 + 15}%` }}
          ></div>
          <div className="absolute -bottom-2 text-[8px] text-muted-foreground">{hour}:00</div>
        </div>
      ))}
    </div>
  );
}

function InvestmentPieChart() {
  // This would normally use a chart library
  // For this example, we'll use a simple SVG
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ddd" strokeWidth="1" />

      {/* Blue segment - 40% */}
      <path d="M 50 50 L 50 10 A 40 40 0 0 1 87.32 65 Z" fill="#3b82f6" />

      {/* Yellow segment - 35% */}
      <path d="M 50 50 L 87.32 65 A 40 40 0 0 1 28.68 85 Z" fill="#f0d687" />

      {/* Red segment - 25% */}
      <path d="M 50 50 L 28.68 85 A 40 40 0 0 1 50 10 Z" fill="#ef4444" />
    </svg>
  );
}
