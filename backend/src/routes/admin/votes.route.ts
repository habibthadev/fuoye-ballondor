import { Hono } from 'hono'
import { Vote } from '../../models/vote.model.js'
import { parsePagination, paginatedResult } from '../../utils/paginate.js'
import type { AppEnv } from '../../types.js'

const router = new Hono<AppEnv>()

router.get('/', async (c) => {
  const { page, limit } = parsePagination(c.req.query())
  const status = c.req.query('status')
  const categoryId = c.req.query('categoryId')

  const filter: Record<string, unknown> = {}
  if (status && status !== 'all') filter.paymentStatus = status
  if (categoryId) filter.categoryId = categoryId

  const [data, total] = await Promise.all([
    Vote.find(filter)
      .populate('nomineeId', 'name imageUrl')
      .populate('categoryId', 'name slug')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Vote.countDocuments(filter),
  ])

  return c.json(paginatedResult(data, total, { page, limit }))
})

export default router
