import { useRouter } from 'next/router';
import { useEffect } from 'react';

// Redirect to the unified messages layout with the conversation pre-selected
export default function ConversationRedirect() {
  const router = useRouter();
  const { conversationId } = router.query as { conversationId: string };

  useEffect(() => {
    if (conversationId) {
      void router.replace(`/messages?c=${conversationId}`);
    }
  }, [conversationId, router]);

  return null;
}
