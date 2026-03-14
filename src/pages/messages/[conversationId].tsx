import { useUser } from '@clerk/nextjs';
import { format } from 'date-fns';
import { ArrowLeft, Loader2, Send, UserRound } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Header } from '~/components/header';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { api } from '~/utils/api';
import { getDisplayName, type UserWithProfile } from '~/utils/user-display';

export default function ConversationPage() {
  const router = useRouter();
  const { conversationId } = router.query as { conversationId: string };
  const { isLoaded, isSignedIn } = useUser();
  const utils = api.useUtils();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [messageText, setMessageText] = useState('');

  const { data: userData } = api.user.getUser.useQuery(undefined, {
    enabled: isLoaded && !!isSignedIn,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const myUserId = userData?.id;

  useEffect(() => {
    if (isLoaded && !isSignedIn) void router.push('/login');
  }, [isLoaded, isSignedIn, router]);

  const { data, isLoading, refetch } = api.messages.getMessages.useQuery(
    { conversationId, limit: 50 },
    {
      enabled: isLoaded && !!isSignedIn && !!conversationId,
      refetchInterval: 30_000,
      refetchOnWindowFocus: true,
      staleTime: 10_000,
    }
  );

  const { mutate: markAsRead } = api.messages.markAsRead.useMutation({
    onSuccess: () => {
      void utils.messages.getUnreadCount.invalidate();
      void utils.messages.getConversations.invalidate();
    },
  });

  useEffect(() => {
    if (conversationId && isSignedIn) {
      markAsRead({ conversationId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, isSignedIn]);

  const messages = data?.messages ?? [];
  const prevLengthRef = useRef(0);

  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      markAsRead({ conversationId });
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevLengthRef.current = messages.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  const { mutate: sendMessage, isPending: isSending } = api.messages.sendMessage.useMutation({
    onSuccess: () => {
      setMessageText('');
      void refetch();
      void utils.messages.getUnreadCount.invalidate();
    },
    onError: () => {
      toast.error('Failed to send message. Please try again.');
    },
  });

  const handleSend = () => {
    const trimmed = messageText.trim();
    if (!trimmed || !conversationId) return;
    sendMessage({ conversationId, content: trimmed });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Derive other participant name from messages
  const otherParticipant = messages.find(m => m.senderId !== myUserId)?.sender as
    | UserWithProfile
    | undefined;
  const conversationTitle = otherParticipant ? getDisplayName(otherParticipant) : 'Conversation';

  if (!isLoaded || !isSignedIn) return null;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col p-4 md:p-8">
      <Header />
      <div className="mt-12 flex flex-1 flex-col">
        <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-white/10 bg-card">
          {/* Header bar */}
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3 md:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => void router.push('/messages')}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <span className="text-lg font-semibold text-white">{conversationTitle}</span>
          </div>

          {/* Message list */}
          <div
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4 md:px-6"
            style={{ minHeight: '400px' }}
          >
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <p className="py-8 text-center text-sm text-white/40">
                No messages yet. Say hello!
              </p>
            ) : (
              messages.map(msg => {
                const isOwn = msg.senderId === myUserId;
                const sender = msg.sender as UserWithProfile;

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex items-end gap-2',
                      isOwn ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {!isOwn &&
                      (sender.imageUrl ? (
                        <Image
                          src={sender.imageUrl}
                          alt="avatar"
                          width={28}
                          height={28}
                          className="mb-1 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10">
                          <UserRound className="size-4 text-neutral-400" />
                        </div>
                      ))}
                    <div
                      className={cn(
                        'max-w-[70%] rounded-2xl px-4 py-2 text-sm',
                        isOwn
                          ? 'rounded-br-sm bg-primary text-black'
                          : 'rounded-bl-sm bg-white/10 text-white'
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      <p
                        className={cn(
                          'mt-1 text-right text-[10px]',
                          isOwn ? 'text-black/50' : 'text-white/40'
                        )}
                      >
                        {format(new Date(msg.createdAt), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="flex items-end gap-2 border-t border-white/10 px-4 py-3 md:px-6">
            <textarea
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
              rows={1}
              className="max-h-32 flex-1 resize-none overflow-y-auto rounded-xl bg-white/5 px-4 py-2 text-sm text-white outline-none placeholder:text-[#aaabad] focus:ring-1 focus:ring-white/20"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={isSending || !messageText.trim()}
              className="shrink-0"
            >
              {isSending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
