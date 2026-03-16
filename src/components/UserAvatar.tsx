import { UserRound } from 'lucide-react';
import Image from 'next/image';
import { cn } from '~/lib/utils';

interface UserAvatarProps {
  imageUrl: string | null | undefined;
  alt?: string;
  /** Avatar size in pixels (default: 40) */
  size?: number;
  /** Whether this user is currently online */
  isOnline?: boolean;
  /** Show the online indicator dot (default: true when isOnline is provided) */
  showStatus?: boolean;
  className?: string;
}

/**
 * Reusable user avatar with an optional green online-indicator dot.
 * Renders the user's profile image or a fallback icon.
 */
export function UserAvatar({
  imageUrl,
  alt = 'User',
  size = 40,
  isOnline,
  showStatus = isOnline !== undefined,
  className,
}: UserAvatarProps) {
  // Scale the dot and border based on avatar size
  const dotSize = Math.max(8, Math.round(size * 0.25));
  const borderWidth = Math.max(2, Math.round(size * 0.05));
  const iconSize = Math.round(size * 0.5);

  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }}>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={alt}
          width={size}
          height={size}
          className="rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-full bg-white/10"
          style={{ width: size, height: size }}
        >
          <UserRound style={{ width: iconSize, height: iconSize }} className="text-neutral-400" />
        </div>
      )}

      {showStatus && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full',
            isOnline ? 'bg-emerald-500' : 'bg-neutral-500',
          )}
          style={{
            width: dotSize,
            height: dotSize,
            border: `${borderWidth}px solid var(--color-card)`,
          }}
        />
      )}
    </div>
  );
}
