import { Hono } from 'hono'
import { Nominee } from '../../models/nominee.model.js'
import { Category } from '../../models/category.model.js'
import { createNomineeSchema, updateNomineeSchema, transferNomineeSchema } from '../../schemas/nominee.schema.js'
import { validate } from '../../middleware/validate.middleware.js'
import { parsePagination, paginatedResult } from '../../utils/paginate.js'
import { uploadImage, deleteImage } from '../../services/cloudinary.service.js'
import { NotFoundError } from '../../utils/errors.js'
import { logger } from '../../config/pino.js'
import type { AppEnv } from '../../types.js'

const router = new Hono<AppEnv>()

router.get('/', async (c) => {
  const { page, limit } = parsePagination(c.req.query())
  const search = c.req.query('search')
  const categoryId = c.req.query('categoryId')

  const filter: Record<string, unknown> = {}
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    filter.name = { $regex: escaped, $options: 'i' }
  }
  if (categoryId) filter.categoryId = categoryId

  const [data, total] = await Promise.all([
    Nominee.find(filter)
      .populate('categoryId', 'name slug')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Nominee.countDocuments(filter),
  ])

  return c.json(paginatedResult(data, total, { page, limit }))
})

router.post('/', validate(createNomineeSchema), async (c) => {
  const data = c.get('validatedData') as {
    name: string
    department: string
    faculty: string
    position: string
    categoryId: string
  }

  const formData = await c.req.formData()
  const file = formData.get('image')

  if (!file || !(file instanceof File)) {
    return c.json({ error: 'Image is required' }, 400)
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const result = await uploadImage(buffer, 'fuoye-ballondor/nominees')

  const nominee = await Nominee.create({
    ...data,
    imageUrl: result.url,
    imagePublicId: result.publicId,
  })

  logger.info({ nomineeId: nominee._id }, 'Nominee created')
  return c.json({ data: nominee }, 201)
})

router.patch('/:id', validate(updateNomineeSchema), async (c) => {
  const id = c.req.param('id')
  const data = c.get('validatedData') as Record<string, unknown>

  const nominee = await Nominee.findByIdAndUpdate(id, data, { new: true }).lean()
  if (!nominee) {
    throw new NotFoundError('Nominee')
  }

  return c.json({ data: nominee })
})

router.patch('/:id/transfer', validate(transferNomineeSchema), async (c) => {
  const id = c.req.param('id')
  const { targetCategoryId } = c.get('validatedData') as { targetCategoryId: string }

  const category = await Category.findById(targetCategoryId).lean()
  if (!category) {
    throw new NotFoundError('Category')
  }

  const nominee = await Nominee.findByIdAndUpdate(
    id,
    { categoryId: targetCategoryId },
    { new: true }
  ).lean()
  if (!nominee) {
    throw new NotFoundError('Nominee')
  }

  logger.info({ nomineeId: id, targetCategoryId }, 'Nominee transferred')
  return c.json({ data: nominee })
})

router.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const nominee = await Nominee.findByIdAndDelete(id).lean()
  if (!nominee) {
    throw new NotFoundError('Nominee')
  }

  if (nominee.imagePublicId) {
    await deleteImage(nominee.imagePublicId).catch(() => {})
  }

  logger.info({ nomineeId: id }, 'Nominee deleted')
  return c.json({ message: 'Nominee deleted' })
})

export default router
