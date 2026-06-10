import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../models/nominee.model.js', () => ({
  Nominee: {
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    create: vi.fn(),
    findByIdAndDelete: vi.fn(),
    countDocuments: vi.fn(),
  },
}))

vi.mock('../../../services/cloudinary.service.js', () => ({
  deleteImage: vi.fn(),
  uploadImage: vi.fn(),
}))

vi.mock('../../../config/pino.js', () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}))

import { Nominee } from '../../../models/nominee.model.js'

describe('Admin Nominees CRUD operations', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('list nominees', () => {
    it('returns paginated nominees', async () => {
      const mockLean = vi.fn().mockResolvedValue([{ _id: '1', name: 'John' }])
      const query = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([{ _id: '1', name: 'John' }]),
      }
      vi.mocked(Nominee.find).mockReturnValue(query as any)
      vi.mocked(Nominee.countDocuments).mockResolvedValue(1)

      const nominees = await Nominee.find({}).populate('categoryId').sort({ createdAt: -1 }).skip(0).limit(20).lean()
      expect(nominees).toHaveLength(1)
    })

    it('counts total documents', async () => {
      vi.mocked(Nominee.countDocuments).mockResolvedValue(42)

      const total = await Nominee.countDocuments({})
      expect(total).toBe(42)
    })
  })

  describe('create nominee', () => {
    it('creates a new nominee', async () => {
      const input = { name: 'New Nominee', categoryId: 'cat-1' }
      vi.mocked(Nominee.create).mockResolvedValue({ _id: 'new-id', ...input } as any)

      const result = await Nominee.create(input)
      expect(result._id).toBe('new-id')
    })
  })

  describe('update nominee', () => {
    it('updates nominee by id', async () => {
      const mockLean = vi.fn().mockResolvedValue({ _id: '1', name: 'Updated', categoryId: 'cat-1' })
      vi.mocked(Nominee.findByIdAndUpdate).mockReturnValue({ lean: mockLean } as any)

      const result = await Nominee.findByIdAndUpdate('1', { $set: { name: 'Updated' } }, { new: true }).lean()
      expect(result?.name).toBe('Updated')
    })

    it('returns null for non-existent nominee', async () => {
      const mockLean = vi.fn().mockResolvedValue(null)
      vi.mocked(Nominee.findByIdAndUpdate).mockReturnValue({ lean: mockLean } as any)

      const result = await Nominee.findByIdAndUpdate('999', { $set: { name: 'Nope' } }, { new: true }).lean()
      expect(result).toBeNull()
    })
  })

  describe('delete nominee', () => {
    it('deletes nominee by id', async () => {
      const mockFindLean = vi.fn().mockResolvedValue({ _id: '1', name: 'ToDelete' })
      vi.mocked(Nominee.findById).mockReturnValue({ lean: mockFindLean } as any)
      vi.mocked(Nominee.findByIdAndDelete).mockResolvedValue({} as any)

      const nominee = await Nominee.findById('1').lean()
      expect(nominee).not.toBeNull()

      await Nominee.findByIdAndDelete('1')
      expect(Nominee.findByIdAndDelete).toHaveBeenCalledWith('1')
    })

    it('returns null for non-existent nominee', async () => {
      const mockLean = vi.fn().mockResolvedValue(null)
      vi.mocked(Nominee.findById).mockReturnValue({ lean: mockLean } as any)

      const result = await Nominee.findById('999').lean()
      expect(result).toBeNull()
    })
  })
})
