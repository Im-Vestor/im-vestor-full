import AdminLayout from '../index';
import { api } from '~/utils/api';
import { AlertCircle, Clock, Loader2, MessageCircle, Send, X, User } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Textarea } from '~/components/ui/textarea';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { useToast } from '~/hooks/use-toast';
import { type SupportTicketStatus } from '@prisma/client';
import { cn } from '~/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";

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
  const { mutate: addReply, isPending: isAddingReply } = api.support.addReply.useMutation({
    onSuccess: () => {
      setReplyMessage('');
      setIsReplyBoxOpen(null);
      void refetch();
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
  });
  const { toast } = useToast();

  const [replyMessage, setReplyMessage] = useState('');
  const [isReplyBoxOpen, setIsReplyBoxOpen] = useState<string | null>(null);

  const getStatusColor = (status: SupportTicketStatus) => {
    switch (status) {
      case 'OPEN':
        return 'bg-amber-500/10 text-amber-500';
      case 'CLOSED':
        return 'bg-emerald-500/10 text-emerald-500';
      default:
        return 'bg-neutral-500/10 text-neutral-500';
    }
  };

  const getStatusLabel = (status: SupportTicketStatus) => {
    switch (status) {
      case 'OPEN':
        return 'Pending';
      case 'CLOSED':
        return 'Solved';
      default:
        return status;
    }
  };

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

    addReply({ ticketId, message: replyMessage.trim() });
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <Select
          defaultValue="all"
          onValueChange={(value) => {
            // TODO: Add filter functionality
            console.log('Filter by:', value);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tickets</SelectItem>
            <SelectItem value="OPEN">Open Tickets</SelectItem>
            <SelectItem value="CLOSED">Closed Tickets</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Accordion type="single" collapsible className="space-y-4">
        {tickets.map((ticket) => (
          <AccordionItem
            key={ticket.id}
            value={ticket.id}
            className={cn(
              "border rounded-lg overflow-hidden",
              "hover:border-white/20 hover:shadow-lg",
              "bg-gradient-to-br from-background to-background/50"
            )}
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex flex-1 items-center justify-between gap-4">
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{ticket.user.email}</span>
                    </div>
                  </div>
                  <h3 className="font-medium text-lg">{ticket.subject}</h3>
                  <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
                    <Badge className={cn("px-3 py-1", getStatusColor(ticket.status))}>
                      {getStatusLabel(ticket.status)}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      <span>{ticket.replies.length} replies</span>
                    </div>
                  </div>
                </div>
                <Select
                  value={ticket.status}
                  onValueChange={(value) => handleStatusChange(ticket.id, value as SupportTicketStatus)}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="px-4 py-3 border-t border-white/10">
                {/* Original Message */}
                <div className="flex items-start gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-medium text-primary">User</span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-white/5 rounded-lg rounded-tl-none p-4 border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(ticket.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{ticket.message}</p>
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {ticket.replies && ticket.replies.length > 0 && (
                  <div className="space-y-6 mt-6">
                    {ticket.replies.map((reply) => {
                      const isUserReply = reply.admin.email === undefined;
                      return (
                        <div
                          key={reply.id}
                          className={cn(
                            "flex items-start gap-3",
                            isUserReply ? "" : "flex-row-reverse"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                            isUserReply ? "bg-primary/10" : "bg-blue-500/20"
                          )}>
                            <span className={cn(
                              "text-[10px] font-medium",
                              isUserReply ? "text-primary" : "text-blue-500"
                            )}>
                              {isUserReply ? 'User' : 'Support'}
                            </span>
                          </div>
                          <div className={cn(
                            "flex-1",
                            isUserReply ? "" : "flex flex-col items-end"
                          )}>
                            <div className={cn(
                              "max-w-[85%]",
                              "rounded-lg p-4 border",
                              isUserReply
                                ? "bg-white/5 rounded-tl-none border-white/10"
                                : "bg-blue-500/10 rounded-tr-none border-blue-500/20"
                            )}>
                              <div className={cn(
                                "flex items-center gap-2 mb-2",
                                isUserReply ? "" : "flex-row-reverse"
                              )}>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(reply.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Reply Input */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <Collapsible
                    open={isReplyBoxOpen === ticket.id}
                    onOpenChange={(open) => {
                      setIsReplyBoxOpen(open ? ticket.id : null);
                      if (!open) {
                        setReplyMessage('');
                      }
                    }}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-center gap-2",
                          isReplyBoxOpen === ticket.id && "mb-4"
                        )}
                      >
                        {isReplyBoxOpen === ticket.id ? (
                          <>
                            <X className="h-4 w-4" />
                            Close Reply
                          </>
                        ) : (
                          <>
                            <MessageCircle className="h-4 w-4" />
                            Reply to Ticket
                          </>
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-medium text-blue-500">Support</span>
                        </div>
                        <div className="flex-1 space-y-2">
                          <Textarea
                            placeholder="Type your reply..."
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            className="min-h-[100px] bg-white/5 border-white/10"
                          />
                          <div className="flex justify-end">
                            <Button
                              onClick={() => handleReply(ticket.id)}
                              disabled={isAddingReply}
                              className="gap-2"
                            >
                              {isAddingReply ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                              Send Reply
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
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
