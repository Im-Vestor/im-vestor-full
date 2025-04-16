import { GoogleAnalytics as GA } from '@next/third-parties/google';

export function GoogleAnalytics({ gaId }: { gaId: string }) {
  return <GA gaId={gaId} />;
}
