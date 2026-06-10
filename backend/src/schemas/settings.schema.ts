import { z } from 'zod'

export const updateSettingsSchema = z.object({
  votingActive: z.boolean().optional(),
  flutterwaveEnabled: z.boolean().optional(),
})

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>
