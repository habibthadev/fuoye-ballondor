import { createMiddleware } from 'hono/factory'
import { env } from '../config/env.js'
import { receiver } from '../lib/qstash.js'

export const verifyQStash = createMiddleware<{ Variables: { qstashBody: string } }>(
  async (c, next) => {
    if (env.NODE_ENV !== 'production' && c.req.header('x-dev-bypass') === '1') {
      c.set('qstashBody', await c.req.text())
      await next()
      return
    }

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
