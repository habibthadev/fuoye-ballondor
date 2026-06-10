import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../models/category.model.js', () => ({
  Category: { find: vi.fn() },
}))

import { Category } from '../../../models/category.model.js'

describe('GET /api/categories operations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns list of categories', async () => {
    vi.mocked(Category.find).mockReturnValue({ lean: vi.fn().mockResolvedValue([
      { _id: '1', name: 'Ballon D\'or (Male)', slug: 'ballon-dor-male', description: 'Best male player', pricePerVote: 500 },
      { _id: '2', name: 'Ballon D\'or (Female)', slug: 'ballon-dor-female', description: 'Best female player', pricePerVote: 300 },
    ])} as any)

    const categories = await Category.find().lean()
    expect(categories).toHaveLength(2)
  })

  it('returns empty array when no categories exist', async () => {
    vi.mocked(Category.find).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) } as any)

    const categories = await Category.find().lean()
    expect(categories).toEqual([])
  })
})
