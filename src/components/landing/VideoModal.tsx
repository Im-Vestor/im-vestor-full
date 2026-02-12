import { useRef, useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VideoModal({ isOpen, onClose }: VideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay to trigger CSS transition after mount
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setVisible(false);
    setTimeout(onClose, 300);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={handleClose}
        className={`fixed inset-0 z-50 backdrop-blur-sm bg-black/40 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        className={`fixed inset-4 z-50 m-auto max-h-[90vh] max-w-6xl rounded-2xl bg-background p-6 shadow-2xl transition-all duration-300 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
      >
        <button
          onClick={handleClose}
          className="absolute -right-3 -top-3 rounded-full bg-background p-2 text-white shadow-xl hover:scale-110 hover:rotate-90 transition-all duration-200"
        >
          <X className="h-6 w-6" />
        </button>
        <video
          ref={videoRef}
          className="h-full w-full rounded-lg"
          autoPlay
          controls
          onClick={e => e.stopPropagation()}
        >
          <source
            src="https://r1pf0du9n17u37qf.public.blob.vercel-storage.com/Investor-LfT3nXCTFM9WBb33OA3Oyq4qfGQlto.mp4"
            type="video/mp4"
          />
        </video>
      </div>
    </>
  );
}
