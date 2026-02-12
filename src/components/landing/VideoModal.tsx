import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VideoModal({ isOpen, onClose }: VideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 backdrop-blur-sm bg-black/40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.75, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.75, y: 20 }}
            transition={{
              duration: 0.4,
              type: 'spring',
              stiffness: 300,
              damping: 25,
            }}
            className="fixed inset-4 z-50 m-auto max-h-[90vh] max-w-6xl rounded-2xl bg-background p-6 shadow-2xl"
          >
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.2 }}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              className="absolute -right-3 -top-3 rounded-full bg-background p-2 text-white shadow-xl"
            >
              <X className="h-6 w-6" />
            </motion.button>
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
