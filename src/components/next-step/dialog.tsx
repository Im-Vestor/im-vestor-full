import { Clock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '~/utils/api';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

interface NextStepDialogProps {
  negotiationId: string;
  hasCurrentUserAgreed: boolean;
  hasOtherPartyAgreed: boolean;
  onSuccess?: () => void;
}

export const NextStepDialog = ({
  negotiationId,
  hasCurrentUserAgreed,
  hasOtherPartyAgreed,
  onSuccess,
}: NextStepDialogProps) => {
  const [nextStageOpen, setNextStageOpen] = useState(false);
  const [stopNegotiationOpen, setStopNegotiationOpen] = useState(false);
  const utils = api.useUtils();

  const { mutate: goToNextStage, isPending: isGoingToNextStage } =
    api.negotiation.goToNextStage.useMutation({
      onSuccess: () => {
        setNextStageOpen(false);
        toast.success('Negotiation stage updated');
        void utils.negotiation.getNegotiationByProjectIdAndInvestorIdOrVcGroupId.invalidate();
        onSuccess?.();
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
        void utils.negotiation.getNegotiationByProjectIdAndInvestorIdOrVcGroupId.invalidate();
        onSuccess?.();
      },
      onError: error => {
        console.error(error);
        toast.error('Failed to stop negotiation');
      },
    });

  if (hasCurrentUserAgreed && !hasOtherPartyAgreed) {
    return (
      <div className="rounded-xl border-2 border-white/10 bg-card py-4 px-6 my-8 flex justify-between items-center">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold sm:text-xl flex items-center gap-2">
            <Clock className="size-5 text-yellow-400" />
            Waiting for confirmation
          </h2>
          <p className="text-sm text-white/80">
            You&apos;ve confirmed moving to the next stage. Waiting for the other party to confirm.
          </p>
        </div>
      </div>
    );
  }

  const isOtherPartyReady = hasOtherPartyAgreed && !hasCurrentUserAgreed;

  return (
    <div className="rounded-xl border-2 border-white/10 bg-card py-4 px-6 my-8 flex justify-between items-center">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold sm:text-xl">
          {isOtherPartyReady ? 'The other party wants to move forward!' : 'Want to move forward?'}
        </h2>
        <p className="text-sm text-white/80">
          {isOtherPartyReady
            ? "They've confirmed moving to the next stage. Do you want to proceed?"
            : 'If you liked the last meeting, you can show interest in moving to the next stage.'}
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
              {isGoingToNextStage || isStoppingNegotiation
                ? 'Loading...'
                : isOtherPartyReady
                  ? 'Confirm & Move Forward'
                  : 'Go to Next Stage'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isOtherPartyReady ? 'Confirm stage transition' : 'Want to move forward?'}
              </DialogTitle>
            </DialogHeader>
            <DialogDescription>
              {isOtherPartyReady
                ? 'The other party has already confirmed. By confirming, both parties will advance to the next stage.'
                : 'If you liked the last meeting, you can show interest in moving to the next stage. The other party will also need to confirm before the stage advances.'}
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
                {isGoingToNextStage
                  ? 'Moving to next stage...'
                  : isOtherPartyReady
                    ? 'Confirm & Move Forward'
                    : 'Go to Next Stage'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
