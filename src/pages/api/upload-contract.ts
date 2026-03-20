import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getAuth } from '@clerk/nextjs/server';
import type { NextApiRequest, NextApiResponse } from 'next';
import { env } from '~/env';
import { s3Client } from '~/utils/r2';

export const config = {
  api: { bodyParser: false },
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

// Only allow PDF files for contracts
const ACCEPTED_TYPES = new Set(['application/pdf']);

function sanitizeFilename(raw: string): string {
  // Decode in case the client encoded it
  let name: string;
  try {
    name = decodeURIComponent(raw);
  } catch {
    name = raw;
  }

  // Remove path separators and null bytes
  name = name.replace(/[/\\:\0]/g, '_');

  // Replace spaces with dashes
  name = name.replaceAll(' ', '-');

  // Collapse consecutive dots / underscores / dashes
  name = name.replace(/[._-]{2,}/g, match => match[0]!);

  // Remove leading dots (hidden files)
  name = name.replace(/^\.+/, '');

  return name || 'unnamed';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const filename = req.headers['x-file-name'] as string;
  const negotiationId = req.headers['x-negotiation-id'] as string;
  const contractType = req.headers['x-contract-type'] as string; // 'investor' or 'entrepreneur'
  const contentType = req.headers['content-type']! ?? 'application/octet-stream';

  if (!filename) {
    return res.status(400).json({ error: 'Missing X-File-Name header' });
  }

  if (!negotiationId) {
    return res.status(400).json({ error: 'Missing X-Negotiation-Id header' });
  }

  if (!contractType || (contractType !== 'investor' && contractType !== 'entrepreneur')) {
    return res
      .status(400)
      .json({ error: 'Invalid X-Contract-Type header (must be investor or entrepreneur)' });
  }

  if (!ACCEPTED_TYPES.has(contentType)) {
    return res.status(400).json({ error: 'Only PDF files are allowed for contracts' });
  }

  // Stream body with size limit
  const chunks: Buffer[] = [];
  let totalSize = 0;
  for await (const chunk of req) {
    totalSize += (chunk as Buffer).length;
    if (totalSize > MAX_FILE_SIZE) {
      return res.status(413).json({ error: 'File too large (max 50 MB)' });
    }
    chunks.push(chunk as Buffer);
  }
  const body = Buffer.concat(chunks);

  const safeName = sanitizeFilename(filename);
  const key = `${negotiationId}/${contractType}-contract-${Date.now()}.pdf`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.CLOUDFLARE_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      ContentDisposition: 'attachment',
    })
  );

  const url = `https://imvestor.gustavofior.com/${key}`;
  return res.status(200).json({ url });
}
