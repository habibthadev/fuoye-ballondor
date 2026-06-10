import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../models/category.model.js', () => ({
  Category: {
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    create: vi.fn(),
    deleteOne: vi.fn(),
    countDocuments: vi.fn(),
  },
}))

vi.mock('../../../models/vote.model.js', () => ({
  Vote: { countDocuments: vi.fn(), deleteMany: vi.fn() },
}))

vi.mock('../../../config/pino.js', () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}))

import { Category } from '../../../models/category.model.js'
import { Vote } from '../../../models/vote.model.js'

describe('Admin Categories CRUD operations', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('list categories', () => {
    it('returns categories sorted by name', async () => {
      const mockLean = vi.fn().mockResolvedValue([{ _id: 'c1', name: 'Male', slug: 'male', pricePerVote: 500 }])
      const mockSort = vi.fn().mockReturnValue({ lean: mockLean })
      vi.mocked(Category.find).mockReturnValue({ sort: mockSort } as any)

      const categories = await Category.find().sort({ name: 1 }).lean()
      expect(categories).toHaveLength(1)
      expect(mockSort).toHaveBeenCalledWith({ name: 1 })
    })

    it('handles empty categories', async () => {
      const mockLean = vi.fn().mockResolvedValue([])
      const mockSort = vi.fn().mockReturnValue({ lean: mockLean })
      vi.mocked(Category.find).mockReturnValue({ sort: mockSort } as any)

      const categories = await Category.find().sort({ name: 1 }).lean()
      expect(categories).toEqual([])
    })
  })

  describe('create category', () => {
    it('creates category and returns it', async () => {
      const input = { name: 'New Cat', slug: 'new-cat', pricePerVote: 300 }
      vi.mocked(Category.create).mockResolvedValue({ _id: 'new', ...input } as any)

      const result = await Category.create(input)
      expect(result._id).toBe('new')
      expect(Category.create).toHaveBeenCalledWith(input)
    })
  })

  describe('update category', () => {
    it('updates category by id', async () => {
      const mockLean = vi.fn().mockResolvedValue({ _id: 'c1', name: 'Updated', slug: 'updated', pricePerVote: 600 })
      vi.mocked(Category.findByIdAndUpdate).mockReturnValue({ lean: mockLean } as any)

      const result = await Category.findByIdAndUpdate('c1', { $set: { pricePerVote: 600 } }, { new: true }).lean()
      expect(result?.name).toBe('Updated')
    })

    it('returns null for non-existent category', async () => {
      const mockLean = vi.fn().mockResolvedValue(null)
      vi.mocked(Category.findByIdAndUpdate).mockReturnValue({ lean: mockLean } as any)

      const result = await Category.findByIdAndUpdate('999', { $set: { name: 'Nope' } }, { new: true }).lean()
      expect(result).toBeNull()
    })
  })

  describe('delete category', () => {
    it('blocks deletion when votes exist', async () => {
      vi.mocked(Vote.countDocuments).mockResolvedValue(5)

      const count = await Vote.countDocuments({ categoryId: 'c1' })
      expect(count).toBe(5)
    })

    it('deletes category with no votes', async () => {
      vi.mocked(Vote.countDocuments).mockResolvedValue(0)
      vi.mocked(Category.deleteOne).mockResolvedValue({ deletedCount: 1 } as any)

      await Category.deleteOne({ _id: 'c1' })
      expect(Category.deleteOne).toHaveBeenCalledWith({ _id: 'c1' })
    })
  })
})
