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
  const [nextStageOpen, setNextStageOpen] = useState(false);
  const [stopNegotiationOpen, setStopNegotiationOpen] = useState(false);

  const { mutate: goToNextStage, isPending: isGoingToNextStage } =
    api.negotiation.goToNextStage.useMutation({
      onSuccess: () => {
        setNextStageOpen(false);
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
        setStopNegotiationOpen(false);
        toast.success('Negotiation stopped');
      },
      onError: error => {
        console.error(error);
        toast.error('Failed to stop negotiation');
      },
    });

  return (
    <div className="rounded-xl border-2 border-white/10 bg-card py-4 px-6 my-8 flex justify-between items-center">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold sm:text-xl">Want to move forward?</h2>
        <p className="text-sm text-white/80">
          If you liked the last meeting, you can show interest in moving to the next stage.
        </p>
      </div>

      <div className="flex gap-2">
        <Dialog open={stopNegotiationOpen} onOpenChange={setStopNegotiationOpen}>
          <DialogTrigger asChild>
            <Button
              disabled={isGoingToNextStage || isStoppingNegotiation}
              size="sm"
              variant="outline"
            >
              {isStoppingNegotiation ? 'Stopping negotiation...' : 'Stop Negotiation'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Want to stop this negotiation?</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              If you don&apos;t want to continue with this negotiation, you can stop it.
            </DialogDescription>
            <DialogFooter>
              <Button
                onClick={() => setStopNegotiationOpen(false)}
                disabled={isStoppingNegotiation}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={() => stopNegotiation({ negotiationId })}
                disabled={isStoppingNegotiation}
                variant="destructive"
              >
                {isStoppingNegotiation ? 'Stopping negotiation...' : 'Stop Negotiation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={nextStageOpen} onOpenChange={setNextStageOpen}>
          <DialogTrigger asChild>
            <Button disabled={isGoingToNextStage || isStoppingNegotiation} size="sm">
              {isGoingToNextStage || isStoppingNegotiation ? 'Loading...' : 'Go to Next Stage'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Want to move forward?</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              If you liked the last meeting, you can show interest in moving to the next stage.
            </DialogDescription>
            <DialogFooter>
              <Button
                onClick={() => setNextStageOpen(false)}
                disabled={isGoingToNextStage}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={() => goToNextStage({ negotiationId })}
                disabled={isGoingToNextStage}
              >
                {isGoingToNextStage ? 'Moving to next stage...' : 'Go to Next Stage'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
