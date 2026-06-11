import { describe, it, expect, vi, beforeEach } from 'vitest'
import { initializePayment, verifyTransaction } from '../flutterwave.service.js'
import { AppError } from '../../utils/errors.js'

vi.mock('../../config/env.js', () => ({
  env: {
    FLW_SECRET_KEY: 'test-flw-secret',
    FLW_PUBLIC_KEY: 'test-flw-public',
    FRONTEND_URL: 'https://example.com',
  },
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('initializePayment', () => {
  beforeEach(() => vi.clearAllMocks())

  const params = {
    amount: 5000,
    email: 'voter@fuoye.edu.ng',
    name: 'Test Voter',
    txRef: 'vote-id-123',
    meta: { nomineeName: 'John Doe', voteId: 'vote-id-123' },
  }

  it('returns payment link on successful initialization', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        status: 'success',
        message: 'Payment initiated',
        data: { link: 'https://checkout.flutterwave.com/pay/abc123' },
      }),
    })

    const result = await initializePayment(params)

    expect(result.link).toBe('https://checkout.flutterwave.com/pay/abc123')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.flutterwave.com/v3/payments',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-flw-secret',
        }),
      }),
    )
  })

  it('includes redirect_url with tx_ref', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        status: 'success',
        message: 'Payment initiated',
        data: { link: 'https://checkout.flutterwave.com/pay/abc' },
      }),
    })

    await initializePayment(params)

    const callBody = JSON.parse(mockFetch.mock.calls[0]![1]!.body as string)
    expect(callBody.redirect_url).toContain(params.txRef)
    expect(callBody.tx_ref).toBe(params.txRef)
  })

  it('throws FLW_INIT_FAILED on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: vi.fn().mockResolvedValue({ message: 'Bad gateway' }),
    })

    await expect(initializePayment(params))
      .rejects.toMatchObject({ code: 'FLW_INIT_FAILED', statusCode: 502 })
  })

  it('throws FLW_INIT_FAILED on unexpected response shape', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        status: 'error',
        message: 'Something went wrong',
      }),
    })

    await expect(initializePayment(params))
      .rejects.toMatchObject({ code: 'FLW_INIT_FAILED' })
  })

  it('throws on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'))

    await expect(initializePayment(params)).rejects.toThrow()
  })

  it('uses nominee name in customization', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        status: 'success',
        message: 'OK',
        data: { link: 'https://checkout.flutterwave.com/pay/abc' },
      }),
    })

    await initializePayment(params)

    const callBody = JSON.parse(mockFetch.mock.calls[0]![1]!.body as string)
    expect(callBody.customizations.description).toContain('John Doe')
  })
})

describe('verifyTransaction', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns verified transaction data on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        status: 'success',
        message: 'Transaction verified',
        data: {
          id: 123456,
          tx_ref: 'vote-id-123',
          flw_ref: 'flw-abc',
          amount: 5000,
          currency: 'NGN',
          charged_amount: 5110,
          status: 'successful',
          customer: { email: 'voter@fuoye.edu.ng', name: 'Test Voter' },
        },
      }),
    })

    const result = await verifyTransaction(123456)

    expect(result).not.toBeNull()
    expect(result!.tx_ref).toBe('vote-id-123')
    expect(result!.status).toBe('successful')
    expect(result!.amount).toBe(5000)
  })

  it('returns null on 500 error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: vi.fn(),
    })

    const result = await verifyTransaction(123456)
    expect(result).toBeNull()
  })

  it('returns null on 404', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: vi.fn(),
    })

    const result = await verifyTransaction(123456)
    expect(result).toBeNull()
  })

  it('returns null on unexpected status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: vi.fn(),
    })

    const result = await verifyTransaction(123456)
    expect(result).toBeNull()
  })

  it('returns null on unexpected response shape', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        status: 'success',
        data: { id: 123456, tx_ref: 'ref' },
      }),
    })

    const result = await verifyTransaction(123456)
    expect(result).toBeNull()
  })

  it('passes abort signal when provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        status: 'success',
        message: 'OK',
        data: {
          id: 1, tx_ref: 'r', flw_ref: 'f',
          amount: 100, currency: 'NGN', charged_amount: 102,
          status: 'successful',
          customer: { email: 'a@b.com' },
        },
      }),
    })

    const signal = AbortSignal.timeout(5000)
    await verifyTransaction(123456, signal)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal }),
    )
  })
})
