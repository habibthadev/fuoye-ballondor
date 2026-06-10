import { Hono } from 'hono'
import { Category } from '../../models/category.model.js'
import { parsePagination, paginatedResult } from '../../utils/paginate.js'

const router = new Hono()

router.get('/', async (c) => {
  const categories = await Category.find({ isActive: true })
    .sort({ order: 1 })
    .lean()
  return c.json({ data: categories })
})

router.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const category = await Category.findOne({ slug, isActive: true }).lean()
  if (!category) {
    return c.json({ error: 'Category not found' }, 404)
  }
  return c.json({ data: category })
})

export default router
