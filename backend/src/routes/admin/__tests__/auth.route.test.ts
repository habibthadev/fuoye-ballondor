import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loginAdmin, refreshTokens, logoutAdmin } from '../../../services/auth.service.js'

vi.mock('../../../models/admin.model.js', () => ({
  Admin: { findOne: vi.fn(), findByIdAndUpdate: vi.fn(), findById: vi.fn() },
}))

vi.mock('../../../models/refresh-token.model.js', () => ({
  RefreshToken: { findOne: vi.fn(), create: vi.fn(), deleteOne: vi.fn() },
}))

vi.mock('hono/jwt', () => ({
  sign: vi.fn().mockResolvedValue('mock-access-token'),
  verify: vi.fn(),
}))

vi.mock('@node-rs/argon2', () => ({
  hash: vi.fn().mockResolvedValue('hashed'),
  verify: vi.fn(),
}))

vi.mock('../../../utils/crypto.js', () => ({
  hashToken: vi.fn((s: string) => `hashed-${s}`),
}))

vi.mock('../../../config/env.js', () => ({
  env: { JWT_ACCESS_SECRET: 'test-secret-that-is-at-least-32-chars-long!!', NODE_ENV: 'test' },
}))

vi.mock('../../../config/pino.js', () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}))

import { Admin } from '../../../models/admin.model.js'
import { RefreshToken } from '../../../models/refresh-token.model.js'
import { verify } from '@node-rs/argon2'

describe('loginAdmin route logic', () => {
  beforeEach(() => vi.clearAllMocks())

  const mockAdmin = {
    _id: { toString: () => 'admin-id' },
    name: 'Admin',
    email: 'admin@fuoye.edu.ng',
    role: 'superadmin',
    isActive: true,
    passwordHash: 'hashed',
  }

  it('calls loginAdmin and returns tokens', async () => {
    vi.mocked(Admin.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue(mockAdmin) } as any)
    vi.mocked(verify).mockResolvedValue(true)

    const result = await loginAdmin('admin@fuoye.edu.ng', 'correct-password')

    expect(result.accessToken).toBe('mock-access-token')
    expect(result.refreshToken).toBeDefined()
    expect(result.admin.role).toBe('superadmin')
  })

  it('throws for invalid credentials', async () => {
    vi.mocked(Admin.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue(null) } as any)

    await expect(loginAdmin('bad@email.com', 'wrong'))
      .rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', statusCode: 401 })
  })
})

describe('refreshTokens route logic', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns new tokens for valid refresh token', async () => {
    const tokenDoc = {
      _id: { toString: () => 'tok-1' },
      adminId: 'admin-1',
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 86400000),
    }
    const admin = {
      _id: { toString: () => 'admin-1' },
      name: 'Admin',
      email: 'a@fuoye.edu.ng',
      role: 'admin',
      isActive: true,
    }
    vi.mocked(RefreshToken.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue(tokenDoc) } as any)
    vi.mocked(Admin.findById).mockReturnValue({ lean: vi.fn().mockResolvedValue(admin) } as any)
    vi.mocked(RefreshToken.create).mockResolvedValue({} as any)

    const result = await refreshTokens('valid-refresh-token')

    expect(result.accessToken).toBeDefined()
    expect(result.refreshToken).toBeDefined()
    expect(result.admin.email).toBe('a@fuoye.edu.ng')
  })

  it('throws for invalid refresh token', async () => {
    vi.mocked(RefreshToken.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue(null) } as any)

    await expect(refreshTokens('bad-token'))
      .rejects.toMatchObject({ code: 'INVALID_REFRESH', statusCode: 401 })
  })
})

describe('logoutAdmin route logic', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes the refresh token', async () => {
    vi.mocked(RefreshToken.deleteOne).mockResolvedValue({ deletedCount: 1 } as any)

    await logoutAdmin('some-token')

    expect(RefreshToken.deleteOne).toHaveBeenCalled()
  })

  it('does not throw when token does not exist', async () => {
    vi.mocked(RefreshToken.deleteOne).mockResolvedValue({ deletedCount: 0 } as any)

    await expect(logoutAdmin('non-existent')).resolves.not.toThrow()
  })
})
