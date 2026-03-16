import { MessageSquare } from 'lucide-react';
import { useRouter } from 'next/router';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

export function FloatingSupportButton() {
  const router = useRouter();

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-20 right-20 rounded-full h-14 w-14 shadow-lg z-50 bg-card border-white/10 hover:bg-primary hover:scale-[1.05] transition-all duration-500"
            onClick={() => void router.push('/messages?support=1')}
          >
            <MessageSquare className="h-6 w-6" />
            <span className="sr-only">Open Support</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Support</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
