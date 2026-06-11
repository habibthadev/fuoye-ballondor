import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(1),
})

export type LoginInput = z.infer<typeof loginSchema>

export const createAdminSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(12).max(128),
  role: z.enum(['admin', 'superadmin', 'moderator']).default('admin'),
})

export type CreateAdminInput = z.infer<typeof createAdminSchema>

export const updateAdminRoleSchema = z.object({
  role: z.enum(['admin', 'superadmin', 'moderator']),
})

export type UpdateAdminRoleInput = z.infer<typeof updateAdminRoleSchema>
