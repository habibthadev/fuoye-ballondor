import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AppError, NotFoundError } from '../../utils/errors.js'

vi.mock('../../models/vote.model.js', () => ({
  Vote: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    create: vi.fn(),
    find: vi.fn(),
    updateMany: vi.fn(),
  },
}))

vi.mock('../../models/nominee.model.js', () => ({
  Nominee: {
    findOne: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}))

vi.mock('../../models/category.model.js', () => ({
  Category: { findById: vi.fn() },
}))

vi.mock('../../models/settings.model.js', () => ({
  Settings: { findOne: vi.fn() },
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

vi.mock('../../models/admin.model.js', () => ({
  Admin: { findOne: vi.fn() },
}))

vi.mock('../flutterwave.service.js', () => ({
  initializePayment: vi.fn().mockResolvedValue({ link: 'https://checkout.flw.com/pay/abc' }),
  verifyTransaction: vi.fn(),
}))

vi.mock('../email.service.js', () => ({
  voteReceivedEmail: vi.fn().mockResolvedValue(undefined),
  sendDisputeAlert: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../config/pino.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

vi.mock('../../config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    FLW_SECRET_KEY: 'test-secret',
    FLW_PUBLIC_KEY: 'test-flw-public-key',
    FRONTEND_URL: 'https://example.com',
  },
}))

import { Vote } from '../../models/vote.model.js'
import { Category } from '../../models/category.model.js'
import { Nominee } from '../../models/nominee.model.js'
import { Settings } from '../../models/settings.model.js'
import { Admin } from '../../models/admin.model.js'
import { initializePayment, verifyTransaction } from '../flutterwave.service.js'
import {
  initiateVote,
  confirmFlutterwaveVote,
  handleDispute,
  recordFlwReturn,
  reconcilePendingOrders,
  invalidateSettingsCache,
} from '../vote.service.js'

describe('invalidateSettingsCache', () => {
  it('clears the cached settings', () => {
    expect(() => invalidateSettingsCache()).not.toThrow()
  })
})

describe('initiateVote', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    invalidateSettingsCache()
  })

  const baseParams = {
    nomineeId: 'nom-1',
    quantity: 2,
    voterName: 'John',
    voterEmail: 'john@fuoye.edu.ng',
    ipAddress: '127.0.0.1',
  }

  it('throws SETTINGS_MISSING when no settings exist', async () => {
    vi.mocked(Settings.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue(null) } as any)

    await expect(initiateVote(baseParams))
      .rejects.toMatchObject({ code: 'SETTINGS_MISSING', statusCode: 500 })
  })

  it('throws VOTING_CLOSED when voting is not active', async () => {
    vi.mocked(Settings.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue({ votingActive: false, flutterwaveEnabled: true }) } as any)
    await expect(initiateVote(baseParams))
      .rejects.toMatchObject({ code: 'VOTING_CLOSED' })
  })

  it('throws FLW_DISABLED when flutterwave is off', async () => {
    vi.mocked(Settings.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue({ votingActive: true, flutterwaveEnabled: false }) } as any)
    await expect(initiateVote(baseParams))
      .rejects.toMatchObject({ code: 'FLW_DISABLED' })
  })

  it('throws NOMINEE_NOT_FOUND when nominee is missing or inactive', async () => {
    vi.mocked(Settings.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue({ votingActive: true, flutterwaveEnabled: true }) } as any)
    vi.mocked(Nominee.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue(null) } as any)

    await expect(initiateVote(baseParams))
      .rejects.toThrow(NotFoundError)
  })

  it('throws CATEGORY_MISSING when category not found', async () => {
    vi.mocked(Settings.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue({ votingActive: true, flutterwaveEnabled: true }) } as any)
    vi.mocked(Nominee.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: 'nom-1', name: 'John', categoryId: 'cat-1', isActive: true }) } as any)
    vi.mocked(Category.findById).mockReturnValue({ lean: vi.fn().mockResolvedValue(null) } as any)

    await expect(initiateVote(baseParams))
      .rejects.toMatchObject({ code: 'CATEGORY_MISSING' })
  })

  it('creates vote and initializes payment on success', async () => {
    vi.mocked(Settings.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue({ votingActive: true, flutterwaveEnabled: true }) } as any)
    vi.mocked(Nominee.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: 'nom-1', name: 'John Doe', categoryId: 'cat-1', isActive: true }) } as any)
    vi.mocked(Category.findById).mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: 'cat-1', name: 'Male', pricePerVote: 500 }) } as any)
    vi.mocked(Vote.create).mockResolvedValue({ _id: 'vote-generated-id' } as any)
    vi.mocked(initializePayment).mockResolvedValue({ link: 'https://checkout.flw.com/pay/vote-generated-id' })

    const result = await initiateVote(baseParams)

    expect(result.checkoutUrl).toBe('https://checkout.flw.com/pay/vote-generated-id')
    expect(result.txRef).toBe('vote-generated-id')
    expect(result.voteId).toBe('vote-generated-id')
    expect(result.publicKey).toBe('test-flw-public-key')
    expect(result.totalAmount).toBe(1000)
    expect(result.totalCharged).toBeGreaterThan(1000)

    expect(Vote.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nomineeId: 'nom-1',
        categoryId: 'cat-1',
        voterName: 'John',
        voterEmail: 'john@fuoye.edu.ng',
        quantity: 2,
        pricePerVote: 500,
        totalAmount: 1000,
        paymentMethod: 'flutterwave',
        paymentStatus: 'pending',
        ipAddress: '127.0.0.1',
      }),
    )
  })

  it('uses default pricePerVote of 200 when category has none', async () => {
    vi.mocked(Settings.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue({ votingActive: true, flutterwaveEnabled: true }) } as any)
    vi.mocked(Nominee.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: 'nom-1', name: 'John Doe', categoryId: 'cat-1', isActive: true }) } as any)
    vi.mocked(Category.findById).mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: 'cat-1', name: 'Male' }) } as any)
    vi.mocked(Vote.create).mockResolvedValue({ _id: 'vote-1' } as any)
    vi.mocked(initializePayment).mockResolvedValue({ link: 'https://checkout.flw.com/pay/abc' })

    const result = await initiateVote({ ...baseParams, quantity: 1 })

    expect(result.totalAmount).toBe(200)
  })
})

describe('confirmFlutterwaveVote', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns early when vote not found', async () => {
    vi.mocked(Vote.findOne).mockResolvedValue(null)

    await confirmFlutterwaveVote('bad-txRef', 12345)
    expect(Vote.findOneAndUpdate).not.toHaveBeenCalled()
  })

  it('marks vote as failed when verify returns null', async () => {
    vi.mocked(Vote.findOne).mockResolvedValue({ _id: 'vote-1', nomineeId: 'nom-1', quantity: 2 } as any)
    vi.mocked(Vote.findOneAndUpdate).mockResolvedValue({ _id: 'vote-1' } as any)
    vi.mocked(verifyTransaction).mockResolvedValue(null)

    await confirmFlutterwaveVote('vote-1', 12345)

    expect(Vote.findByIdAndUpdate).toHaveBeenCalledWith('vote-1', { paymentStatus: 'failed', flwTxId: 12345 })
  })

  it('confirms vote on successful verification and increments voteCount', async () => {
    const fakeVote = { _id: 'vote-1', nomineeId: 'nom-1', quantity: 2, totalCharged: 1022, totalAmount: 1000, voterEmail: 'john@fuoye.edu.ng', voterName: 'John' }
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
      customer: { email: 'john@fuoye.edu.ng', name: 'John' },
    })
    vi.mocked(Nominee.findById).mockResolvedValue({ name: 'John Doe', categoryId: 'cat-1' } as any)
    vi.mocked(Category.findById).mockResolvedValue({ name: 'Male' } as any)

    await confirmFlutterwaveVote('vote-1', 12345)

    expect(Vote.findByIdAndUpdate).toHaveBeenCalledWith(
      'vote-1',
      expect.objectContaining({ paymentStatus: 'confirmed' }),
      expect.any(Object),
    )
    expect(Nominee.findByIdAndUpdate).toHaveBeenCalledWith(
      'nom-1',
      { $inc: { voteCount: 2 } },
      expect.any(Object),
    )
  })

  it('handles duplicate webhook gracefully (returns early when vote already processing)', async () => {
    vi.mocked(Vote.findOne).mockResolvedValue({ _id: 'vote-1', paymentStatus: 'pending' } as any)
    vi.mocked(Vote.findOneAndUpdate).mockResolvedValue(null)

    await confirmFlutterwaveVote('vote-1', 12345)
    expect(Vote.findByIdAndUpdate).not.toHaveBeenCalled()
  })
})

describe('handleDispute', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns early when vote not found or not confirmed', async () => {
    vi.mocked(Vote.findOneAndUpdate).mockResolvedValue(null)

    await handleDispute('tx-ref')

    expect(Nominee.findByIdAndUpdate).not.toHaveBeenCalled()
  })

  it('reverses vote count and sends alert to superadmin', async () => {
    vi.mocked(Vote.findOneAndUpdate).mockResolvedValue({
      _id: 'vote-1',
      nomineeId: 'nom-1',
      quantity: 3,
      totalAmount: 1500,
      voterName: 'John',
    } as any)
    vi.mocked(Admin.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue({ email: 'admin@fuoye.edu.ng' }) } as any)

    await handleDispute('tx-ref')

    expect(Nominee.findByIdAndUpdate).toHaveBeenCalledWith('nom-1', { $inc: { voteCount: -3 } })
    expect(Vote.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'tx-ref', paymentStatus: 'confirmed' },
      { $set: { paymentStatus: 'disputed' } },
      { new: true },
    )
  })
})

describe('recordFlwReturn', () => {
  beforeEach(() => vi.clearAllMocks())

  it('skips when vote not found or already processed', async () => {
    vi.mocked(Vote.findOneAndUpdate).mockResolvedValue(null)

    await recordFlwReturn('tx-ref', 12345)

    expect(Vote.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'tx-ref', paymentStatus: 'pending' },
      { $set: { flwTxId: 12345 } },
      { new: true },
    )
  })

  it('calls confirmFlutterwaveVote when vote is found', async () => {
    vi.mocked(Vote.findOneAndUpdate).mockResolvedValue({ _id: 'vote-1' } as any)

    await recordFlwReturn('tx-ref', 12345)

    expect(Vote.findOneAndUpdate).toHaveBeenCalled()
  })
})

describe('reconcilePendingOrders', () => {
  beforeEach(() => vi.clearAllMocks())

  it('processes reconciliation without errors', async () => {
    vi.mocked(Vote.updateMany).mockResolvedValue({ modifiedCount: 0 } as any)
    vi.mocked(Vote.find).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) } as any)

    await expect(reconcilePendingOrders()).resolves.not.toThrow()
  })
})
