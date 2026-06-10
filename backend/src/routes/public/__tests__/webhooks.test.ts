import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as voteService from '../../../services/vote.service.js'

vi.mock('../../../models/vote.model.js', () => ({
  Vote: { findOne: vi.fn(), findByIdAndUpdate: vi.fn(), findOneAndUpdate: vi.fn(), updateMany: vi.fn(), find: vi.fn() },
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

vi.mock('../../../models/admin.model.js', () => ({
  Admin: { findOne: vi.fn() },
}))

vi.mock('../../../services/flutterwave.service.js', () => ({
  initializePayment: vi.fn(),
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
  env: { FLW_SECRET_KEY: 'test', FLW_PUBLIC_KEY: 'test', FRONTEND_URL: 'http://test.com', NODE_ENV: 'test' },
}))

vi.mock('mongoose', () => {
  const mockSession = {
    withTransaction: vi.fn(async (fn: () => Promise<void>) => fn()),
    endSession: vi.fn(),
  }
  return {
    default: { startSession: vi.fn().mockResolvedValue(mockSession) },
  }
})

import { Vote } from '../../../models/vote.model.js'
import { Nominee } from '../../../models/nominee.model.js'
import { Category } from '../../../models/category.model.js'
import { verifyTransaction } from '../../../services/flutterwave.service.js'

describe('POST /webhooks/flutterwave route (vote confirmation)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('confirms vote for valid charge.completed webhook', async () => {
    const fakeVote = { _id: 'vote-1', nomineeId: 'nom-1', quantity: 2, totalCharged: 1022, totalAmount: 1000, voterEmail: 'a@b.com', voterName: 'Test' }
    vi.mocked(Vote.findOne).mockResolvedValue(fakeVote as any)
    vi.mocked(Vote.findOneAndUpdate).mockResolvedValue({ ...fakeVote, paymentStatus: 'processing', flwTxId: 12345 } as any)
    vi.mocked(verifyTransaction).mockResolvedValue({
      id: 12345,
      tx_ref: 'vote-1',
      amount: 1022,
      status: 'successful',
      currency: 'NGN',
      charged_amount: 1022,
      flw_ref: 'flw-abc',
      customer: { email: 'a@b.com', name: 'Test' },
    })
    vi.mocked(Nominee.findById).mockResolvedValue({ name: 'John', categoryId: 'cat-1' } as any)
    vi.mocked(Category.findById).mockResolvedValue({ name: 'Male' } as any)

    await expect(voteService.confirmFlutterwaveVote('vote-1', 12345)).resolves.not.toThrow()

    expect(Vote.findByIdAndUpdate).toHaveBeenCalledWith(
      'vote-1',
      expect.objectContaining({ paymentStatus: 'confirmed' }),
      expect.any(Object),
    )
  })

  it('handles failed transaction gracefully', async () => {
    vi.mocked(Vote.findOne).mockResolvedValue({ _id: 'vote-1', nomineeId: 'nom-1', quantity: 1 } as any)
    vi.mocked(Vote.findOneAndUpdate).mockResolvedValue({ _id: 'vote-1', paymentStatus: 'processing' } as any)
    vi.mocked(verifyTransaction).mockResolvedValue(null)

    await expect(voteService.confirmFlutterwaveVote('vote-1', 12345)).resolves.not.toThrow()
  })
})
