import { describe, it, expect, vi, beforeEach } from 'vitest'
import { uploadImage, deleteImage, getSignedUrl, getTransformedUrl } from '../cloudinary.service.js'

vi.mock('../../config/cloudinary.js', () => ({
  cloudinary: {
    uploader: {
      upload_stream: vi.fn(),
      destroy: vi.fn(),
    },
    url: vi.fn(),
  },
}))

vi.mock('../../config/pino.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import { cloudinary } from '../../config/cloudinary.js'

describe('uploadImage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uploads a buffer and returns url and publicId', async () => {
    const mockResult = { secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/test', public_id: 'test-public' }
    vi.mocked(cloudinary.uploader.upload_stream).mockImplementation((_opts: unknown, cb: (err: unknown, result?: unknown) => void) => {
      cb(null, mockResult)
      return { end: vi.fn() }
    })

    const result = await uploadImage(Buffer.from('fake-image'), 'nominees')

    expect(result.url).toBe('https://res.cloudinary.com/demo/image/upload/v1/test')
    expect(result.publicId).toBe('test-public')
  })

  it('uploads a base64 string and returns result', async () => {
    const mockResult = { secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/str', public_id: 'str-id' }
    vi.mocked(cloudinary.uploader.upload_stream).mockImplementation((_opts: unknown, cb: (err: unknown, result?: unknown) => void) => {
      cb(null, mockResult)
      return { end: vi.fn() }
    })

    const result = await uploadImage('base64string', 'photos')

    expect(result.url).toBe('https://res.cloudinary.com/demo/image/upload/v1/str')
    expect(result.publicId).toBe('str-id')
  })

  it('rejects with AppError on upload failure', async () => {
    vi.mocked(cloudinary.uploader.upload_stream).mockImplementation((_opts: unknown, cb: (err: unknown, result?: unknown) => void) => {
      cb(new Error('Upload failed'), undefined)
      return { end: vi.fn() }
    })

    await expect(uploadImage(Buffer.from('x'), 'folder')).rejects.toThrow()
  })

  it('passes folder and resource_type image to upload_stream', async () => {
    vi.mocked(cloudinary.uploader.upload_stream).mockImplementation((_opts: unknown, cb: (err: unknown, result?: unknown) => void) => {
      cb(null, { secure_url: 'url', public_id: 'pid' })
      return { end: vi.fn() }
    })

    await uploadImage(Buffer.from('data'), 'my-folder')

    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
      expect.objectContaining({ folder: 'my-folder', resource_type: 'image' }),
      expect.any(Function),
    )
  })

  it('passes transformation and format options', async () => {
    vi.mocked(cloudinary.uploader.upload_stream).mockImplementation((_opts: unknown, cb: (err: unknown, result?: unknown) => void) => {
      cb(null, { secure_url: 'url', public_id: 'pid' })
      return { end: vi.fn() }
    })

    await uploadImage(Buffer.from('d'), 'folder', { transformation: 'c_fill,w_300', format: 'webp' })

    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
      expect.objectContaining({ transformation: 'c_fill,w_300', format: 'webp' }),
      expect.any(Function),
    )
  })
})

describe('deleteImage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls cloudinary.destroy with publicId', async () => {
    vi.mocked(cloudinary.uploader.destroy).mockResolvedValue({ result: 'ok' } as any)

    await deleteImage('test-public-id')

    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('test-public-id')
  })

  it('does not throw on destroy failure', async () => {
    vi.mocked(cloudinary.uploader.destroy).mockRejectedValue(new Error('Destroy failed'))

    await expect(deleteImage('bad-id')).resolves.not.toThrow()
  })

  it('handles non-existent publicId gracefully', async () => {
    vi.mocked(cloudinary.uploader.destroy).mockResolvedValue({ result: 'not found' } as any)

    await expect(deleteImage('non-existent')).resolves.not.toThrow()
  })
})

describe('getSignedUrl', () => {
  it('returns a signed URL string', () => {
    vi.mocked(cloudinary.url).mockReturnValue('https://res.cloudinary.com/demo/image/signed.jpg')

    const url = getSignedUrl('public-id')

    expect(typeof url).toBe('string')
    expect(url).toContain('cloudinary')
    expect(cloudinary.url).toHaveBeenCalledWith(
      'public-id',
      expect.objectContaining({ secure: true, sign_url: true }),
    )
  })
})

describe('getTransformedUrl', () => {
  it('returns a transformed URL string', () => {
    vi.mocked(cloudinary.url).mockReturnValue('https://res.cloudinary.com/demo/image/c_fill,w_300.jpg')

    const url = getTransformedUrl('public-id', 'c_fill,w_300')

    expect(typeof url).toBe('string')
    expect(cloudinary.url).toHaveBeenCalledWith(
      'public-id',
      expect.objectContaining({ secure: true, transformation: 'c_fill,w_300' }),
    )
  })
})
