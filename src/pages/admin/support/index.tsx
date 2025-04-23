import AdminLayout from '../index';
import { api } from '~/utils/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { Badge } from '~/components/ui/badge';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';

function SupportTicketsList() {
  const { data: tickets, isLoading, error } = api.support.getAll.useQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load support tickets: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!tickets || tickets.length === 0) {
    return <p className="text-center text-muted-foreground">No support tickets found.</p>;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell>{ticket.user.email ?? 'N/A'}</TableCell>
              <TableCell>{ticket.subject}</TableCell>
              <TableCell className="max-w-xs truncate">{ticket.message}</TableCell>
              <TableCell>
                <Badge variant={ticket.status === 'OPEN' ? 'default' : 'secondary'}>
                  {ticket.status}
                </Badge>
              </TableCell>
              <TableCell>{new Date(ticket.createdAt).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function SupportPage() {
  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold mb-4">Support Tickets</h1>
      <SupportTicketsList />
    </AdminLayout>
  );
}
