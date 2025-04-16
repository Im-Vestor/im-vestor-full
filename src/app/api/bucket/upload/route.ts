import { uploadFileToBucket } from '~/utils/r2';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get('file') as File;

    if (!file) {
      return new Response('File not found', { status: 400 });
    }

    if (file.size > 1024 * 1024 * 2) {
      // 2MB
      return new Response('We only accept files up to 2MB', {
        status: 400,
      });
    }

    const data = await uploadFileToBucket(file, formData.get('userId') as string);

    return new Response(JSON.stringify(data.imageUrl), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (e) {
    console.error(e);

    return new Response(JSON.stringify(e), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
