import { sign, verify } from 'hono/jwt'
import { randomBytes } from 'crypto'
import { hashToken } from '../utils/crypto.js'
import { Admin, type IAdmin } from '../models/admin.model.js'
import { RefreshToken } from '../models/refresh-token.model.js'
import { env } from '../config/env.js'
import { AppError } from '../utils/errors.js'
import { hash, verify as verifyArgon } from '@node-rs/argon2'

const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY_DAYS = 7

export async function loginAdmin(email: string, password: string) {
  const admin = await Admin.findOne({ email }).lean()
  if (!admin || !admin.isActive) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS')
  }

  const valid = await verifyArgon(admin.passwordHash, password)
  if (!valid) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS')
  }

  await Admin.findByIdAndUpdate(admin._id, { lastLoginAt: new Date() })

  const accessToken = await generateAccessToken(admin._id.toString(), admin.role)
  const { refreshToken } = await generateRefreshToken(admin._id.toString())

  return { accessToken, refreshToken, admin: { id: admin._id.toString(), name: admin.name, email: admin.email, role: admin.role } }
}

export async function refreshTokens(refreshTokenRaw: string) {
  const hashed = hashToken(refreshTokenRaw)
  const tokenDoc = await RefreshToken.findOne({ tokenHash: hashed }).lean()
  if (!tokenDoc) {
    throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH')
  }

  if (new Date(tokenDoc.expiresAt) < new Date()) {
    await RefreshToken.deleteOne({ _id: tokenDoc._id })
    throw new AppError('Refresh token expired', 401, 'REFRESH_EXPIRED')
  }

  const admin = await Admin.findById(tokenDoc.adminId).lean()
  if (!admin || !admin.isActive) {
    await RefreshToken.deleteOne({ _id: tokenDoc._id })
    throw new AppError('Admin account inactive', 401, 'ACCOUNT_INACTIVE')
  }

  await RefreshToken.deleteOne({ _id: tokenDoc._id })

  const accessToken = await generateAccessToken(admin._id.toString(), admin.role)
  const newRefresh = await generateRefreshToken(admin._id.toString())

  return {
    accessToken,
    refreshToken: newRefresh.refreshToken,
    admin: { id: admin._id.toString(), name: admin.name, email: admin.email, role: admin.role },
  }
}

export async function logoutAdmin(refreshTokenRaw: string) {
  const hashed = hashToken(refreshTokenRaw)
  await RefreshToken.deleteOne({ tokenHash: hashed })
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  })
}

async function generateAccessToken(adminId: string, role: IAdmin['role']): Promise<string> {
  return sign(
    {
      sub: adminId,
      role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15 * 60,
    },
    env.JWT_ACCESS_SECRET
  )
}

async function generateRefreshToken(adminId: string) {
  const raw = randomBytes(64).toString('hex')
  const hashed = hashToken(raw)
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

  await RefreshToken.create({
    adminId,
    tokenHash: hashed,
    expiresAt,
  })

  return { refreshToken: raw, hashedToken: hashed }
}
