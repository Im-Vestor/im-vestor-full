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
import { Input } from "~/components/ui/input";
import { Search } from "lucide-react";
import { useDebounce } from "~/hooks/use-debounce";
import { format } from 'date-fns';
import type { ProjectViewWithRelations } from '~/types/admin';

function ProjectViewsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading } = api.admin.getProjectViews.useQuery<{
    items: ProjectViewWithRelations[];
    total: number;
    pages: number;
  }>({
    page,
    perPage: 10,
    search: debouncedSearch,
  });

  if (isLoading) {
    return <TableSkeleton columns={5} />;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Project Views</h1>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects or investors..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Entrepreneur</TableHead>
              <TableHead>Investor</TableHead>
              <TableHead>Investor Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items.map((view) => (
              <TableRow key={view.id}>
                <TableCell>
                  {format(new Date(view.createdAt), 'dd/MM/yyyy HH:mm')}
                </TableCell>
                <TableCell>{view.project.name}</TableCell>
                <TableCell>
                  {view.project.Entrepreneur
                    ? `${view.project.Entrepreneur.firstName} ${view.project.Entrepreneur.lastName}`
                    : '-'}
                </TableCell>
                <TableCell>
                  {view.investor
                    ? `${view.investor.firstName} ${view.investor.lastName}`
                    : '-'}
                </TableCell>
                <TableCell>{view.investor?.user.email ?? '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <div className="text-sm text-muted-foreground">
          Page {page} of {data?.pages ?? 1}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => (p < (data?.pages ?? 0) ? p + 1 : p))}
          disabled={page >= (data?.pages ?? 0)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function TableSkeleton({ columns }: { columns: number }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-[100px]" />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-4 w-[100px]" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function ProjectViewsPage() {
  return (
    <AdminLayout>
      <ProjectViewsList />
    </AdminLayout>
  );
}