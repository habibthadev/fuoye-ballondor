import { Hono } from 'hono'
import { verifyCron } from '../../middleware/verify-cron.middleware.js'
import { reconcilePendingOrders } from '../../services/vote.service.js'
import { logger } from '../../config/pino.js'
import type { AppEnv } from '../../types.js'

const router = new Hono<AppEnv>()

router.get('/reconcile-payments', verifyCron, async (c) => {
  const start = Date.now()

  try {
    const result = await reconcilePendingOrders()

    logger.info({
      job: 'reconcile-payments',
      affected: result,
      durationMs: Date.now() - start,
    }, 'Cron job completed')

    return c.json({ ok: true, affected: result })
  } catch (err) {
    logger.error({
      job: 'reconcile-payments',
      err,
      durationMs: Date.now() - start,
    }, 'Cron job failed')

    return c.json({ ok: false }, 500)
  }
})

export default router
