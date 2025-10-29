import { type HyperTrainItem, type Project } from '@prisma/client';
import Link from 'next/link';
import { Train } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
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

export const ProjectDialog = ({
  project,
  hypertrainItem,
}: {
  project: Project & { Entrepreneur: { user: { availableBoosts: number } } | null };
  hypertrainItem: HyperTrainItem | undefined | null;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    if (hypertrainItem) {
      toast.error("You're currnetly in the hypertrain");
      return;
    }

    try {
      const response = await fetch(`/api/stripe/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: 'hyper-train-ticket',
          projectId: project.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = (await response.json()) as {
        sessionId: string;
        url: string;
      };

      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to start checkout process');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {hypertrainItem ? (
        <Link href={`/projects/${project.id}/hypertrain`}>
          <Button size="sm">
            <Train className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Hypertrain
          </Button>
        </Link>
      ) : (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Train className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">
                {hypertrainItem ? 'In Hypertrain' : 'Add to Hypertrain'}
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Hypertrain</DialogTitle>
              <DialogDescription>
                Add your project to the hypertrain to get more visibility and attract more
                investors.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={handlePurchase} disabled={isProcessing}>
                {isProcessing ? 'Processing...' : 'Add to Hypertrain'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
