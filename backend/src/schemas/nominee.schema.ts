import { z } from 'zod'

const objectIdRegex = /^[a-f\d]{24}$/i

export const createNomineeSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  department: z.string().min(1).max(100).trim(),
  faculty: z.string().min(1).max(100).trim(),
  position: z.string().min(1).max(50).trim(),
  categoryId: z.string().regex(objectIdRegex, 'Invalid category ID'),
})

export type CreateNomineeInput = z.infer<typeof createNomineeSchema>

export const updateNomineeSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  department: z.string().min(1).max(100).trim().optional(),
  faculty: z.string().min(1).max(100).trim().optional(),
  position: z.string().min(1).max(50).trim().optional(),
  categoryId: z.string().regex(objectIdRegex, 'Invalid category ID').optional(),
  isActive: z.boolean().optional(),
})

export type UpdateNomineeInput = z.infer<typeof updateNomineeSchema>

export const transferNomineeSchema = z.object({
  targetCategoryId: z.string().regex(objectIdRegex, 'Invalid category ID'),
})

export type TransferNomineeInput = z.infer<typeof transferNomineeSchema>
