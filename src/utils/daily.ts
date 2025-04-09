import { addHours } from 'date-fns';
import { env } from '~/env';

export const createDailyCall = async (date: Date) => {
  const notBefore = date;
  const notAfter = addHours(date, 1);

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      privacy: 'private',
      properties: {
        nbf: notBefore.getTime() / 1000, // unix timestamp
        exp: notAfter.getTime() / 1000, // unix timestamp
        eject_at_room_exp: true,
        enable_chat: true,
        enable_recording: 'cloud',
      },
    }),
  };

  const dailyRes = await fetch(
    `${env.DAILY_REST_DOMAIN ?? 'https://api.daily.co/v1'}/rooms`,
    options
  );

  const { name, url, error } = (await dailyRes.json()) as {
    name: string;
    url: string;
    error: string;
  };

  if (error) {
    throw new Error(error);
  }

  return { name, url };
};
