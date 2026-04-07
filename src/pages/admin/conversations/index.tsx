import { useState } from 'react';
import {
  MessageSquare,
  Loader2,
  ChevronLeft,
  Trash2,
  Search,
  Users,
  MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { api } from '~/utils/api';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Badge } from '~/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import AdminLayout from '../index';
import {
  AdminPageHeader,
  AdminStatsCard,
  AdminContentCard,
  AdminSection,
  AdminStatsGrid,
  adminGradients,
  adminIconColors,
} from '~/components/admin/shared';

// ─── Helpers ─────────────────────────────────────────────────────────────────

type ParticipantInfo = {
  id: string;
  imageUrl: string | null;
  userType: string;
  entrepreneur?: { firstName: string; lastName: string } | null;
  investor?: { firstName: string; lastName: string } | null;
  incubator?: { name: string } | null;
  partner?: { firstName: string; lastName: string } | null;
  vcGroup?: { name: string } | null;
};

function getDisplayName(p: ParticipantInfo): string {
  if (p.entrepreneur) return `${p.entrepreneur.firstName} ${p.entrepreneur.lastName}`;
  if (p.investor) return `${p.investor.firstName} ${p.investor.lastName}`;
  if (p.incubator) return p.incubator.name;
  if (p.partner) return `${p.partner.firstName} ${p.partner.lastName}`;
  if (p.vcGroup) return p.vcGroup.name;
  return p.userType;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function ConversationsContent() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  if (selectedId) {
    return (
      <ConversationDetail
        conversationId={selectedId}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  return (
    <AdminSection>
      <AdminPageHeader
        title="All Conversations"
        description="View and moderate all user conversations on the platform."
        icon={MessageSquare}
        iconLabel="Conversation Monitor"
      />

      {/* Search */}
      <AdminContentCard>
        <div className="flex gap-2">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by participant name..."
            onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput)}
            className="flex-1 bg-background border-border focus:border-primary/50"
          />
          <Button variant="outline" onClick={() => setSearch(searchInput)} className="border-border hover:border-primary/50">
            <Search className="h-4 w-4" />
          </Button>
          {search && (
            <Button
              variant="ghost"
              onClick={() => { setSearch(''); setSearchInput(''); }}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          )}
        </div>
      </AdminContentCard>

      <ConversationList search={search} onSelect={setSelectedId} />
    </AdminSection>
  );
}

// ─── Conversation List ────────────────────────────────────────────────────────

function ConversationList({
  search,
  onSelect,
}: {
  search: string;
  onSelect: (id: string) => void;
}) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    api.moderation.getAllConversations.useInfiniteQuery(
      { limit: 20, search: search || undefined },
      { getNextPageParam: (last) => last.nextCursor }
    );

  const conversations = data?.pages.flatMap((p) => p.conversations) ?? [];
  const totalConversations = conversations.length;

  if (isLoading) {
    return (
      <AdminContentCard>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AdminContentCard>
    );
  }

  return (
    <>
      <AdminStatsGrid columns={2}>
        <AdminStatsCard
          title="Conversations"
          value={totalConversations}
          subtitle={search ? 'Matching search' : 'Loaded'}
          icon={MessageSquare}
          gradient={adminGradients.cyan}
          iconColor={adminIconColors.cyan}
        />
        <AdminStatsCard
          title="Total Messages"
          value={conversations.reduce((sum, c) => sum + c._count.messages, 0)}
          subtitle="Across loaded conversations"
          icon={MessageCircle}
          gradient={adminGradients.blue}
          iconColor={adminIconColors.blue}
        />
      </AdminStatsGrid>

      <AdminContentCard>
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground">No conversations found.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map((conv) => {
              const names = conv.participants.map(getDisplayName);
              const lastMsg = conv.messages[0];

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  className="w-full px-6 py-4 text-left transition-all hover:bg-muted/40 flex items-start gap-4"
                >
                  {/* Stacked avatars */}
                  <div className="relative flex-shrink-0 h-10 w-10">
                    {conv.participants.slice(0, 2).map((p, i) => (
                      <Avatar
                        key={p.id}
                        className={`h-8 w-8 border-2 border-background absolute ${i === 0 ? 'top-0 left-0' : 'bottom-0 right-0'}`}
                      >
                        <AvatarImage src={p.imageUrl ?? undefined} />
                        <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                          {getInitials(getDisplayName(p))}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="truncate font-medium text-sm text-foreground">
                        {names.join(' & ')}
                      </span>
                      <Badge variant="secondary" className="ml-auto flex-shrink-0 text-xs gap-1">
                        <Users className="h-3 w-3" />
                        {conv._count.messages}
                      </Badge>
                    </div>
                    {lastMsg && (
                      <p className="truncate text-xs text-muted-foreground">{lastMsg.content}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      {format(new Date(conv.updatedAt), 'dd MMM yyyy, HH:mm')}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {hasNextPage && (
          <div className="flex justify-center p-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
              className="border-border hover:border-primary/50"
            >
              {isFetchingNextPage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Load more
            </Button>
          </div>
        )}
      </AdminContentCard>
    </>
  );
}

// ─── Conversation Detail ──────────────────────────────────────────────────────

function ConversationDetail({
  conversationId,
  onBack,
}: {
  conversationId: string;
  onBack: () => void;
}) {
  const utils = api.useUtils();

  const { data, isLoading } = api.moderation.getConversationMessages.useQuery({
    conversationId,
    limit: 100,
  });

  const { mutate: deleteMessage } = api.moderation.deleteMessage.useMutation({
    onSuccess: () => {
      toast.success('Message deleted');
      void utils.moderation.getConversationMessages.invalidate({ conversationId });
    },
    onError: () => toast.error('Failed to delete message'),
  });

  return (
    <AdminSection>
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to conversations
        </button>
      </div>

      {isLoading ? (
        <AdminContentCard>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </AdminContentCard>
      ) : !data ? null : (
        <>
          {/* Participants header */}
          <AdminContentCard title="Participants" icon={Users}>
            <div className="flex flex-wrap gap-4">
              {data.conversation.participants.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={p.imageUrl ?? undefined} />
                    <AvatarFallback className="text-xs bg-primary/20 text-primary">
                      {getInitials(getDisplayName(p))}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">{getDisplayName(p)}</span>
                  <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                    {p.userType}
                  </Badge>
                </div>
              ))}
            </div>
          </AdminContentCard>

          {/* Stats */}
          <AdminStatsGrid columns={2}>
            <AdminStatsCard
              title="Total Messages"
              value={data.messages.length}
              subtitle="In this conversation"
              icon={MessageCircle}
              gradient={adminGradients.blue}
              iconColor={adminIconColors.blue}
            />
            <AdminStatsCard
              title="Participants"
              value={data.conversation.participants.length}
              subtitle="Users in conversation"
              icon={Users}
              gradient={adminGradients.purple}
              iconColor={adminIconColors.purple}
            />
          </AdminStatsGrid>

          {/* Messages */}
          <AdminContentCard title="Messages" description="Hover over a message to reveal the delete button." icon={MessageSquare}>
            {data.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-center text-muted-foreground">No messages in this conversation.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.messages.map((msg) => {
                  const senderName = getDisplayName(msg.sender);
                  return (
                    <div
                      key={msg.id}
                      className="group flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4 hover:border-border/80 hover:bg-muted/50 transition-all"
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={msg.sender.imageUrl ?? undefined} />
                        <AvatarFallback className="text-xs bg-primary/20 text-primary">
                          {getInitials(senderName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-baseline gap-2">
                          <span className="text-sm font-medium text-foreground">{senderName}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(msg.createdAt), 'dd MMM yyyy, HH:mm')}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap break-words text-sm text-foreground/90">
                          {msg.content}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteMessage({ messageId: msg.id })}
                        className="flex-shrink-0 text-destructive opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive/70"
                        aria-label="Delete message"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </AdminContentCard>
        </>
      )}
    </AdminSection>
  );
}

export default function AdminConversationsPage() {
  return (
    <AdminLayout>
      <ConversationsContent />
    </AdminLayout>
  );
}
