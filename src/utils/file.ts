import { createClient, FunctionsHttpError } from '@supabase/supabase-js';
import { env } from '~/env';

export async function sendImageToBackend(file: File, userId: string) {
  console.log(file, userId);

  // log env
  console.log(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);

  const response = await supabase.functions.invoke('upload-file', {
    body: formData,
  });

  console.log(response);

  const { data, error } = response as unknown as {
    data: { imageUrl: string };
    error: Error;
  };

  console.log(data, error);

  if (error && error instanceof FunctionsHttpError) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const errorMessage = await error.context.json();
    console.log('Function returned an error', errorMessage);
  }

  if (error) {
    throw new Error(error.message || 'Failed to upload file');
  }

  if (!data?.imageUrl) {
    throw new Error('No URL returned from upload');
  }

  return data.imageUrl;
}
