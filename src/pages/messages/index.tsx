import { useUser } from '@clerk/nextjs';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Header } from '~/components/header';
import { UserAvatar } from '~/components/UserAvatar';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { useOnlineStatuses } from '~/hooks/use-presence';
import { api, type RouterOutputs } from '~/utils/api';
import { getDisplayName, type UserWithProfile } from '~/utils/user-display';

function shortTimeAgo(date: Date | string) {
  const str = formatDistanceToNowStrict(new Date(date));
  return str
    .replace(' seconds', 's')
    .replace(' second', 's')
    .replace(' minutes', 'min')
    .replace(' minute', 'min')
    .replace(' hours', 'h')
    .replace(' hour', 'h')
    .replace(' days', 'd')
    .replace(' day', 'd')
    .replace(' months', 'mo')
    .replace(' month', 'mo')
    .replace(' years', 'y')
    .replace(' year', 'y');
}

type MessagesOutput = RouterOutputs['messages']['getMessages'];
type ConversationsOutput = RouterOutputs['messages']['getConversations'];

export default function MessagesPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const utils = api.useUtils();

  const activeConversationId = router.query.c as string | undefined;
  const openSupport = router.query.support === '1';

  useEffect(() => {
    if (isLoaded && !isSignedIn) void router.push('/login');
  }, [isLoaded, isSignedIn, router]);

  const { data: conversations, isLoading: convLoading } = api.messages.getConversations.useQuery(
    undefined,
    {
      enabled: isLoaded && !!isSignedIn,
      refetchInterval: 15_000,
      refetchOnWindowFocus: true,
      staleTime: 5_000,
    }
  );

  const { mutate: getOrCreateSupport, isPending: isOpeningSupport } =
    api.messages.getOrCreateSupportConversation.useMutation({
      onSuccess: ({ conversationId }) => {
        void router.replace(`/messages?c=${conversationId}`, undefined, { shallow: true });
        void utils.messages.getConversations.invalidate();
      },
      onError: () => toast.error('Support is unavailable right now. Please try again later.'),
    });

  // Auto-open support conversation when ?support=1
  useEffect(() => {
    if (openSupport && isLoaded && isSignedIn && !isOpeningSupport) {
      getOrCreateSupport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSupport, isLoaded, isSignedIn]);

  // Collect participant IDs for online status tracking
  const participantIds = (conversations ?? [])
    .map(c => (c.participants[0] as UserWithProfile | undefined)?.id)
    .filter((id): id is string => !!id);
  const onlineStatuses = useOnlineStatuses(participantIds);

  const activeConversation = conversations?.find(c => c.id === activeConversationId);
  const activeOtherParticipant = activeConversation?.participants[0] as UserWithProfile | undefined;

  // Determine if the active conversation is the support conversation
  const isSupportConversation =
    activeOtherParticipant?.userType === 'ADMIN';

  const selectConversation = (id: string) => {
    void router.push(`/messages?c=${id}`, undefined, { shallow: true });
  };

  const goBackToList = () => {
    void router.push('/messages', undefined, { shallow: true });
  };

  // Pinned support conversation entry (from the loaded conversations list)
  const supportConversation = conversations?.find(c => {
    const other = c.participants[0] as UserWithProfile | undefined;
    return other?.userType === 'ADMIN';
  });

  const regularConversations = conversations?.filter(c => {
    const other = c.participants[0] as UserWithProfile | undefined;
    return other?.userType !== 'ADMIN';
  });

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

          {/* Pinned support entry */}
          <div className="border-b border-white/10">
            {convLoading ? (
              <div className="flex items-center gap-3 px-3 py-3">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-2.5 w-10" />
                  </div>
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
            ) : supportConversation ? (
              <SupportConversationEntry
                conversationId={supportConversation.id}
                unreadCount={supportConversation.unreadCount}
                lastMessage={supportConversation.messages[0]}
                isActive={supportConversation.id === activeConversationId}
                onClick={() => selectConversation(supportConversation.id)}
              />
            ) : (
              <button
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-white/5"
                onClick={() => !isOpeningSupport && getOrCreateSupport()}
                disabled={isOpeningSupport}
              >
                <SupportAvatar />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">Im-Vestor Support</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {isOpeningSupport ? 'Opening...' : 'Start a conversation'}
                  </p>
                </div>
              </button>
            )}
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {convLoading ? (
              <div className="py-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-3">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="h-2.5 w-8" />
                      </div>
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !regularConversations || regularConversations.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                <MessageSquare className="size-8 opacity-30" />
                <p className="text-sm">No conversations yet</p>
              </div>
            ) : (
              <div className="py-2">
                {regularConversations.map(conv => {
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
                      {/* Avatar with online indicator */}
                      <div className="relative shrink-0">
                        <UserAvatar
                          imageUrl={other.imageUrl}
                          alt={displayName}
                          size={40}
                          isOnline={!!onlineStatuses[other.id]}
                          showStatus
                        />
                        {hasUnread && (
                          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />
                        )}
                      </div>

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              'truncate text-sm leading-tight',
                              hasUnread ? 'font-semibold' : 'font-normal text-foreground/80'
                            )}
                          >
                            {displayName}
                          </span>
                          {lastMsg && (
                            <span className="shrink-0 text-[10px] leading-tight text-muted-foreground">
                              {shortTimeAgo(lastMsg.createdAt)}
                            </span>
                          )}
                        </div>
                        {lastMsg && (
                          <p
                            className={cn(
                              'mt-0.5 truncate text-xs',
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
              isSupport={isSupportConversation}
              isOtherOnline={activeOtherParticipant ? !!onlineStatuses[activeOtherParticipant.id] : false}
              onlineStatuses={onlineStatuses}
              onBack={goBackToList}
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

// ─── Support avatar ─────────────────────────────────────────────────────────

function SupportAvatar({ size = 40 }: { size?: number }) {
  return (
    <div
      className="shrink-0 rounded-full overflow-hidden bg-[#030014] border border-white/20 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Image src="/logo/imvestor.png" alt="Im-Vestor Support" width={size - 10} height={size - 10} />
    </div>
  );
}

// ─── Pinned support entry ────────────────────────────────────────────────────

function SupportConversationEntry({
  conversationId: _conversationId,
  unreadCount,
  lastMessage,
  isActive,
  onClick,
}: {
  conversationId: string;
  unreadCount: number;
  lastMessage: { content: string; createdAt: Date | string; senderId: string } | undefined;
  isActive: boolean;
  onClick: () => void;
}) {
  const hasUnread = unreadCount > 0;

  return (
    <button
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-white/5',
        isActive && 'bg-white/8'
      )}
      onClick={onClick}
    >
      <div className="relative shrink-0">
        <SupportAvatar />
        {hasUnread && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={cn('truncate text-sm leading-tight', hasUnread ? 'font-semibold' : 'font-normal text-foreground/80')}>
            Im-Vestor Support
          </span>
          {lastMessage && (
            <span className="shrink-0 text-[10px] leading-tight text-muted-foreground">
              {shortTimeAgo(lastMessage.createdAt)}
            </span>
          )}
        </div>
        {lastMessage ? (
          <p className={cn('mt-0.5 truncate text-xs', hasUnread ? 'text-foreground/70' : 'text-muted-foreground')}>
            {lastMessage.content}
          </p>
        ) : (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">Support chat</p>
        )}
      </div>

      {hasUnread && (
        <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}

// ─── Chat panel ────────────────────────────────────────────────────────────

function ChatPanel({
  conversationId,
  otherParticipant,
  isSupport,
  isOtherOnline,
  onlineStatuses,
  onBack,
}: {
  conversationId: string;
  otherParticipant: UserWithProfile | undefined;
  isSupport: boolean;
  isOtherOnline: boolean;
  onlineStatuses: Record<string, boolean>;
  onBack: () => void;
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

  const queryKey = { conversationId, limit: 50 };

  const { data, isLoading } = api.messages.getMessages.useQuery(queryKey, {
    enabled: isLoaded && !!isSignedIn && !!conversationId,
    refetchInterval: 5_000,
    refetchOnWindowFocus: true,
    staleTime: 2_000,
  });

  const { mutate: markAsRead } = api.messages.markAsRead.useMutation({
    onSuccess: () => {
      void utils.messages.getUnreadCount.invalidate();
      // Update conversation unread count in cache instead of refetching
      utils.messages.getConversations.setData(undefined, (old) => {
        if (!old) return old;
        return old.map((c) =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        );
      });
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

  // Build the sender object for optimistic messages from the current user data
  const buildOptimisticSender = useCallback(() => {
    if (!userData) return null;
    return {
      id: userData.id,
      imageUrl: userData.imageUrl ?? null,
      userType: userData.userType,
      entrepreneur: userData.entrepreneur
        ? { firstName: userData.entrepreneur.firstName, lastName: userData.entrepreneur.lastName }
        : null,
      investor: userData.investor
        ? { firstName: userData.investor.firstName, lastName: userData.investor.lastName }
        : null,
      incubator: userData.incubator ? { name: userData.incubator.name } : null,
      partner: userData.partner
        ? { firstName: userData.partner.firstName, lastName: userData.partner.lastName }
        : null,
      vcGroup: userData.vcGroup ? { name: userData.vcGroup.name } : null,
    };
  }, [userData]);

  const { mutate: sendMessage, isPending: isSending } = api.messages.sendMessage.useMutation({
    onMutate: async (variables) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await utils.messages.getMessages.cancel(queryKey);

      const previousData = utils.messages.getMessages.getData(queryKey);
      const sender = buildOptimisticSender();

      if (sender) {
        const optimisticMessage = {
          id: `optimistic-${Date.now()}`,
          content: variables.content,
          senderId: myUserId!,
          conversationId: variables.conversationId,
          createdAt: new Date(),
          readAt: null,
          sender,
        };

        utils.messages.getMessages.setData(queryKey, (old) => {
          if (!old) return { messages: [optimisticMessage], nextCursor: undefined } as unknown as MessagesOutput;
          return { ...old, messages: [...old.messages, optimisticMessage] } as unknown as MessagesOutput;
        });

        // Also update the conversation list to show latest message
        utils.messages.getConversations.setData(undefined, (old) => {
          if (!old) return old;
          return old.map((c) =>
            c.id === variables.conversationId
              ? {
                ...c,
                updatedAt: new Date(),
                messages: [
                  {
                    id: optimisticMessage.id,
                    content: variables.content,
                    createdAt: new Date(),
                    senderId: myUserId!,
                    readAt: null,
                  },
                ],
              }
              : c
          );
        });
      }

      setMessageText('');
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousData) {
        utils.messages.getMessages.setData(queryKey, context.previousData);
      }
      toast.error('Failed to send message. Please try again.');
    },
    onSettled: () => {
      // Refetch to sync with server (replaces optimistic IDs with real ones)
      void utils.messages.getMessages.invalidate(queryKey);
      void utils.messages.getConversations.invalidate();
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

  // Fallback: derive other participant from messages if not passed from list
  const participantFromMessages = messages.find((m) => m.senderId !== myUserId)?.sender as
    | UserWithProfile
    | undefined;
  const participant = otherParticipant ?? participantFromMessages;
  const displayName = isSupport
    ? 'Im-Vestor Support'
    : participant
      ? getDisplayName(participant)
      : null;

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

        {isSupport ? (
          <SupportAvatar size={36} />
        ) : (
          <UserAvatar
            imageUrl={participant?.imageUrl}
            alt={displayName ?? 'User'}
            size={36}
            isOnline={isOtherOnline}
            showStatus
          />
        )}

        <div className="min-w-0">
          {displayName ? (
            <>
              <p className="truncate text-sm font-semibold leading-tight">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                {isSupport
                  ? 'Im-Vestor platform support'
                  : isOtherOnline
                    ? 'Online'
                    : participant?.userType.toLowerCase().replace('_', ' ')}
              </p>
            </>
          ) : (
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-2.5 w-20" />
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {/* Incoming message skeleton */}
            <div className="flex items-end gap-2">
              <Skeleton className="mb-1 h-7 w-7 shrink-0 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-10 w-48 rounded-2xl rounded-bl-sm" />
              </div>
            </div>
            {/* Own message skeleton */}
            <div className="flex items-end justify-end gap-2">
              <Skeleton className="h-10 w-56 rounded-2xl rounded-br-sm" />
            </div>
            {/* Incoming message skeleton */}
            <div className="flex items-end gap-2">
              <Skeleton className="mb-1 h-7 w-7 shrink-0 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-16 w-64 rounded-2xl rounded-bl-sm" />
              </div>
            </div>
            {/* Own message skeleton */}
            <div className="flex items-end justify-end gap-2">
              <Skeleton className="h-10 w-40 rounded-2xl rounded-br-sm" />
            </div>
          </div>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {isSupport
              ? 'Send a message to reach Im-Vestor support. We\'ll get back to you as soon as possible.'
              : 'No messages yet. Say hello!'}
          </p>
        ) : (
          messages.map(msg => {
            const isOwn = msg.senderId === myUserId;
            const sender = msg.sender as UserWithProfile;
            const senderIsSupport = sender.userType === 'ADMIN';

            return (
              <div
                key={msg.id}
                className={cn('flex items-end gap-2', isOwn ? 'justify-end' : 'justify-start')}
              >
                {!isOwn &&
                  (senderIsSupport ? (
                    <div className="mb-1 shrink-0">
                      <SupportAvatar size={28} />
                    </div>
                  ) : (
                    <div className="mb-1 shrink-0">
                      <UserAvatar
                        imageUrl={sender.imageUrl}
                        alt="avatar"
                        size={28}
                        isOnline={!!onlineStatuses[sender.id]}
                        showStatus
                      />
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
                  <p className={cn('mt-1 text-right text-[10px] opacity-60')}>
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
