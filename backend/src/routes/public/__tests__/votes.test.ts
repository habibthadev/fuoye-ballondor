import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as voteService from '../../../services/vote.service.js'

vi.mock('../../../models/vote.model.js', () => ({
  Vote: { findOne: vi.fn(), create: vi.fn(), findByIdAndUpdate: vi.fn(), findOneAndUpdate: vi.fn(), updateMany: vi.fn(), find: vi.fn() },
}))

vi.mock('../../../models/nominee.model.js', () => ({
  Nominee: { findOne: vi.fn(), findById: vi.fn(), findByIdAndUpdate: vi.fn() },
}))

vi.mock('../../../models/category.model.js', () => ({
  Category: { findById: vi.fn() },
}))

vi.mock('../../../models/settings.model.js', () => ({
  Settings: { findOne: vi.fn() },
}))

vi.mock('../../../services/flutterwave.service.js', () => ({
  initializePayment: vi.fn().mockResolvedValue({ link: 'https://checkout.flw.com/pay/abc' }),
  verifyTransaction: vi.fn(),
}))

vi.mock('../../../services/email.service.js', () => ({
  voteReceivedEmail: vi.fn().mockResolvedValue(undefined),
  sendDisputeAlert: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../../config/pino.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

vi.mock('../../../config/env.js', () => ({
  env: { FLW_PUBLIC_KEY: 'test-key', FLW_SECRET_KEY: 'test-secret', FRONTEND_URL: 'http://test.com', NODE_ENV: 'test' },
}))

import { Settings } from '../../../models/settings.model.js'
import { Nominee } from '../../../models/nominee.model.js'
import { Category } from '../../../models/category.model.js'
import { Vote } from '../../../models/vote.model.js'
import { initializePayment } from '../../../services/flutterwave.service.js'

describe('POST /votes/initiate route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    voteService.invalidateSettingsCache()
  })

  it('returns checkoutUrl for valid initiate request', async () => {
    vi.mocked(Settings.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue({ votingActive: true, flutterwaveEnabled: true }) } as any)
    vi.mocked(Nominee.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: 'nom-1', name: 'John', categoryId: 'cat-1', isActive: true }) } as any)
    vi.mocked(Category.findById).mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: 'cat-1', name: 'Male', pricePerVote: 500 }) } as any)
    vi.mocked(Vote.create).mockResolvedValue({ _id: 'vote-1' } as any)
    vi.mocked(initializePayment).mockResolvedValue({ link: 'https://checkout.flw.com/pay/abc' })

    const result = await voteService.initiateVote({
      nomineeId: 'nom-1',
      quantity: 1,
      voterName: 'Test',
      voterEmail: 'test@fuoye.edu.ng',
      ipAddress: '127.0.0.1',
    })

    expect(result.checkoutUrl).toBe('https://checkout.flw.com/pay/abc')
    expect(result.voteId).toBe('vote-1')
    expect(result.txRef).toBe('vote-1')
  })

  it('throws when voting is closed', async () => {
    vi.mocked(Settings.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue({ votingActive: false, flutterwaveEnabled: true }) } as any)

    await expect(voteService.initiateVote({
      nomineeId: 'nom-1',
      quantity: 1,
      voterName: 'Test',
      voterEmail: 't@t.com',
      ipAddress: '1.1.1.1',
    })).rejects.toMatchObject({ code: 'VOTING_CLOSED' })
  })
})
