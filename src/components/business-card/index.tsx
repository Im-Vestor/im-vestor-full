import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Download, RotateCcw, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import QRCode from 'react-qr-code';
import { useState, useRef } from 'react';
import { cn } from '~/lib/utils';
import html2canvas from 'html2canvas';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

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

  // Function to crop empty space from canvas edges
  // Since background is black, we look for content that's not pure black
  const cropCanvas = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = 0;
    let maxY = 0;

    // Find the bounding box of non-black pixels (content)
    // We consider a pixel as content if it's not pure black (all RGB < 10)
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const idx = (y * canvas.width + x) * 4;
        const r = data[idx] ?? 0;
        const g = data[idx + 1] ?? 0;
        const b = data[idx + 2] ?? 0;
        const alpha = data[idx + 3] ?? 0;

        // Consider pixel as content if it has alpha and is not pure black
        if (alpha > 0 && (r > 10 || g > 10 || b > 10)) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    // If no content found, return original
    if (minX >= maxX || minY >= maxY) return canvas;

    // Add small padding to ensure we don't cut off edges
    const padding = 4;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(canvas.width, maxX + padding);
    maxY = Math.min(canvas.height, maxY + padding);

    // Create cropped canvas
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = maxX - minX;
    croppedCanvas.height = maxY - minY;
    const croppedCtx = croppedCanvas.getContext('2d');

    if (croppedCtx) {
      croppedCtx.fillStyle = '#000000';
      croppedCtx.fillRect(0, 0, croppedCanvas.width, croppedCanvas.height);
      croppedCtx.drawImage(
        canvas,
        minX, minY, croppedCanvas.width, croppedCanvas.height,
        0, 0, croppedCanvas.width, croppedCanvas.height
      );
    }

    return croppedCanvas;
  };

  const captureCanvases = async () => {
    if (!frontRef.current || !backRef.current) return null;

    // Force both sides to be visible for capture
    const frontSide = frontRef.current;
    const backSide = backRef.current;

    // Temporarily make both visible
    frontSide.style.opacity = '1';
    backSide.style.opacity = '1';
    backSide.style.transform = 'none';

    const [frontCanvas, backCanvas] = await Promise.all([
      html2canvas(frontSide, {
        scale: 4,
        backgroundColor: '#000000',
        allowTaint: true,
        useCORS: true,
        logging: false,
      }),
      html2canvas(backSide, {
        scale: 4,
        backgroundColor: '#000000',
        allowTaint: true,
        useCORS: true,
        logging: false,
      })
    ]);

    // Reset styles
    frontSide.style.opacity = '';
    backSide.style.opacity = '';
    backSide.style.transform = '';

    // Crop whitespace from both canvases
    const croppedFront = cropCanvas(frontCanvas);
    const croppedBack = cropCanvas(backCanvas);

    return { frontCanvas: croppedFront, backCanvas: croppedBack };
  };

  const handleDownloadCombined = async () => {
    const canvases = await captureCanvases();
    if (!canvases) return;

    const { frontCanvas, backCanvas } = canvases;

    // Use the maximum height to ensure both cards fit
    const maxHeight = Math.max(frontCanvas.height, backCanvas.height);

    // Create a combined canvas with images side by side (no gap)
    const combinedCanvas = document.createElement('canvas');
    combinedCanvas.width = frontCanvas.width + backCanvas.width; // Total width without gap
    combinedCanvas.height = maxHeight;
    const ctx = combinedCanvas.getContext('2d');

    if (ctx) {
      // Fill with black background to match card background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);

      // Draw front and back side by side with no gap - positioned exactly next to each other
      ctx.drawImage(frontCanvas, 0, 0, frontCanvas.width, frontCanvas.height);
      ctx.drawImage(backCanvas, frontCanvas.width, 0, backCanvas.width, backCanvas.height);

      // Download combined image
      const link = document.createElement('a');
      link.download = `${userName.replace(/\s+/g, '-')}-business-card.png`;
      link.href = combinedCanvas.toDataURL('image/png');
      link.click();
    }
  };

  const handleDownloadSeparate = async () => {
    const canvases = await captureCanvases();
    if (!canvases) return;

    const { frontCanvas, backCanvas } = canvases;
    const sanitizedName = userName.replace(/\s+/g, '-');

    // Download front card
    const frontLink = document.createElement('a');
    frontLink.download = `${sanitizedName}-business-card-front.png`;
    frontLink.href = frontCanvas.toDataURL('image/png');
    frontLink.click();

    // Small delay to ensure first download starts
    setTimeout(() => {
      // Download back card
      const backLink = document.createElement('a');
      backLink.download = `${sanitizedName}-business-card-back.png`;
      backLink.href = backCanvas.toDataURL('image/png');
      backLink.click();
    }, 100);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-background space-y-6">
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
                  Im-Vestor.com
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download size={16} className="mr-2" />
                  Download
                  <ChevronDown size={16} className="ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDownloadCombined}>
                  <Download size={16} className="mr-2" />
                  Download Combined (Coladas)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadSeparate}>
                  <Download size={16} className="mr-2" />
                  Download Separate Files
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
