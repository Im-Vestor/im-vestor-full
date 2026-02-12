'use client';

import { UploadIcon, VideoIcon, ImageIcon, XIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { cn } from '~/lib/utils';

interface MediaUploadProps {
  onUpload: (url: string) => void;
  onRemove: () => void;
  currentMedia?: string;
  isUploading?: boolean;
  acceptedTypes?: 'image' | 'video' | 'both';
  maxSizeInMB?: number;
  disabled?: boolean;
  className?: string;
  userId?: string;
}

export function MediaUpload({
  onUpload,
  onRemove,
  currentMedia,
  isUploading = false,
  acceptedTypes = 'both',
  maxSizeInMB = 50,
  disabled = false,
  className,
  userId,
}: MediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [internalUploading, setInternalUploading] = useState(false);

  const uploading = isUploading || internalUploading;

  const getAcceptedMimeTypes = () => {
    switch (acceptedTypes) {
      case 'image':
        return 'image/*';
      case 'video':
        return 'video/*';
      case 'both':
        return 'image/*,video/*';
      default:
        return 'image/*,video/*';
    }
  };

  const isVideo = (fileName: string) => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv', '.mkv'];
    return videoExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  };

  const validateFile = useCallback(
    (file: File): string | null => {
      const fileSizeInMB = file.size / (1024 * 1024);

      if (fileSizeInMB > maxSizeInMB) {
        return `File size must be under ${maxSizeInMB}MB`;
      }

      const fileType = file.type;

      if (acceptedTypes === 'image' && !fileType.startsWith('image/')) {
        return 'Please select an image file';
      }

      if (acceptedTypes === 'video' && !fileType.startsWith('video/')) {
        return 'Please select a video file';
      }

      if (
        acceptedTypes === 'both' &&
        !fileType.startsWith('image/') &&
        !fileType.startsWith('video/')
      ) {
        return 'Please select an image or video file';
      }

      return null;
    },
    [acceptedTypes, maxSizeInMB]
  );

  const handleFileUpload = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      setInternalUploading(true);
      try {
        // Import dynamically to avoid SSR issues
        const { sendImageToBackend } = await import('~/utils/file');

        const url = await sendImageToBackend(file, userId ?? 'unknown');
        onUpload(url);
        toast.success('Media uploaded successfully!');
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Failed to upload media. Please try again.');
      } finally {
        setInternalUploading(false);
      }
    },
    [onUpload, validateFile, userId]
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const renderMediaPreview = () => {
    if (!currentMedia) return null;

    const isCurrentVideo = isVideo(currentMedia);

    return (
      <div className="relative">
        {isCurrentVideo ? (
          <video src={currentMedia} className="w-full h-48 object-cover rounded-lg" controls>
            <track kind="captions" src="" label="No captions available" />
          </video>
        ) : (
          <div className="relative w-full h-48 overflow-hidden rounded-lg">
            <Image src={currentMedia} alt="Uploaded media" fill className="object-cover" />
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/60">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}

        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8"
          onClick={onRemove}
          disabled={disabled || uploading}
        >
          <XIcon className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const renderUploadArea = () => (
    <Card
      className={cn(
        'border-2 border-dashed transition-colors cursor-pointer',
        dragActive && 'border-primary bg-primary/5',
        !dragActive && 'border-muted-foreground/25 hover:border-muted-foreground/50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={!disabled ? openFileDialog : undefined}
    >
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        {uploading ? (
          <>
            <Loader2 className="h-12 w-12 text-muted-foreground animate-spin mb-4" />
            <p className="text-muted-foreground">Uploading media...</p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <UploadIcon className="h-8 w-8 text-muted-foreground" />
              {acceptedTypes === 'image' && <ImageIcon className="h-6 w-6 text-muted-foreground" />}
              {acceptedTypes === 'video' && <VideoIcon className="h-6 w-6 text-muted-foreground" />}
              {acceptedTypes === 'both' && (
                <>
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  <VideoIcon className="h-6 w-6 text-muted-foreground" />
                </>
              )}
            </div>

            <p className="text-lg font-medium text-foreground mb-2">
              Upload {acceptedTypes === 'both' ? 'Image or Video' : acceptedTypes}
            </p>

            <p className="text-sm text-muted-foreground mb-4">Drag and drop or click to select</p>

            <p className="text-xs text-muted-foreground">
              {acceptedTypes === 'image' && 'Supported: JPG, PNG, GIF, WebP'}
              {acceptedTypes === 'video' && 'Supported: MP4, WebM, MOV'}
              {acceptedTypes === 'both' && 'Supported: JPG, PNG, GIF, WebP, MP4, WebM, MOV'}
              <br />
              Max size: {maxSizeInMB}MB
            </p>
          </>
        )}
      </CardContent>

      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptedMimeTypes()}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />
    </Card>
  );

  return (
    <div className={className}>{currentMedia ? renderMediaPreview() : renderUploadArea()}</div>
  );
}
