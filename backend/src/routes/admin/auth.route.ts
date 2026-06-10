import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { loginSchema } from '../../schemas/auth.schema.js'
import { validate } from '../../middleware/validate.middleware.js'
import { loginLimit, rateLimit } from '../../middleware/rate-limit.middleware.js'

const refreshLimit = rateLimit({ windowMs: 60_000, max: 10 })
import * as authService from '../../services/auth.service.js'
import { env } from '../../config/env.js'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import type { AppEnv } from '../../types.js'

const router = new Hono<AppEnv>()

router.post('/login', loginLimit, validate(loginSchema), async (c) => {
  const { email, password } = c.get('validatedData') as { email: string; password: string }

  const result = await authService.loginAdmin(email, password)

  setCookie(c, 'refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    path: '/api/admin/auth',
    maxAge: 7 * 24 * 60 * 60,
  })

  return c.json({
    accessToken: result.accessToken,
    admin: result.admin,
  })
})

router.post('/refresh', refreshLimit, async (c) => {
  const refreshToken = getCookie(c, 'refreshToken')
  if (!refreshToken) {
    return c.json({ error: 'Refresh token not found' }, 401)
  }

  const result = await authService.refreshTokens(refreshToken)

  setCookie(c, 'refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    path: '/api/admin/auth',
    maxAge: 7 * 24 * 60 * 60,
  })

  return c.json({
    accessToken: result.accessToken,
    admin: result.admin,
  })
})

router.post('/logout', authMiddleware, async (c) => {
  const refreshToken = getCookie(c, 'refreshToken')
  if (refreshToken) {
    await authService.logoutAdmin(refreshToken)
  }
  deleteCookie(c, 'refreshToken', { path: '/api/admin/auth' })
  return c.json({ message: 'Logged out' })
})

export default router
