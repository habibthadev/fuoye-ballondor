import { createMiddleware } from 'hono/factory'
import { verify } from 'hono/jwt'
import { env } from '../config/env.js'
import type { AdminPayload } from '../types.js'

export const authMiddleware = createMiddleware(async (c, next) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const token = auth.slice(7)
  try {
    const payload = (await verify(token, env.JWT_ACCESS_SECRET, 'HS256')) as AdminPayload
    c.set('admin', payload)
    await next()
  } catch {
    return c.json({ error: 'Token expired or invalid' }, 401)
  }
})

export const superadminMiddleware = createMiddleware(async (c, next) => {
  const admin = c.get('admin')
  if (!admin || admin.role !== 'superadmin') {
    return c.json({ error: 'Superadmin access required' }, 403)
  }
  await next()
})

export const requireRole = (...roles: string[]) => createMiddleware(async (c, next) => {
  const admin = c.get('admin')
  if (!admin || !roles.includes(admin.role)) {
    return c.json({ error: 'Insufficient permissions' }, 403)
  }
  await next()
})
