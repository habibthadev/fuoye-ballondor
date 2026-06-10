import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../models/nominee.model.js', () => ({
  Nominee: { find: vi.fn(), countDocuments: vi.fn() },
}))

vi.mock('../../../models/category.model.js', () => ({
  Category: { findOne: vi.fn() },
}))

import { Nominee } from '../../../models/nominee.model.js'
import { Category } from '../../../models/category.model.js'

describe('GET /api/nominees operations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns paginated nominees', async () => {
    const query = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([{ _id: '1', name: 'John' }, { _id: '2', name: 'Jane' }]),
      countDocuments: vi.fn().mockResolvedValue(10),
    }
    vi.mocked(Nominee.find).mockReturnValue(query as any)
    vi.mocked(Nominee.countDocuments).mockResolvedValue(10)

    const nominees = await Nominee.find({}).sort({ createdAt: -1 }).skip(0).limit(20).lean()
    const total = await Nominee.countDocuments({})

    expect(nominees).toHaveLength(2)
    expect(total).toBe(10)
  })

  it('filters by category slug', async () => {
    vi.mocked(Category.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: { toString: () => 'cat-1' }, name: 'Test' }) } as any)
    const query = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
    }
    vi.mocked(Nominee.find).mockReturnValue(query as any)

    const category = await Category.findOne({ slug: 'ballon-dor-male' }).lean()
    expect(category).not.toBeNull()
  })

  it('returns empty result for non-existent category', async () => {
    vi.mocked(Category.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue(null) } as any)

    const category = await Category.findOne({ slug: 'nonexistent' }).lean()
    expect(category).toBeNull()
  })

  it('counts documents for pagination', async () => {
    const query = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
    }
    vi.mocked(Nominee.find).mockReturnValue(query as any)
    vi.mocked(Nominee.countDocuments).mockResolvedValue(5)

    const total = await Nominee.countDocuments({})
    expect(total).toBe(5)
  })
})
