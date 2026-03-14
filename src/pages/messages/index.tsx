import { useUser } from '@clerk/nextjs';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, UserRound } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Header } from '~/components/header';
import { Skeleton } from '~/components/ui/skeleton';
import { api } from '~/utils/api';
import { getDisplayName, type UserWithProfile } from '~/utils/user-display';

export default function MessagesPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (isLoaded && !isSignedIn) void router.push('/login');
  }, [isLoaded, isSignedIn, router]);

  const { data: conversations, isLoading } = api.messages.getConversations.useQuery(undefined, {
    enabled: isLoaded && !!isSignedIn,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });

  if (!isLoaded || !isSignedIn) return null;

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-4 md:p-8">
      <Header />
      <div className="mt-12">
        <div className="overflow-hidden rounded-lg border border-white/10 bg-card p-6 md:p-12">
          <h1 className="mb-8 text-3xl font-semibold">Messages</h1>

          {isLoading ? (
            <div className="divide-y divide-white/10">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-4">
                  <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-3 w-16 shrink-0" />
                </div>
              ))}
            </div>
          ) : !conversations || conversations.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <MessageSquare className="size-10 opacity-40" />
              <p className="text-sm">No messages yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {conversations.map(conv => {
                const other = conv.participants[0] as UserWithProfile | undefined;
                if (!other) return null;
                const displayName = getDisplayName(other);
                const lastMsg = conv.messages[0];
                const hasUnread = conv.unreadCount > 0;

                return (
                  <button
                    key={conv.id}
                    className="flex w-full items-center gap-4 py-4 text-left transition-colors hover:bg-white/5"
                    onClick={() => void router.push(`/messages/${conv.id}`)}
                  >
                    <div className="relative shrink-0">
                      {other.imageUrl ? (
                        <Image
                          src={other.imageUrl}
                          alt={displayName}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                          <UserRound className="size-6 text-neutral-400" />
                        </div>
                      )}
                      {hasUnread && (
                        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-card bg-primary" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`truncate text-sm ${hasUnread ? 'font-semibold text-white' : 'text-white/80'}`}
                        >
                          {displayName}
                        </span>
                        {lastMsg && (
                          <span className="shrink-0 text-xs text-white/40">
                            {formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      {lastMsg && (
                        <p
                          className={`truncate text-xs ${hasUnread ? 'text-white/70' : 'text-white/40'}`}
                        >
                          {lastMsg.senderId !== other.id ? 'You: ' : ''}
                          {lastMsg.content}
                        </p>
                      )}
                    </div>

                    {hasUnread && (
                      <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-black">
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
    </main>
  );
}
