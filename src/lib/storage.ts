import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Cloudflare R2 is S3-compatible. Configure via env vars:
//   R2_ACCOUNT_ID         - your Cloudflare account id
//   R2_ACCESS_KEY_ID      - R2 API token access key
//   R2_SECRET_ACCESS_KEY  - R2 API token secret
//   R2_BUCKET             - bucket name
//   R2_PUBLIC_URL         - public base URL (r2.dev URL or custom domain)
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET && R2_PUBLIC_URL);
}

let client: S3Client | null = null;
function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID as string,
        secretAccessKey: R2_SECRET_ACCESS_KEY as string
      }
    });
  }
  return client;
}

// Upload a file buffer to R2 and return its public URL.
export async function uploadToR2(key: string, body: Buffer, contentType: string): Promise<string> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET as string,
      Key: key,
      Body: body,
      ContentType: contentType
    })
  );
  return `${(R2_PUBLIC_URL as string).replace(/\/$/, '')}/${key}`;
}

// Delete an object from R2 by key.
export async function deleteFromR2(key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET as string,
      Key: key
    })
  );
}
