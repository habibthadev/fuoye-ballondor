import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { initiateVoteSchema } from '../../schemas/vote.schema.js'
import { validate } from '../../middleware/validate.middleware.js'
import { voteInitiateLimit, rateLimit } from '../../middleware/rate-limit.middleware.js'

const returnLimit = rateLimit({ windowMs: 60_000, max: 20 })
import * as voteService from '../../services/vote.service.js'
import { Vote } from '../../models/vote.model.js'
import type { AppEnv } from '../../types.js'

const router = new Hono<AppEnv>()

router.post('/initiate', voteInitiateLimit, validate(initiateVoteSchema), async (c) => {
  const data = c.get('validatedData') as {
    nomineeId: string
    quantity: number
    voterName: string
    voterEmail: string
  }

  const ip =
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    'unknown'

  const result = await voteService.initiateVote({
    ...data,
    ipAddress: ip,
  })

  return c.json({ data: result })
})

router.post('/record-return', returnLimit, async (c) => {
  const body = await c.req.json()
  const parsed = z.object({
    tx_ref: z.string(),
    transaction_id: z.number(),
  }).safeParse(body)

  if (!parsed.success) {
    return c.json({ error: 'Invalid payload' }, 400)
  }

  await voteService.recordFlwReturn(parsed.data.tx_ref, parsed.data.transaction_id)
  return c.json({ received: true })
})

router.get('/:voteId/status', async (c) => {
  const voteId = c.req.param('voteId')
  const vote = await Vote.findById(voteId)
    .select('paymentStatus nomineeId')
    .populate({ path: 'nomineeId', select: 'name categoryId', populate: { path: 'categoryId', select: 'name slug' } })
    .lean()
  if (!vote) {
    return c.json({ error: 'Vote not found' }, 404)
  }
  return c.json({ data: vote })
})

export default router
