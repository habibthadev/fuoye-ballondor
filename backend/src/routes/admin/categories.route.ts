import { Hono } from 'hono'
import { Category } from '../../models/category.model.js'
import { z } from 'zod'
import { validate } from '../../middleware/validate.middleware.js'
import { NotFoundError } from '../../utils/errors.js'
import type { AppEnv } from '../../types.js'

const objectIdPattern = /^[a-f\d]{24}$/i

const categorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  iconName: z.string().min(1),
  coverImage: z.string().url().optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().min(0),
  pricePerVote: z.number().int().min(1).max(10000).optional(),
})

const objectIdParam = z.object({ id: z.string().regex(objectIdPattern, 'Invalid ID format') })

const router = new Hono<AppEnv>()

router.get('/', async (c) => {
  const categories = await Category.find().sort({ order: 1 }).lean()
  return c.json({ data: categories })
})

router.post('/', validate(categorySchema), async (c) => {
  const data = c.get('validatedData') as z.infer<typeof categorySchema>
  const category = await Category.create(data)
  return c.json({ data: category }, 201)
})

router.patch('/:id', validate(categorySchema.partial()), async (c) => {
  const { id } = objectIdParam.parse(c.req.param())
  const data = c.get('validatedData') as Partial<z.infer<typeof categorySchema>>

  const category = await Category.findByIdAndUpdate(id, data, { new: true }).lean()
  if (!category) {
    throw new NotFoundError('Category')
  }

  return c.json({ data: category })
})

router.delete('/:id', async (c) => {
  const { id } = objectIdParam.parse(c.req.param())
  const category = await Category.findByIdAndDelete(id).lean()
  if (!category) {
    throw new NotFoundError('Category')
  }
  return c.json({ message: 'Category deleted' })
})

export default router
