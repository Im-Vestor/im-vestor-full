import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Download, RotateCcw } from 'lucide-react';
import Image from 'next/image';
import QRCode from 'react-qr-code';
import { useState, useRef } from 'react';
import { cn } from '~/lib/utils';
import html2canvas from 'html2canvas';

export function BusinessCardDialog({
  trigger,
  userName,
  referralCode
}: {
  trigger: React.ReactNode;
  userName: string;
  referralCode: string;
}) {
  const [showFrontSide, setShowFrontSide] = useState(true);
  const referralUrl = `https://www.im-vestor.com/sign-up?referralToken=${referralCode}`;
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  const toggleCardSide = () => {
    setShowFrontSide(!showFrontSide);
  };

  const handleDownload = async () => {
    if (!frontRef.current || !backRef.current) return;

    // Force both sides to be visible for capture
    const frontSide = frontRef.current;
    const backSide = backRef.current;
    frontSide.style.opacity = '1';
    backSide.style.opacity = '1';
    backSide.style.transform = 'none';

    const [frontCanvas, backCanvas] = await Promise.all([
      html2canvas(frontSide, {
        scale: 4,
        backgroundColor: null,
        width: 1050,
        height: 600,
        allowTaint: true,
        useCORS: true,
      }),
      html2canvas(backSide, {
        scale: 4,
        backgroundColor: null,
        width: 1050,
        height: 600,
        allowTaint: true,
        useCORS: true,
      })
    ]);

    // Reset styles
    frontSide.style.opacity = '';
    backSide.style.opacity = '';
    backSide.style.transform = '';

    // Create a combined canvas
    const combinedCanvas = document.createElement('canvas');
    combinedCanvas.width = frontCanvas.width * 2; // Space for both cards side by side
    combinedCanvas.height = frontCanvas.height;
    const ctx = combinedCanvas.getContext('2d');

    if (ctx) {
      // Draw front and back side by side
      ctx.drawImage(frontCanvas, 0, 0);
      ctx.drawImage(backCanvas, frontCanvas.width, 0);

      // Download combined image
      const link = document.createElement('a');
      link.download = `${userName.replace(/\s+/g, '-')}-business-card.png`;
      link.href = combinedCanvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-background space-y-6">
        <DialogHeader>
          <DialogTitle>Business Card</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="relative h-56 w-full max-w-sm mx-auto border border-white/10 rounded-xl overflow-hidden">
            {/* Front Side */}
            <div
              ref={frontRef}
              className={cn(
                'absolute w-full h-full backface-hidden transition-all duration-700',
                showFrontSide ? 'opacity-100' : 'opacity-0'
              )}
            >
              <div className="flex flex-col items-center justify-center w-full h-full p-6 bg-background">
                <Image
                  src="/logo/imvestor.png"
                  alt="Im-Vestor Logo"
                  width={100}
                  height={100}
                  className="mb-4"
                  priority
                  unoptimized
                />
                <h3 className="text-2xl font-bold tracking-wider text-center text-white">
                  Im-Vestor
                </h3>
              </div>
            </div>

            {/* Back Side */}
            <div
              ref={backRef}
              className={cn(
                'absolute w-full h-full backface-hidden rotate-y-180 transition-all duration-700',
                showFrontSide ? 'opacity-0' : 'opacity-100'
              )}
            >
              <div className="flex flex-col items-center justify-between w-full h-full p-6 bg-background">
                <div className="text-center mb-2">
                  <h3 className="text-xl font-bold text-white">{userName}</h3>
                </div>

                <div className="bg-white p-2 rounded-md">
                  <QRCode value={referralUrl} size={100} className="w-auto h-auto" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" onClick={toggleCardSide}>
              <RotateCcw size={16} className="mr-2" />
              Flip Card
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download size={16} className="mr-2" />
              Download Cards
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
