import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loginAdmin, refreshTokens, logoutAdmin, hashPassword } from '../auth.service.js'
import { AppError } from '../../utils/errors.js'

vi.mock('../../models/admin.model.js', () => ({
  Admin: {
    findOne: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findById: vi.fn(),
  },
}))

vi.mock('../../models/refresh-token.model.js', () => ({
  RefreshToken: {
    findOne: vi.fn(),
    create: vi.fn(),
    deleteOne: vi.fn(),
  },
}))

vi.mock('hono/jwt', () => ({
  sign: vi.fn().mockResolvedValue('mock-access-token'),
  verify: vi.fn(),
}))

vi.mock('@node-rs/argon2', () => ({
  hash: vi.fn().mockResolvedValue('hashed-password'),
  verify: vi.fn(),
}))

vi.mock('../../utils/crypto.js', () => ({
  hashToken: vi.fn((s: string) => `hashed-${s}`),
}))

vi.mock('../../config/env.js', () => ({
  env: {
    JWT_ACCESS_SECRET: 'test-secret-that-is-at-least-32-chars-long!!',
    NODE_ENV: 'test',
  },
}))

import { Admin } from '../../models/admin.model.js'
import { RefreshToken } from '../../models/refresh-token.model.js'
import { verify } from '@node-rs/argon2'

describe('loginAdmin', () => {
  beforeEach(() => vi.clearAllMocks())

  const mockAdmin = {
    _id: { toString: () => 'admin-id-123' },
    name: 'Test Admin',
    email: 'admin@fuoye.edu.ng',
    role: 'superadmin',
    isActive: true,
    passwordHash: 'hashed-password',
  }

  it('returns tokens and admin data on valid credentials', async () => {
    vi.mocked(Admin.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue(mockAdmin) } as any)
    vi.mocked(verify).mockResolvedValue(true)

    const result = await loginAdmin('admin@fuoye.edu.ng', 'correct-password')

    expect(result.accessToken).toBe('mock-access-token')
    expect(result.refreshToken).toBeDefined()
    expect(result.admin.email).toBe('admin@fuoye.edu.ng')
  })

  it('throws INVALID_CREDENTIALS for non-existent admin', async () => {
    vi.mocked(Admin.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue(null) } as any)

    await expect(loginAdmin('wrong@fuoye.edu.ng', 'password'))
      .rejects.toThrow(AppError)
    await expect(loginAdmin('wrong@fuoye.edu.ng', 'password'))
      .rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', statusCode: 401 })
  })

  it('throws INVALID_CREDENTIALS for inactive admin', async () => {
    vi.mocked(Admin.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue({ ...mockAdmin, isActive: false }) } as any)

    await expect(loginAdmin('admin@fuoye.edu.ng', 'password'))
      .rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' })
  })

  it('throws INVALID_CREDENTIALS for wrong password', async () => {
    vi.mocked(Admin.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue(mockAdmin) } as any)
    vi.mocked(verify).mockResolvedValue(false)

    await expect(loginAdmin('admin@fuoye.edu.ng', 'wrong-password'))
      .rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' })
  })
})

describe('refreshTokens', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws INVALID_REFRESH when token not found', async () => {
    vi.mocked(RefreshToken.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue(null) } as any)

    await expect(refreshTokens('invalid-token'))
      .rejects.toMatchObject({ code: 'INVALID_REFRESH', statusCode: 401 })
  })

  it('throws REFRESH_EXPIRED for expired token', async () => {
    const expired = {
      _id: { toString: () => 'tok-1' },
      adminId: 'admin-1',
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() - 86400000),
    }
    vi.mocked(RefreshToken.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue(expired) } as any)

    await expect(refreshTokens('expired-token'))
      .rejects.toMatchObject({ code: 'REFRESH_EXPIRED' })
  })

  it('deletes expired token from database', async () => {
    const expired = {
      _id: { toString: () => 'tok-1' },
      adminId: 'admin-1',
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() - 86400000),
    }
    vi.mocked(RefreshToken.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue(expired) } as any)

    await expect(refreshTokens('expired-token')).rejects.toThrow()
    expect(RefreshToken.deleteOne).toHaveBeenCalledWith({ _id: expired._id })
  })

  it('throws ACCOUNT_INACTIVE when admin is deactivated', async () => {
    const validToken = {
      _id: { toString: () => 'tok-1' },
      adminId: 'admin-1',
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 86400000),
    }
    vi.mocked(RefreshToken.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue(validToken) } as any)
    vi.mocked(Admin.findById).mockReturnValue({ lean: vi.fn().mockResolvedValue(null) } as any)

    await expect(refreshTokens('valid-token'))
      .rejects.toMatchObject({ code: 'ACCOUNT_INACTIVE' })
  })

  it('returns new tokens on success', async () => {
    const validToken = {
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
    vi.mocked(RefreshToken.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue(validToken) } as any)
    vi.mocked(Admin.findById).mockReturnValue({ lean: vi.fn().mockResolvedValue(admin) } as any)
    vi.mocked(RefreshToken.create).mockResolvedValue({} as any)

    const result = await refreshTokens('valid-token')

    expect(result.accessToken).toBe('mock-access-token')
    expect(result.refreshToken).toBeDefined()
    expect(result.admin.email).toBe('a@fuoye.edu.ng')
  })

  it('deletes old token and creates new one (rotation)', async () => {
    const validToken = {
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
    vi.mocked(RefreshToken.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue(validToken) } as any)
    vi.mocked(Admin.findById).mockReturnValue({ lean: vi.fn().mockResolvedValue(admin) } as any)
    vi.mocked(RefreshToken.create).mockResolvedValue({} as any)

    await refreshTokens('valid-token')

    expect(RefreshToken.deleteOne).toHaveBeenCalledWith({ _id: validToken._id })
    expect(RefreshToken.create).toHaveBeenCalled()
  })
})

describe('logoutAdmin', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes refresh token by hash', async () => {
    vi.mocked(RefreshToken.deleteOne).mockResolvedValue({ deletedCount: 1 } as any)

    await logoutAdmin('some-token')

    expect(RefreshToken.deleteOne).toHaveBeenCalledWith({ tokenHash: 'hashed-some-token' })
  })

  it('does not throw when token does not exist', async () => {
    vi.mocked(RefreshToken.deleteOne).mockResolvedValue({ deletedCount: 0 } as any)

    await expect(logoutAdmin('non-existent-token')).resolves.not.toThrow()
  })
})

describe('hashPassword', () => {
  it('returns a hashed string', async () => {
    const result = await hashPassword('my-password')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})
