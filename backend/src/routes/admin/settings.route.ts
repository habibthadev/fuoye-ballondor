import { Hono } from 'hono'
import { Settings } from '../../models/settings.model.js'
import { updateSettingsSchema } from '../../schemas/settings.schema.js'
import { validate } from '../../middleware/validate.middleware.js'
import { logger } from '../../config/pino.js'
import { invalidateSettingsCache } from '../../services/vote.service.js'
import type { AppEnv } from '../../types.js'

const router = new Hono<AppEnv>()

router.get('/', async (c) => {
  const settings = await Settings.findOne().lean()
  if (!settings) {
    const created = await Settings.create({})
    return c.json({ data: created })
  }
  return c.json({ data: settings })
})

router.patch('/', validate(updateSettingsSchema), async (c) => {
  const data = c.get('validatedData') as Record<string, unknown>
  const admin = c.get('admin')

  const settings = await Settings.findOneAndUpdate(
    {},
    { ...data, updatedBy: admin.sub },
    { new: true, upsert: true }
  ).lean()

  invalidateSettingsCache()
  logger.info({ adminId: admin.sub, changes: data }, 'Settings updated')
  return c.json({ data: settings })
})

export default router
