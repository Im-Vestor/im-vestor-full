import { useUser } from '@clerk/nextjs';
import { type SupportTicketStatus } from '@prisma/client';
import { AlertCircle, Clock, Loader2, MessageCircle, Send, X } from 'lucide-react';
import { Header } from '~/components/header';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Textarea } from '~/components/ui/textarea';
import { api } from '~/utils/api';
import { cn } from '~/lib/utils';
import { toast } from 'sonner';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";

type SupportTicket = {
  id: string;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  replies: {
    id: string;
    message: string;
    createdAt: Date;
    ticketId: string;
    adminId: string;
    admin: {
      email: string;
    };
  }[];
};

export default function SupportTickets() {
  const [replyMessage, setReplyMessage] = useState('');
  const [replyingToTicket, setReplyingToTicket] = useState<string | null>(null);
  const [isReplyBoxOpen, setIsReplyBoxOpen] = useState<string | null>(null);

  const utils = api.useUtils();
  const { data: tickets, isLoading, error } = api.support.getMyTickets.useQuery<SupportTicket[]>();
  const { mutate: addReply, isPending: isAddingReply } = api.support.addUserReply.useMutation({
    onSuccess: () => {
      toast.success('Reply sent successfully');
      setReplyMessage('');
      setReplyingToTicket(null);
      setIsReplyBoxOpen(null);
      void utils.support.getMyTickets.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

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

  const handleReply = (ticketId: string) => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    addReply({
      ticketId,
      message: replyMessage.trim(),
    });
  };

  return (
    <>
      <main className="mx-auto min-h-screen max-w-6xl p-4 sm:p-8">
        <Header />
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          {isLoading && (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
          {!isLoading && !error && tickets && tickets.length === 0 && (
            <Alert>
              <AlertDescription>You haven't submitted any support tickets yet.</AlertDescription>
            </Alert>
          )}
          {!isLoading && !error && tickets && tickets.length > 0 && (
            <Accordion type="single" collapsible className="space-y-4">
              {tickets.map((ticket: SupportTicket) => (
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
                        <h3 className="font-medium text-lg">{ticket.subject}</h3>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
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
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="px-4 py-3 border-t border-white/10">
                      {/* Original Message */}
                      <div className="flex items-start gap-3 mb-6">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-primary">You</span>
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
                            const isUserReply = reply.adminId === ticket.userId;
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
                                    "text-xs font-medium",
                                    isUserReply ? "text-primary" : "text-blue-500"
                                  )}>
                                    {isUserReply ? 'You' : 'S'}
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

                      {/* Reply Input - Only show for open tickets */}
                      {ticket.status === 'OPEN' && (
                        <div className="mt-6 pt-6 border-t border-white/10">
                          <Collapsible
                            open={isReplyBoxOpen === ticket.id}
                            onOpenChange={(open) => {
                              setIsReplyBoxOpen(open ? ticket.id : null);
                              if (open) {
                                setReplyingToTicket(ticket.id);
                              } else {
                                setReplyMessage('');
                                setReplyingToTicket(null);
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
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-medium text-primary">You</span>
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
                                      disabled={isAddingReply && replyingToTicket === ticket.id}
                                      className="gap-2"
                                    >
                                      {isAddingReply && replyingToTicket === ticket.id ? (
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
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </main>
    </>
  );
}