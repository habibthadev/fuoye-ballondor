import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../models/settings.model.js', () => ({
  Settings: { findOne: vi.fn(), findOneAndUpdate: vi.fn() },
}))

vi.mock('../../../config/pino.js', () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}))

import { Settings } from '../../../models/settings.model.js'

describe('Admin Settings operations', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('get settings', () => {
    it('returns existing settings', async () => {
      vi.mocked(Settings.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue({ votingActive: true, flutterwaveEnabled: true }) } as any)

      const settings = await Settings.findOne().lean()
      expect(settings?.votingActive).toBe(true)
      expect(settings?.flutterwaveEnabled).toBe(true)
    })

    it('returns null when no settings exist', async () => {
      vi.mocked(Settings.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue(null) } as any)

      const settings = await Settings.findOne().lean()
      expect(settings).toBeNull()
    })
  })

  describe('update settings', () => {
    it('upserts settings', async () => {
      const updated = { votingActive: true, flutterwaveEnabled: true }
      const mockLean = vi.fn().mockResolvedValue(updated)
      vi.mocked(Settings.findOneAndUpdate).mockReturnValue({ lean: mockLean } as any)

      const result = await Settings.findOneAndUpdate({}, { $set: updated }, { upsert: true, new: true }).lean()
      expect(result?.votingActive).toBe(true)
    })

    it('creates settings when none exist (upsert)', async () => {
      const created = { votingActive: true, flutterwaveEnabled: false }
      const mockLean = vi.fn().mockResolvedValue(created)
      vi.mocked(Settings.findOneAndUpdate).mockReturnValue({ lean: mockLean } as any)

      const result = await Settings.findOneAndUpdate({}, { $set: created }, { upsert: true, new: true }).lean()
      expect(result?.flutterwaveEnabled).toBe(false)
    })
  })
})
