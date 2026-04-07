import { useState } from 'react';
import { Shield, Trash2, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '~/utils/api';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Badge } from '~/components/ui/badge';
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

function ModerationContent() {
  const utils = api.useUtils();
  const [newWord, setNewWord] = useState('');

  const { data: bannedWords, isLoading } = api.moderation.getBannedWords.useQuery();

  const { mutate: addWord, isPending: adding } = api.moderation.addBannedWord.useMutation({
    onSuccess: () => {
      toast.success('Word banned successfully');
      setNewWord('');
      void utils.moderation.getBannedWords.invalidate();
    },
    onError: (err) => {
      toast.error(err.message ?? 'Failed to ban word');
    },
  });

  const { mutate: removeWord } = api.moderation.removeBannedWord.useMutation({
    onSuccess: () => {
      toast.success('Word removed');
      void utils.moderation.getBannedWords.invalidate();
    },
    onError: () => toast.error('Failed to remove word'),
  });

  const handleAdd = () => {
    const trimmed = newWord.trim().toLowerCase();
    if (!trimmed) return;
    addWord({ word: trimmed });
  };

  return (
    <AdminSection>
      <AdminPageHeader
        title="Chat Moderation"
        description="Manage banned words — messages containing these words will be blocked automatically."
        icon={Shield}
        iconLabel="Content Moderation"
      />

      <AdminStatsGrid columns={2}>
        <AdminStatsCard
          title="Banned Words"
          value={bannedWords?.length ?? 0}
          subtitle="Active filters"
          icon={Shield}
          gradient={adminGradients.orange}
          iconColor={adminIconColors.orange}
        />
        <AdminStatsCard
          title="Status"
          value={bannedWords && bannedWords.length > 0 ? 'Active' : 'No filters'}
          subtitle="Moderation state"
          icon={Shield}
          gradient={adminGradients.green}
          iconColor={adminIconColors.green}
        />
      </AdminStatsGrid>

      {/* Add word */}
      <AdminContentCard
        title="Add Banned Word"
        description="Messages containing this word (whole word match) will be blocked."
        icon={Plus}
      >
        <div className="flex gap-2">
          <Input
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="Type a word..."
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1 bg-background border-border focus:border-primary/50"
          />
          <Button onClick={handleAdd} disabled={adding || !newWord.trim()} className="bg-primary hover:bg-primary/90">
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span className="ml-2">Add</span>
          </Button>
        </div>
      </AdminContentCard>

      {/* Word list */}
      <AdminContentCard
        title="Banned Words List"
        description="Click the trash icon to remove a word from the list."
        icon={Shield}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !bannedWords || bannedWords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground">No banned words yet. Add one above.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(bannedWords as { id: string; word: string }[]).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-sm hover:border-border/80 transition-all"
              >
                <span className="font-mono text-foreground">{entry.word}</span>
                <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">
                  word
                </Badge>
                <button
                  onClick={() => removeWord({ id: entry.id })}
                  className="ml-1 text-destructive hover:text-destructive/80 transition-colors"
                  aria-label="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </AdminContentCard>
    </AdminSection>
  );
}

export default function ModerationPage() {
  return (
    <AdminLayout>
      <ModerationContent />
    </AdminLayout>
  );
}
