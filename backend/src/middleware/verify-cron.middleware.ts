import { createMiddleware } from 'hono/factory'
import { env } from '../config/env.js'

export const verifyCron = createMiddleware(async (c, next) => {
  const auth = c.req.header('Authorization')

  if (!env.CRON_SECRET) {
    return c.json({ error: 'Cron secret not configured' }, 500)
  }

  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  await next()
})
