import { Hono } from 'hono'
import { Nominee } from '../../models/nominee.model.js'
import { Category } from '../../models/category.model.js'
import { parsePagination, paginatedResult } from '../../utils/paginate.js'

const router = new Hono()

router.get('/', async (c) => {
  const { page, limit } = parsePagination(c.req.query())
  const categoryId = c.req.query('categoryId')
  const slug = c.req.query('slug')

  const filter: Record<string, unknown> = { isActive: true }
  if (categoryId) filter.categoryId = categoryId

  if (slug) {
    const category = await Category.findOne({ slug }).lean()
    if (!category) {
      return c.json({ error: 'Category not found' }, 404)
    }
    filter.categoryId = category._id
  }

  const [data, total] = await Promise.all([
    Nominee.find(filter)
      .select('-voteCount -imagePublicId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Nominee.countDocuments(filter),
  ])

  return c.json(paginatedResult(data, total, { page, limit }))
})

router.get('/:id', async (c) => {
  const id = c.req.param('id')
  const nominee = await Nominee.findOne({ _id: id, isActive: true })
    .select('-voteCount -imagePublicId')
    .populate('categoryId', 'name slug')
    .lean()
  if (!nominee) {
    return c.json({ error: 'Nominee not found' }, 404)
  }
  return c.json({ data: nominee })
})

export default router
