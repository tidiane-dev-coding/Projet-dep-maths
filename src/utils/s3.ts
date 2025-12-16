import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1'
const BUCKET = process.env.S3_BUCKET || ''

const s3Client = new S3Client({ region: REGION })

export async function uploadBufferToS3(buffer: Buffer, key: string, contentType?: string) {
  if (!BUCKET) throw new Error('S3_BUCKET not configured')
  const params = {
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType || 'application/octet-stream',
    ACL: 'public-read',
  }
  const cmd = new PutObjectCommand(params)
  await s3Client.send(cmd)
  // Public URL (assuming standard S3 public bucket)
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${encodeURIComponent(key)}`
}
