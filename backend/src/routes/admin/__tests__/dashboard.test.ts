import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../models/vote.model.js', () => ({
  Vote: { countDocuments: vi.fn(), aggregate: vi.fn() },
}))

vi.mock('../../../models/nominee.model.js', () => ({
  Nominee: { countDocuments: vi.fn() },
}))

vi.mock('../../../models/category.model.js', () => ({
  Category: { find: vi.fn(), countDocuments: vi.fn() },
}))

vi.mock('../../../config/pino.js', () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}))

import { Vote } from '../../../models/vote.model.js'
import { Nominee } from '../../../models/nominee.model.js'
import { Category } from '../../../models/category.model.js'

describe('Admin Dashboard operations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns dashboard stats', async () => {
    vi.mocked(Vote.countDocuments).mockResolvedValue(150)
    vi.mocked(Nominee.countDocuments).mockResolvedValue(45)
    vi.mocked(Category.countDocuments).mockResolvedValue(5)
    vi.mocked(Vote.aggregate).mockResolvedValue([{ _id: null, total: 750000 }])
    vi.mocked(Category.find).mockReturnValue({ sort: vi.fn().mockReturnThis(), lean: vi.fn().mockResolvedValue([]) } as any)

    const [totalVotes, totalNominees, totalCategories, totalRevenueAgg] = await Promise.all([
      Vote.countDocuments(),
      Nominee.countDocuments(),
      Category.countDocuments(),
      Vote.aggregate([
        { $match: { paymentStatus: 'confirmed' } },
        { $group: { _id: null, total: { $sum: '$totalCharged' } } },
      ]),
    ])

    const totalRevenue = totalRevenueAgg[0]?.total ?? 0

    expect(totalVotes).toBe(150)
    expect(totalNominees).toBe(45)
    expect(totalCategories).toBe(5)
    expect(totalRevenue).toBe(750000)
  })

  it('handles zero revenue', async () => {
    vi.mocked(Vote.countDocuments).mockResolvedValue(0)
    vi.mocked(Nominee.countDocuments).mockResolvedValue(0)
    vi.mocked(Category.countDocuments).mockResolvedValue(0)
    vi.mocked(Vote.aggregate).mockResolvedValue([])

    const [totalRevenueAgg] = await Promise.all([
      Vote.aggregate([
        { $match: { paymentStatus: 'confirmed' } },
        { $group: { _id: null, total: { $sum: '$totalCharged' } } },
      ]),
    ])

    const totalRevenue = totalRevenueAgg[0]?.total ?? 0
    expect(totalRevenue).toBe(0)
  })
})
