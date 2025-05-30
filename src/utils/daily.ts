import { addHours } from 'date-fns';
import { env } from '~/env';

// Define an interface for the expected Daily API response structure
interface DailyRoomResponse {
  name?: string;
  url?: string;
  error?: string;
  info?: string;
  // Add other potential fields if needed
}

export const createDailyCall = async (date: Date) => {
  const notBefore = date;
  const notAfter = addHours(date, 1);

  const roomProperties = {
    nbf: Math.floor(notBefore.getTime() / 1000), // Ensure integer timestamp
    exp: Math.floor(notAfter.getTime() / 1000), // Ensure integer timestamp
    eject_at_room_exp: true,
    enable_chat: true,
    enable_recording: 'cloud',
  };

  const requestBody = {
    privacy: 'public',
    properties: roomProperties,
  };

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.DAILY_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  };

  const apiUrl = `${env.DAILY_REST_DOMAIN ?? 'https://api.daily.co/v1'}/rooms`;

  try {
    const dailyRes = await fetch(apiUrl, options);

    // Type the response body when parsing JSON
    const responseBody = (await dailyRes.json()) as DailyRoomResponse;

    // Now access properties safely
    if (!dailyRes.ok || responseBody.error) {
      throw new Error(
        `Daily API error: ${responseBody.error ?? 'Unknown error'} (Status: ${dailyRes.status}) - Info: ${responseBody.info ?? 'N/A'}`
      );
    }

    // Check if name and url exist before destructuring/returning
    if (!responseBody.name || !responseBody.url) {
      throw new Error('Daily API did not return expected room name or URL.');
    }

    const { name, url } = responseBody; // Destructure safely

    return { name, url };
  } catch (error) {
    console.error('[createDailyCall] Fetch or processing error:', error);
    // Re-throw the error to be caught by the tRPC handler
    // Ensure it's an Error object for proper stack tracing
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Failed to create Daily call room');
    }
  }
};
