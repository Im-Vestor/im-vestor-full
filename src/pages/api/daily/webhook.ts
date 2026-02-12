import { env } from '~/env.js';
import type { NextApiRequest, NextApiResponse } from 'next';
import { startDailyRecording } from '~/utils/daily';

// Daily.co webhook event types
interface DailyWebhookEvent {
  type: string;
  timestamp: number;
  room_name?: string;
  participant?: {
    id: string;
    user_name?: string;
    user_id?: string;
  };
  room?: {
    name: string;
    participants?: Array<{ id: string }>;
  };
}

/**
 * Webhook handler for Daily.co events
 * This is a fallback mechanism to start recording if the room property
 * start_recording_on_participant_joined doesn't work
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Verify webhook signature if Daily.co provides one
  // For now, we'll process the event (you may want to add signature verification)
  const body = req.body as DailyWebhookEvent;

  try {
    // Process event asynchronously to respond quickly
    void processDailyEvent(body);

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[DAILY WEBHOOK] Error processing event', error);
    return res.status(400).json({ message: 'Webhook error' });
  }
}

async function processDailyEvent(event: DailyWebhookEvent) {
  // Only process participant-joined events
  if (event.type !== 'participant-joined') {
    return;
  }

  const roomName = event.room_name ?? event.room?.name;

  if (!roomName) {
    console.error('[DAILY WEBHOOK] No room name in event', event);
    return;
  }

  // Check if this is the first participant (room has only 1 participant)
  // If the room property start_recording_on_participant_joined works,
  // this webhook will be a no-op (recording already started)
  const participantCount = event.room?.participants?.length ?? 1;

  // Only start recording if this appears to be the first participant
  // Note: This is a best-effort check. The room property should handle this,
  // but this serves as a fallback
  if (participantCount === 1) {
    try {
      await startDailyRecording(roomName);
      console.log(`[DAILY WEBHOOK] Started recording for room: ${roomName}`);
    } catch (error) {
      // If recording is already started (via room property), this will fail
      // which is expected behavior
      console.log(
        `[DAILY WEBHOOK] Recording may already be started for room: ${roomName}`,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
}
