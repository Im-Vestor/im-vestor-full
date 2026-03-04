import DailyIframe from '@daily-co/daily-js';
import { useEffect, useRef } from 'react';

interface DailyCallProps {
  url: string;
  onLeave: () => void;
}

export function DailyCall({ url, onLeave }: DailyCallProps) {
  const callRef = useRef<HTMLDivElement>(null);
  const callFrameRef = useRef<DailyIframe.DailyCall | null>(null);

  useEffect(() => {
    if (!callRef.current || callFrameRef.current) return;

    const callFrame = DailyIframe.createFrame(callRef.current, {
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: '0',
        borderRadius: '12px',
      },
      showLeaveButton: true,
    });

    callFrame.on('left-meeting', () => {
      callFrame.destroy();
      onLeave();
    });

    callFrame.join({ url });
    callFrameRef.current = callFrame;

    return () => {
      // Cleanup on unmount
      if (callFrameRef.current) {
        callFrameRef.current.destroy();
        callFrameRef.current = null;
      }
    };
  }, [url, onLeave]);

  return <div ref={callRef} className="w-full h-[600px] bg-black rounded-xl overflow-hidden" />;
}
