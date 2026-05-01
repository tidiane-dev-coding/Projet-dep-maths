import { v2 as cloudinary } from 'cloudinary'

const cloudName = process.env.CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET

export const isCloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret)

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  })
}

export async function uploadPdfBufferToCloudinary(buffer: Buffer, filename: string) {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary not configured (missing CLOUDINARY_* env vars)')
  }

  return await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'dept-math/resources',
        resource_type: 'raw',
        use_filename: true,
        unique_filename: true,
        filename_override: filename,
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Cloudinary upload failed'))
        resolve({ secure_url: result.secure_url, public_id: result.public_id })
      }
    )

    stream.end(buffer)
  })
}

export async function uploadImageBufferToCloudinary(buffer: Buffer, filename: string) {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary not configured (missing CLOUDINARY_* env vars)')
  }

  return await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'dept-math/staff',
        resource_type: 'image',
        use_filename: true,
        unique_filename: true,
        filename_override: filename,
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Cloudinary upload failed'))
        resolve({ secure_url: result.secure_url, public_id: result.public_id })
      }
    )

    stream.end(buffer)
  })
}

