import { z } from 'zod'

const objectIdRegex = /^[a-f\d]{24}$/i

export const initiateVoteSchema = z.object({
  nomineeId: z.string().regex(objectIdRegex, 'Invalid nominee ID'),
  quantity: z.number().int().min(1).max(100),
  voterName: z.string().min(2).max(100).trim(),
  voterEmail: z.string().email().trim().toLowerCase(),
  paymentMethod: z.enum(['flutterwave']),
})

export type InitiateVoteInput = z.infer<typeof initiateVoteSchema>


