/**
 * Cloudflare R2 Storage Provider (S3-compatible)
 * Handles file uploads, downloads, and signed URLs.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let _s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (_s3Client) return _s3Client;

  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY;
  const secretAccessKey = process.env.R2_SECRET_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Missing required R2 storage configuration.\n' +
      'Required: R2_ENDPOINT, R2_ACCESS_KEY, R2_SECRET_KEY\n' +
      'Where to obtain: Cloudflare Dashboard → R2 → Manage R2 API Tokens'
    );
  }

  _s3Client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return _s3Client;
}

function getBucket(): string {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) {
    throw new Error('Missing required environment variable: R2_BUCKET');
  }
  return bucket;
}

/**
 * Upload a file to R2 storage.
 */
export async function uploadFile(params: {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType: string;
  metadata?: Record<string, string>;
}): Promise<{ key: string; size: number }> {
  const client = getS3Client();
  const bucket = getBucket();

  const bodyBuffer = typeof params.body === 'string'
    ? Buffer.from(params.body)
    : Buffer.from(params.body);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: bodyBuffer,
      ContentType: params.contentType,
      Metadata: params.metadata,
    })
  );

  return {
    key: params.key,
    size: bodyBuffer.length,
  };
}

/**
 * Download a file from R2 storage.
 */
export async function downloadFile(key: string): Promise<{
  body: Buffer;
  contentType: string;
}> {
  const client = getS3Client();
  const bucket = getBucket();

  const response = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );

  if (!response.Body) {
    throw new Error(`File not found: ${key}`);
  }

  const chunks: Uint8Array[] = [];
  const stream = response.Body as AsyncIterable<Uint8Array>;
  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return {
    body: Buffer.concat(chunks),
    contentType: response.ContentType || 'application/octet-stream',
  };
}

/**
 * Generate a signed URL for downloading a file.
 * URL expires after the specified duration.
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  const client = getS3Client();
  const bucket = getBucket();

  const url = await getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
    { expiresIn: expiresInSeconds }
  );

  return url;
}

/**
 * Generate a signed URL for uploading a file.
 */
export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  const client = getS3Client();
  const bucket = getBucket();

  const url = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: expiresInSeconds }
  );

  return url;
}

/**
 * Delete a file from R2 storage.
 */
export async function deleteFile(key: string): Promise<void> {
  const client = getS3Client();
  const bucket = getBucket();

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}

/**
 * Check if a file exists in R2 storage.
 */
export async function fileExists(key: string): Promise<boolean> {
  const client = getS3Client();
  const bucket = getBucket();

  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a storage key for different file types.
 */
export function generateStorageKey(params: {
  type: 'template' | 'order' | 'reference' | 'upload';
  userId?: string;
  orderId?: string;
  templateId?: string;
  fileName: string;
}): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);

  switch (params.type) {
    case 'template':
      return `templates/${params.templateId}/${timestamp}-${randomSuffix}-${params.fileName}`;
    case 'order':
      return `orders/${params.userId}/${params.orderId}/${timestamp}-${randomSuffix}-${params.fileName}`;
    case 'reference':
      return `references/${params.userId}/${params.orderId}/${timestamp}-${randomSuffix}-${params.fileName}`;
    case 'upload':
      return `uploads/${params.userId}/${timestamp}-${randomSuffix}-${params.fileName}`;
    default:
      return `misc/${timestamp}-${randomSuffix}-${params.fileName}`;
  }
}
