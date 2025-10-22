import { useUser } from '@clerk/nextjs';
import { useEffect, useRef } from 'react';

/**
 * Custom hook to handle authenticated queries with retry logic
 * This helps prevent 401 errors during Clerk authentication timing issues
 */
export function useAuthenticatedQuery<T>(
  queryFn: () => T,
  options: {
    enabled?: boolean;
    retryCount?: number;
    retryDelay?: number;
  } = {}
) {
  const { isSignedIn, isLoaded } = useUser();
  const { enabled = true, retryCount = 3, retryDelay = 1000 } = options;
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Enhanced enabled condition that waits for Clerk to be fully loaded
  const shouldEnable = enabled && isLoaded && isSignedIn;

  return {
    enabled: shouldEnable,
    retry: (failureCount: number, error: any) => {
      // Retry for auth errors up to the specified count
      if (error?.data?.code === 'UNAUTHORIZED' && failureCount < retryCount) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex: number) => {
      // Exponential backoff with jitter
      const baseDelay = retryDelay * Math.pow(2, attemptIndex);
      const jitter = Math.random() * 1000; // Add up to 1 second of jitter
      return Math.min(baseDelay + jitter, 30000); // Cap at 30 seconds
    },
  };
}




