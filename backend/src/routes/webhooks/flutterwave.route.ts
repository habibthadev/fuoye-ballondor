import { Hono } from 'hono'
import { z } from 'zod'
import { env } from '../../config/env.js'
import { qstash } from '../../lib/qstash.js'
import { handleDispute } from '../../services/vote.service.js'
import { logger } from '../../config/pino.js'

const flwWebhookSchema = z.object({
  event: z.string(),
  data: z.object({
    id: z.number(),
    tx_ref: z.string(),
    flw_ref: z.string().optional(),
    status: z.string().optional(),
    amount: z.number().optional(),
    currency: z.string().optional(),
    customer: z.object({ email: z.string() }).optional(),
  }),
})

const router = new Hono()

router.post('/', async (c) => {
  if (!c.req.header('content-type')?.includes('application/json')) {
    return c.json({ error: 'Expected JSON' }, 400)
  }

  const hash = c.req.header('verif-hash')
  if (!hash || hash !== env.FLW_WEBHOOK_SECRET) {
    logger.warn({ hash }, 'Invalid Flutterwave webhook hash')
    return c.json({ error: 'Unauthorized' }, 401)
  }

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    logger.error('Flutterwave webhook — invalid JSON body')
    return c.json({ received: true }, 200)
  }

  const parsed = flwWebhookSchema.safeParse(body)
  if (!parsed.success) {
    logger.error({ error: parsed.error.issues }, 'Flutterwave webhook — payload shape mismatch')
    return c.json({ received: true }, 200)
  }

  const { event, data } = parsed.data
  const { id, tx_ref } = data

  logger.info({ event, txRef: tx_ref, flwId: id }, 'Flutterwave webhook received')

  switch (event) {
    case 'charge.completed': {
      if (data.status !== 'successful') {
        logger.info({ txRef: tx_ref, status: data.status }, 'Flutterwave webhook — non-successful, skipping')
        return c.json({ received: true }, 200)
      }
      await qstash.publishJSON({
        url: `${env.BACKEND_URL}/api/jobs/reconcile-payment`,
        body: { txRef: tx_ref, flwTxId: id },
        retries: 3,
      })
      logger.info({ txRef: tx_ref, flwId: id }, 'Reconciliation job enqueued')
      break
    }
    case 'charge.dispute.create':
    case 'charge.dispute.remind':
      await handleDispute(tx_ref)
      break
    default:
      logger.info({ event, txRef: tx_ref }, 'Flutterwave webhook — unhandled event type')
  }

  return c.json({ received: true }, 200)
})

export default router
