import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogTrigger } from './ui/dialog';
import { SupportModal } from './SupportModal';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

export function FloatingSupportButton() {
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  return (
    <Dialog open={isSupportModalOpen} onOpenChange={setIsSupportModalOpen}>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="default"
                size="icon"
                className="fixed bottom-20 right-20 rounded-full h-14 w-14 shadow-lg z-50"
              >
                <MessageSquare className="h-6 w-6" />
                <span className="sr-only">Open Support</span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Support</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {isSupportModalOpen && (
        <SupportModal onClose={() => setIsSupportModalOpen(false)} />
      )}
    </Dialog>
  );
}