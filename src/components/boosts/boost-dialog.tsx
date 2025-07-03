import { type Project } from '@prisma/client';
import { Zap } from 'lucide-react';
import { useState } from 'react';
import { api } from '~/utils/api';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { toast } from 'sonner';

export const BoostDialog = ({
  project,
  availableBoosts,
}: {
  project: Project & { Entrepreneur: { user: { availableBoosts: number } } | null };
  availableBoosts: number;
}) => {
  const utils = api.useUtils();
  const [isOpen, setIsOpen] = useState(false);

  const { mutate: boostProject, isPending } = api.boost.boostProject.useMutation({
    onSuccess: () => {
      toast.success('Project boosted successfully!');
      setIsOpen(false);
      utils.project.getById.invalidate({ id: project.id });
    },
    onError: () => {
      toast.error('Failed to boost project');
    },
  });

  return (
    <>
      <Button
        size="sm"
        onClick={() => setIsOpen(true)}
        disabled={project.isBoosted === true || availableBoosts <= 0}
      >
        <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        <span className="hidden sm:inline">{project.isBoosted === true ? 'Boosted' : 'Boost'}</span>
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Boost Project</DialogTitle>
            <DialogDescription>
              Boost your project to get more visibility and attract more investors.
            </DialogDescription>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            You currently have {availableBoosts} boosts available.
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              onClick={() => boostProject({ projectId: project.id })}
              disabled={isPending || availableBoosts <= 0}
            >
              {isPending ? 'Boosting...' : 'Boost'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
