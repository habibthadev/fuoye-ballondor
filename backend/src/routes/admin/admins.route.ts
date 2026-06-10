import { Hono } from 'hono'
import { Admin } from '../../models/admin.model.js'
import { createAdminSchema, updateAdminRoleSchema } from '../../schemas/auth.schema.js'
import { validate } from '../../middleware/validate.middleware.js'
import { hashPassword } from '../../services/auth.service.js'
import { NotFoundError, ForbiddenError } from '../../utils/errors.js'
import { logger } from '../../config/pino.js'
import type { AppEnv } from '../../types.js'

const router = new Hono<AppEnv>()

router.get('/', async (c) => {
  const admins = await Admin.find()
    .select('-passwordHash')
    .sort({ createdAt: -1 })
    .lean()
  return c.json({ data: admins })
})

router.post('/', validate(createAdminSchema), async (c) => {
  const data = c.get('validatedData') as { name: string; email: string; password: string; role: 'admin' | 'superadmin' }

  const existing = await Admin.findOne({ email: data.email }).lean()
  if (existing) {
    return c.json({ error: 'Admin with this email already exists' }, 409)
  }

  const passwordHash = await hashPassword(data.password)
  const admin = await Admin.create({
    name: data.name,
    email: data.email,
    passwordHash,
    role: data.role,
  })

  logger.info({ adminId: admin._id }, 'Admin created')
  return c.json({ data: { id: admin._id, name: admin.name, email: admin.email, role: admin.role } }, 201)
})

router.patch('/:id/role', validate(updateAdminRoleSchema), async (c) => {
  const id = c.req.param('id')
  const { role } = c.get('validatedData') as { role: 'admin' | 'superadmin' }
  const currentAdmin = c.get('admin')

  if (id === currentAdmin.sub && currentAdmin.role !== 'superadmin') {
    throw new ForbiddenError('Cannot change your own role')
  }

  const admin = await Admin.findByIdAndUpdate(id, { role }, { new: true })
    .select('-passwordHash')
    .lean()
  if (!admin) {
    throw new NotFoundError('Admin')
  }

  logger.info({ adminId: id, newRole: role, byAdmin: currentAdmin.sub }, 'Admin role changed')
  return c.json({ data: admin })
})

router.patch('/:id/deactivate', async (c) => {
  const id = c.req.param('id')
  const currentAdmin = c.get('admin')

  if (id === currentAdmin.sub) {
    throw new ForbiddenError('Cannot deactivate your own account')
  }

  const admin = await Admin.findByIdAndUpdate(id, { isActive: false }, { new: true })
    .select('-passwordHash')
    .lean()
  if (!admin) {
    throw new NotFoundError('Admin')
  }

  logger.info({ adminId: id, byAdmin: currentAdmin.sub }, 'Admin deactivated')
  return c.json({ data: admin })
})

router.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const currentAdmin = c.get('admin')

  if (id === currentAdmin.sub) {
    throw new ForbiddenError('Cannot delete your own account')
  }

  const admin = await Admin.findByIdAndDelete(id).lean()
  if (!admin) {
    throw new NotFoundError('Admin')
  }

  logger.info({ adminId: id, byAdmin: currentAdmin.sub }, 'Admin deleted')
  return c.json({ message: 'Admin deleted' })
})

export default router
