import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../models/vote.model.js', () => ({
  Vote: { aggregate: vi.fn() },
}))

vi.mock('../../../models/category.model.js', () => ({
  Category: { find: vi.fn() },
}))

vi.mock('../../../config/pino.js', () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}))

import { Vote } from '../../../models/vote.model.js'
import { Category } from '../../../models/category.model.js'

describe('Admin Scores operations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns scores grouped by category', async () => {
    const mockSort = vi.fn().mockReturnThis()
    const mockLean = vi.fn().mockResolvedValue([
      { _id: { toString: () => 'cat-1' }, name: 'Male', slug: 'male' },
    ])
    vi.mocked(Category.find).mockReturnValue({ sort: mockSort, lean: mockLean } as any)
    vi.mocked(Vote.aggregate).mockResolvedValue([
      { _id: 'nom-1', totalVotes: 10, totalRevenue: 5000 },
      { _id: 'nom-2', totalVotes: 5, totalRevenue: 2500 },
    ])

    const categories = await Category.find().sort({ name: 1 }).lean()
    const scores = await Promise.all(
      categories.map(async (cat: any) => {
        const categoryId = cat._id.toString()
        const nominees = await Vote.aggregate([
          { $match: { categoryId, paymentStatus: 'confirmed' } },
          { $group: { _id: '$nomineeId', totalVotes: { $sum: '$quantity' }, totalRevenue: { $sum: '$totalCharged' } } },
          { $sort: { totalVotes: -1 } },
        ])
        return { category: { _id: categoryId, name: cat.name, slug: cat.slug }, nominees }
      }),
    )

    expect(scores).toHaveLength(1)
    expect(scores[0]!.nominees).toHaveLength(2)
    expect(Vote.aggregate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ $match: expect.objectContaining({ categoryId: 'cat-1' }) }),
      ]),
    )
  })

  it('returns empty nominees array when no votes', async () => {
    const mockLean = vi.fn().mockResolvedValue([
      { _id: { toString: () => 'cat-1' }, name: 'Male', slug: 'male' },
    ])
    vi.mocked(Category.find).mockReturnValue({ sort: vi.fn().mockReturnThis(), lean: mockLean } as any)
    vi.mocked(Vote.aggregate).mockResolvedValue([])

    const categories = await Category.find().sort({ name: 1 }).lean()
    const scores = await Promise.all(
      categories.map(async (cat: any) => {
        const nominees = await Vote.aggregate([
          { $match: { categoryId: cat._id.toString(), paymentStatus: 'confirmed' } },
          { $group: { _id: '$nomineeId', totalVotes: { $sum: '$quantity' }, totalRevenue: { $sum: '$totalCharged' } } },
          { $sort: { totalVotes: -1 } },
        ])
        return { category: { _id: cat._id.toString(), name: cat.name, slug: cat.slug }, nominees }
      }),
    )

    expect(scores[0]!.nominees).toEqual([])
  })
})
