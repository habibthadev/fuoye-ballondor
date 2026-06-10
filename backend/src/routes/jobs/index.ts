import { Hono } from 'hono'
import { z } from 'zod'
import { verifyQStash } from '../middleware/verify-qstash.middleware.js'
import { confirmFlutterwaveVote } from '../services/vote.service.js'
import { logger } from '../config/pino.js'

const payloadSchema = z.object({
  txRef: z.string().min(1),
  flwTxId: z.number().positive(),
})

const router = new Hono()

router.post('/reconcile-payment', verifyQStash, async (c) => {
  const raw = c.get('qstashBody')
  const result = payloadSchema.safeParse(JSON.parse(raw))

  if (!result.success) {
    logger.warn({ errors: result.error.flatten() }, 'Invalid job payload')
    return c.json({ ok: false, reason: 'invalid_payload' })
  }

  const { txRef, flwTxId } = result.data

  try {
    await confirmFlutterwaveVote(txRef, flwTxId)
    logger.info({ txRef, flwTxId }, 'Payment reconciled via QStash')
    return c.json({ ok: true })
  } catch (err) {
    logger.error({ txRef, err }, 'Reconciliation job failed')
    return c.json({ ok: false }, 500)
  }
})

export default router
