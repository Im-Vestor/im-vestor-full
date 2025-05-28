import { uploadFileToBucket } from '~/utils/r2';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get('file') as File;

    if (!file) {
      return new Response('File not found', { status: 400 });
    }

    // Check file size based on type
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 1024 * 1024 * 10 : 1024 * 1024 * 2; // 10MB for videos, 2MB for images
    const sizeLabel = isVideo ? '10MB' : '2MB';

    if (file.size > maxSize) {
      return new Response(`We only accept ${isVideo ? 'videos' : 'files'} up to ${sizeLabel}`, {
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
