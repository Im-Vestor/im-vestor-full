import AdminLayout from '../index';
import { api } from '~/utils/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { AlertCircle, Loader2, Send } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Textarea } from '~/components/ui/textarea';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { useToast } from '~/hooks/use-toast';
import { type SupportTicketStatus } from '@prisma/client';

type SupportTicket = {
  id: string;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  user: {
    id: string;
    email: string;
  };
  replies: {
    id: string;
    message: string;
    createdAt: Date;
    ticketId: string;
    adminId: string;
    admin: {
      id: string;
      email: string;
    };
  }[];
};

function SupportTicketsList() {
  const { data: tickets, isLoading, error, refetch } = api.support.getAll.useQuery<SupportTicket[]>();
  const { mutate: updateStatus } = api.support.updateStatus.useMutation({
    onSuccess: () => refetch(),
  });
  const { mutate: addReply } = api.support.addReply.useMutation({
    onSuccess: () => refetch(),
  });
  const { toast } = useToast();

  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

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
        <AlertDescription>Failed to load support tickets: {error.message}</AlertDescription>
      </Alert>
    );
  }

  if (!tickets || tickets.length === 0) {
    return <p className="text-center text-muted-foreground">No support tickets found.</p>;
  }

  const handleStatusChange = (ticketId: string, status: SupportTicketStatus) => {
    updateStatus(
      { ticketId, status },
      {
        onSuccess: () => {
          toast({
            title: 'Status updated',
            description: `Ticket status has been updated to ${status.toLowerCase()}`,
          });
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: `Failed to update status: ${error.message}`,
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleReply = (ticketId: string) => {
    if (!replyMessage.trim()) {
      toast({
        title: 'Error',
        description: 'Reply message cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    addReply(
      { ticketId, message: replyMessage },
      {
        onSuccess: () => {
          setReplyMessage('');
          setSelectedTicket(null);
          toast({
            title: 'Reply sent',
            description: 'Your reply has been sent successfully',
          });
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: `Failed to send reply: ${error.message}`,
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell>{ticket.user.email ?? 'N/A'}</TableCell>
                <TableCell>{ticket.subject}</TableCell>
                <TableCell className="max-w-xs truncate">{ticket.message}</TableCell>
                <TableCell>
                  <Select
                    defaultValue={ticket.status}
                    onValueChange={(value) => handleStatusChange(ticket.id, value as SupportTicketStatus)}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{new Date(ticket.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTicket(ticket.id)}
                  >
                    Reply
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Support Ticket Conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {selectedTicket && (
              <>
                {/* Original ticket message */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Original Request</h3>
                    <span className="text-xs text-muted-foreground">
                      {new Date(tickets.find(t => t.id === selectedTicket)?.createdAt ?? '').toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium">
                        {tickets.find(t => t.id === selectedTicket)?.user.email}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {tickets.find(t => t.id === selectedTicket)?.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-medium">
                      {tickets.find(t => t.id === selectedTicket)?.subject}
                    </h4>
                    <p className="text-sm whitespace-pre-wrap">
                      {tickets.find(t => t.id === selectedTicket)?.message}
                    </p>
                  </div>
                </div>

                {/* Replies */}
                {tickets.find(t => t.id === selectedTicket)?.replies.length ? (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Conversation History</h3>
                    <div className="space-y-3">
                      {tickets
                        .find(t => t.id === selectedTicket)
                        ?.replies
                        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                        .map((reply) => (
                          <div key={reply.id} className="bg-muted p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Support</span>
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Staff</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(reply.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    No replies yet
                  </div>
                )}

                {/* Reply input */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium mb-2">Add Reply</h3>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your reply..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <Button
                      onClick={() => selectedTicket && handleReply(selectedTicket)}
                      className="self-end"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SupportPage() {
  return (
    <AdminLayout>
      <SupportTicketsList />
    </AdminLayout>
  );
}
