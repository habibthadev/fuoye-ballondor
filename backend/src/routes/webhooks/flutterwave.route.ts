import { Hono } from 'hono'
import { env } from '../../config/env.js'
import { confirmFlutterwaveVote, handleDispute } from '../../services/vote.service.js'
import { logger } from '../../config/pino.js'

const router = new Hono()

router.post('/', async (c) => {
  const hash = c.req.header('verif-hash')
  if (!hash || hash !== env.FLW_WEBHOOK_SECRET) {
    logger.warn({ hash }, 'Invalid Flutterwave webhook hash')
    return c.json({ error: 'Invalid signature' }, 401)
  }

  let event: string
  let dataObj: Record<string, unknown>

  try {
    const body = await c.req.json()
    const raw = body as Record<string, unknown>
    event = raw.event as string
    dataObj = raw.data as Record<string, unknown>
    if (!event || !dataObj) throw new Error('Missing event or data')
  } catch {
    logger.error('Flutterwave webhook — invalid payload')
    return c.json({ received: true }, 200)
  }

  const id = dataObj.id as number
  const tx_ref = dataObj.tx_ref as string
  if (!id || !tx_ref) {
    logger.error({ data: dataObj }, 'Flutterwave webhook — missing id or tx_ref')
    return c.json({ received: true }, 200)
  }

  logger.info({ event, txRef: tx_ref, flwId: id }, 'Flutterwave webhook received')

  if (event === 'charge.completed' && dataObj.status === 'successful') {
    try {
      await confirmFlutterwaveVote(tx_ref, id, AbortSignal.timeout(8000))
    } catch (err) {
      logger.error({ err, txRef: tx_ref, flwId: id }, 'Vote confirmation failed in webhook')
      return c.json({ received: true, error: 'processing_failed' }, 500)
    }
  } else if (event === 'charge.dispute.create' || event === 'charge.dispute.remind') {
    await handleDispute(tx_ref).catch((err) =>
      logger.error({ err, txRef: tx_ref }, 'Dispute handling failed')
    )
  } else {
    logger.info({ event, txRef: tx_ref }, 'Unhandled event type')
  }

  return c.json({ received: true }, 200)
})

export default router
