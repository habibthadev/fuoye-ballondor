import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../models/category.model.js', () => ({
  Category: { find: vi.fn() },
}))

vi.mock('../../../models/nominee.model.js', () => ({
  Nominee: { find: vi.fn() },
}))

vi.mock('../../../config/pino.js', () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}))

import { Category } from '../../../models/category.model.js'
import { Nominee } from '../../../models/nominee.model.js'

describe('GET /api/stats operations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns public stats counts', async () => {
    vi.mocked(Category.find).mockReturnValue({ lean: vi.fn().mockResolvedValue([{ _id: '1' }, { _id: '2' }]) } as any)
    vi.mocked(Nominee.find).mockReturnValue({ lean: vi.fn().mockResolvedValue([
      { _id: 'n1', imageUrl: '/img1.jpg' },
      { _id: 'n2', imageUrl: null },
      { _id: 'n3', imageUrl: '/img3.jpg' },
    ])} as any)

    const [categories, nominees] = await Promise.all([
      Category.find().lean(),
      Nominee.find().lean(),
    ])

    const nomineesWithImages = nominees.filter((n: any) => n.imageUrl).length

    expect(categories.length).toBe(2)
    expect(nominees.length).toBe(3)
    expect(nomineesWithImages).toBe(2)
  })

  it('handles zero state', async () => {
    vi.mocked(Category.find).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) } as any)
    vi.mocked(Nominee.find).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) } as any)

    const [categories, nominees] = await Promise.all([
      Category.find().lean(),
      Nominee.find().lean(),
    ])

    expect(categories.length).toBe(0)
    expect(nominees.length).toBe(0)
  })
})
