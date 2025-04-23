import { api } from '~/utils/api';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { useState } from 'react';
import { toast } from 'sonner';

export const NextStepDialog = ({ negotiationId }: { negotiationId: string }) => {
  const [open, setOpen] = useState(false);

  const { mutate: goToNextStage, isPending: isGoingToNextStage } =
    api.negotiation.goToNextStage.useMutation({
      onSuccess: () => {
        setOpen(false);
        toast.success('Negotiation stage updated');
      },
      onError: error => {
        console.error(error);
        toast.error('Failed to update negotiation stage');
      },
    });

  const { mutate: stopNegotiation, isPending: isStoppingNegotiation } =
    api.negotiation.stopNegotiation.useMutation({
      onSuccess: () => {
        setOpen(false);
        toast.success('Negotiation stopped');
      },
      onError: error => {
        console.error(error);
        toast.error('Failed to stop negotiation');
      },
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border-2 border-white/10 bg-card py-4 px-6 my-8 flex justify-between items-center">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold sm:text-xl">Want to move forward?</h2>
          <p className="text-sm text-white/80">
            If you liked the last meeting, you can show interest in moving to the next stage.
          </p>
        </div>
        <DialogTrigger asChild>
          <Button disabled={isGoingToNextStage || isStoppingNegotiation}>
            {isGoingToNextStage || isStoppingNegotiation ? 'Loading...' : 'Go to Next Stage'}
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Want to move forward?</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          If you liked the last meeting, you can show interest in moving to the next stage.
        </DialogDescription>
        <DialogFooter>
          <Button
            onClick={() => stopNegotiation({ negotiationId })}
            disabled={isStoppingNegotiation}
            variant="secondary"
          >
            {isStoppingNegotiation ? 'Stopping negotiation...' : 'Stop Negotiation'}
          </Button>
          <Button onClick={() => goToNextStage({ negotiationId })} disabled={isGoingToNextStage}>
            {isGoingToNextStage ? 'Moving to next stage...' : 'Go to Next Stage'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
