import path from 'path'
import { v2 as cloudinary } from 'cloudinary'

function safeFilenameForCloudinary(filename: string) {
  const base = path.basename(filename || 'photo.jpg')
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_') || 'photo.jpg'
  return `${Date.now()}-${cleaned}`
}

function getMissingCloudinaryVars() {
  const cloudUrl = process.env.CLOUDINARY_URL
  if (cloudUrl && cloudUrl.trim()) return []

  const missing: string[] = []
  if (!process.env.CLOUDINARY_CLOUD_NAME) missing.push('CLOUDINARY_CLOUD_NAME')
  if (!process.env.CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY')
  if (!process.env.CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET')
  return missing
}

function ensureCloudinaryConfigured() {
  const cloudUrl = process.env.CLOUDINARY_URL
  if (cloudUrl && cloudUrl.trim()) {
    // Cloudinary SDK lit automatiquement CLOUDINARY_URL, mais on force secure URLs.
    cloudinary.config({ secure: true })
    return
  }

  const missing = getMissingCloudinaryVars()
  if (missing.length > 0) {
    throw new Error(`Cloudinary not configured. Missing: ${missing.join(', ')}`)
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
}

export async function uploadPdfBufferToCloudinary(buffer: Buffer, filename: string) {
  ensureCloudinaryConfigured()

  return await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'dept-math/resources',
        resource_type: 'raw',
        use_filename: true,
        unique_filename: true,
        filename_override: safeFilenameForCloudinary(filename),
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Cloudinary upload failed'))
        const secure_url = result.secure_url || (result as any).url
        if (!secure_url) return reject(new Error('Cloudinary upload returned no URL'))
        resolve({ secure_url, public_id: result.public_id })
      }
    )

    stream.end(buffer)
  })
}

export async function uploadImageBufferToCloudinary(buffer: Buffer, filename: string) {
  ensureCloudinaryConfigured()

  return await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'dept-math/staff',
        resource_type: 'image',
        use_filename: true,
        unique_filename: true,
        filename_override: safeFilenameForCloudinary(filename),
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Cloudinary upload failed'))
        const secure_url = result.secure_url || (result as any).url
        if (!secure_url) return reject(new Error('Cloudinary upload returned no URL'))
        resolve({ secure_url, public_id: result.public_id })
      }
    )

    stream.end(buffer)
  })
}

