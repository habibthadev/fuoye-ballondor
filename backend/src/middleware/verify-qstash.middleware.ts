import { createMiddleware } from 'hono/factory'
import { receiver } from '../lib/qstash.js'

export const verifyQStash = createMiddleware<{ Variables: { qstashBody: string } }>(
  async (c, next) => {
    const signature = c.req.header('upstash-signature')
    if (!signature) {
      return c.json({ error: 'Missing signature' }, 401)
    }

    const body = await c.req.text()

    try {
      await receiver.verify({ signature, body, clockTolerance: 5 })
    } catch {
      return c.json({ error: 'Invalid signature' }, 401)
    }

    c.set('qstashBody', body)
    await next()
  }
)
