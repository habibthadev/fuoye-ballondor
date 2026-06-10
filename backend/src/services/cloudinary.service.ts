import { cloudinary } from '../config/cloudinary.js'
import { AppError } from '../utils/errors.js'
import { logger } from '../config/pino.js'

interface UploadResult {
  url: string
  publicId: string
}

export async function uploadImage(
  file: Buffer | string,
  folder: string,
  options: { transformation?: string; format?: string } = {}
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadOptions: Record<string, unknown> = {
      folder,
      resource_type: 'image',
    }

    if (options.transformation) {
      uploadOptions.transformation = options.transformation
    }

    if (options.format) {
      uploadOptions.format = options.format
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error || !result) {
          reject(new AppError('Image upload failed', 500, 'UPLOAD_FAILED'))
          return
        }
        resolve({ url: result.secure_url, publicId: result.public_id })
      }
    )

    if (typeof file === 'string') {
      uploadStream.end(Buffer.from(file, 'base64'))
    } else {
      uploadStream.end(file)
    }
  })
}

export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch {
    logger.warn({ publicId }, 'Failed to delete image from Cloudinary')
  }
}

export function getSignedUrl(publicId: string, expiresIn = 3600): string {
  return cloudinary.url(publicId, {
    secure: true,
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
  })
}

export function getTransformedUrl(
  publicId: string,
  transformation: string
): string {
  return cloudinary.url(publicId, {
    secure: true,
    transformation,
  })
}
