import { createMiddleware } from 'hono/factory'

const store = new Map<string, { count: number; resetTime: number }>()

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetTime) {
      store.delete(key)
    }
  }
}, 60_000)

interface RateLimitConfig {
  windowMs: number
  max: number
}

export function rateLimit(config: RateLimitConfig) {
  return createMiddleware(async (c, next) => {
    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      c.req.header('x-real-ip') ||
      'unknown'
    const path = c.req.path
    const key = `${ip}:${path}`
    const now = Date.now()

    const entry = store.get(key)

    if (entry && now < entry.resetTime) {
      if (entry.count >= config.max) {
        c.header('Retry-After', String(Math.ceil((entry.resetTime - now) / 1000)))
        return c.json({ error: 'Too many requests' }, 429)
      }
      entry.count++
    } else {
      store.set(key, { count: 1, resetTime: now + config.windowMs })
    }

    await next()
  })
}

export const voteInitiateLimit = rateLimit({ windowMs: 60_000, max: 10 })
export const loginLimit = rateLimit({ windowMs: 900_000, max: 5 })
export const generalPublicLimit = rateLimit({ windowMs: 60_000, max: 60 })
