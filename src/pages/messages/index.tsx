import { useUser } from '@clerk/nextjs';
import { format, formatDistanceToNow } from 'date-fns';
import { Loader2, MessageSquare, Send, UserRound } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Header } from '~/components/header';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { api } from '~/utils/api';
import { getDisplayName, type UserWithProfile } from '~/utils/user-display';

export default function MessagesPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const utils = api.useUtils();

  const activeConversationId = router.query.c as string | undefined;

  useEffect(() => {
    if (isLoaded && !isSignedIn) void router.push('/login');
  }, [isLoaded, isSignedIn, router]);

  const { data: conversations, isLoading: convLoading } = api.messages.getConversations.useQuery(
    undefined,
    {
      enabled: isLoaded && !!isSignedIn,
      refetchInterval: 30_000,
      refetchOnWindowFocus: true,
      staleTime: 15_000,
    }
  );

  const activeConversation = conversations?.find(c => c.id === activeConversationId);
  const activeOtherParticipant = activeConversation?.participants[0] as UserWithProfile | undefined;

  const selectConversation = (id: string) => {
    void router.push(`/messages?c=${id}`, undefined, { shallow: true });
  };

  const goBackToList = () => {
    void router.push('/messages', undefined, { shallow: true });
  };

  if (!isLoaded || !isSignedIn) return null;

  return (
    <main className="mx-auto flex max-w-6xl flex-col p-4 md:p-8" style={{ minHeight: '100dvh' }}>
      <Header />

      {/* Full-height chat container below header */}
      <div
        className="mt-4 flex flex-1 overflow-hidden rounded-xl border border-white/10"
        style={{ height: 'calc(100dvh - 120px)' }}
      >
        {/* ── Left sidebar ── */}
        <div
          className={cn(
            'flex flex-col border-r border-white/10 bg-card',
            'w-full md:w-72 md:shrink-0',
            activeConversationId ? 'hidden md:flex' : 'flex'
          )}
        >
          {/* Sidebar header */}
          <div className="border-b border-white/10 px-5 py-4">
            <h1 className="text-lg font-semibold">Messages</h1>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {convLoading ? (
              <div className="space-y-1 p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-2.5 w-36" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !conversations || conversations.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                <MessageSquare className="size-8 opacity-30" />
                <p className="text-sm">No conversations yet</p>
              </div>
            ) : (
              <div className="py-2">
                {conversations.map(conv => {
                  const other = conv.participants[0] as UserWithProfile | undefined;
                  if (!other) return null;
                  const displayName = getDisplayName(other);
                  const lastMsg = conv.messages[0];
                  const hasUnread = conv.unreadCount > 0;
                  const isActive = conv.id === activeConversationId;

                  return (
                    <button
                      key={conv.id}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-white/5',
                        isActive && 'bg-white/8'
                      )}
                      onClick={() => selectConversation(conv.id)}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {other.imageUrl ? (
                          <Image
                            src={other.imageUrl}
                            alt={displayName}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                            <UserRound className="size-5 text-neutral-400" />
                          </div>
                        )}
                        {hasUnread && (
                          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />
                        )}
                      </div>

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-1">
                          <span
                            className={cn(
                              'truncate text-sm',
                              hasUnread ? 'font-semibold' : 'font-normal text-foreground/80'
                            )}
                          >
                            {displayName}
                          </span>
                          {lastMsg && (
                            <span className="shrink-0 text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(lastMsg.createdAt))}
                            </span>
                          )}
                        </div>
                        {lastMsg && (
                          <p
                            className={cn(
                              'truncate text-xs',
                              hasUnread ? 'text-foreground/70' : 'text-muted-foreground'
                            )}
                          >
                            {lastMsg.senderId !== other.id ? 'You: ' : ''}
                            {lastMsg.content}
                          </p>
                        )}
                      </div>

                      {hasUnread && (
                        <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                          {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div
          className={cn(
            'flex flex-1 flex-col bg-card',
            !activeConversationId && 'hidden md:flex'
          )}
        >
          {activeConversationId ? (
            <ChatPanel
              conversationId={activeConversationId}
              otherParticipant={activeOtherParticipant}
              onBack={goBackToList}
              onMessageSent={() => void utils.messages.getConversations.invalidate()}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
              <MessageSquare className="size-12 opacity-20" />
              <p className="text-sm">Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// ─── Chat panel ────────────────────────────────────────────────────────────

function ChatPanel({
  conversationId,
  otherParticipant,
  onBack,
  onMessageSent,
}: {
  conversationId: string;
  otherParticipant: UserWithProfile | undefined;
  onBack: () => void;
  onMessageSent: () => void;
}) {
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
    if (conversationId && isSignedIn) markAsRead({ conversationId });
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
      onMessageSent();
    },
    onError: () => toast.error('Failed to send message. Please try again.'),
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

  // Fallback: derive other participant from messages if not passed from list
  const participantFromMessages = messages.find(m => m.senderId !== myUserId)?.sender as
    | UserWithProfile
    | undefined;
  const participant = otherParticipant ?? participantFromMessages;
  const displayName = participant ? getDisplayName(participant) : null;

  return (
    <>
      {/* Chat header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-3">
        {/* Back arrow — mobile only */}
        <button
          type="button"
          className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white/10 md:hidden"
          onClick={onBack}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>

        {participant?.imageUrl ? (
          <Image
            src={participant.imageUrl}
            alt={displayName ?? 'User'}
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
            <UserRound className="size-5 text-neutral-400" />
          </div>
        )}

        <div className="min-w-0">
          {displayName ? (
            <>
              <p className="truncate text-sm font-semibold leading-tight">{displayName}</p>
              {participant && (
                <p className="text-xs text-muted-foreground capitalize">
                  {participant.userType.toLowerCase().replace('_', ' ')}
                </p>
              )}
            </>
          ) : (
            <Skeleton className="h-4 w-32" />
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No messages yet. Say hello!
          </p>
        ) : (
          messages.map(msg => {
            const isOwn = msg.senderId === myUserId;
            const sender = msg.sender as UserWithProfile;

            return (
              <div
                key={msg.id}
                className={cn('flex items-end gap-2', isOwn ? 'justify-end' : 'justify-start')}
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
                      ? 'rounded-br-sm bg-primary text-primary-foreground'
                      : 'rounded-bl-sm bg-white/10 text-foreground'
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p
                    className={cn(
                      'mt-1 text-right text-[10px] opacity-60'
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

      {/* Input */}
      <div className="shrink-0 flex items-end gap-2 border-t border-white/10 px-4 py-3">
        <textarea
          value={messageText}
          onChange={e => setMessageText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send)"
          rows={1}
          className="max-h-32 flex-1 resize-none overflow-y-auto rounded-xl bg-white/5 px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-white/20"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={isSending || !messageText.trim()}
          className="shrink-0"
        >
          {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </div>
    </>
  );
}

// Inline skeleton for header fallback
function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-white/10', className)} />;
}
