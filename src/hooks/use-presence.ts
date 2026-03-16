import { useUser } from '@clerk/nextjs';
import { useEffect, useRef } from 'react';
import { api } from '~/utils/api';

/** How often to send a heartbeat (ms) */
const HEARTBEAT_INTERVAL = 60_000;

/**
 * Sends periodic heartbeat to mark the current user as online.
 * Pauses when the tab is hidden and resumes when visible.
 * Call this once at the app level (e.g. in _app.tsx).
 */
export function usePresenceHeartbeat() {
  const { isSignedIn, isLoaded } = useUser();
  const { mutate: heartbeat } = api.presence.heartbeat.useMutation();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const sendHeartbeat = () => heartbeat();

    // Send immediately on mount / sign-in
    sendHeartbeat();

    const startInterval = () => {
      if (!intervalRef.current) {
        intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
      }
    };

    const stopInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
        startInterval();
      } else {
        stopInterval();
      }
    };

    startInterval();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopInterval();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isLoaded, isSignedIn, heartbeat]);
}

/**
 * Query the online status for a list of user IDs.
 * Returns a Record<userId, boolean>.
 */
export function useOnlineStatuses(userIds: string[]) {
  const { data } = api.presence.getStatuses.useQuery(
    { userIds },
    {
      enabled: userIds.length > 0,
      refetchInterval: 2 * 60 * 1000,
      staleTime: 60_000,
      refetchOnWindowFocus: true,
    },
  );

  return data ?? {};
}
