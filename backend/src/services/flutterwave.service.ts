import { z } from 'zod'
import { env } from '../config/env.js'
import { AppError } from '../utils/errors.js'
import { logger } from '../config/pino.js'

const FLW_BASE_URL = 'https://api.flutterwave.com/v3'

const flwInitResponseSchema = z.object({
  status: z.literal('success'),
  message: z.string(),
  data: z.object({
    link: z.string().url(),
  }),
})

const flwVerifyResponseSchema = z.object({
  status: z.literal('success'),
  message: z.string(),
  data: z.object({
    id: z.number(),
    tx_ref: z.string(),
    flw_ref: z.string(),
    amount: z.number(),
    currency: z.string(),
    charged_amount: z.number(),
    status: z.string(),
    customer: z.object({
      email: z.string(),
      name: z.string().optional(),
    }),
  }),
})

interface InitParams {
  amount: number
  email: string
  name: string
  txRef: string
  meta: Record<string, unknown>
}

export async function initializePayment(params: InitParams) {
  const response = await fetch(`${FLW_BASE_URL}/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.FLW_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tx_ref: params.txRef,
      amount: params.amount,
      currency: 'NGN',
      redirect_url: `${env.FRONTEND_URL}/vote/success?tx_ref=${params.txRef}`,
      customer: {
        email: params.email,
        name: params.name,
      },
      meta: params.meta,
      customizations: {
        title: 'FUOYE Ballon D\'or',
        description: `Vote payment — ${params.meta.nomineeName ?? ''}`,
      },
    }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: 'Unknown error' }))
    logger.error({ status: response.status, body }, 'Flutterwave init failed')
    throw new AppError('Payment initialization failed', 502, 'FLW_INIT_FAILED')
  }

  const data = await response.json()
  const parsed = flwInitResponseSchema.safeParse(data)

  if (!parsed.success) {
    logger.error({ raw: data }, 'Flutterwave init unexpected response')
    throw new AppError('Payment initialization failed', 502, 'FLW_INIT_FAILED')
  }

  return parsed.data.data
}

export async function verifyTransaction(id: number, signal?: AbortSignal) {
  const response = await fetch(`${FLW_BASE_URL}/transactions/${id}/verify`, {
    headers: { Authorization: `Bearer ${env.FLW_SECRET_KEY}` },
    signal,
  })

  if (response.status >= 500) {
    logger.error({ status: response.status, txId: id }, 'Flutterwave verify — server error')
    return null
  }

  if (response.status === 404) {
    logger.warn({ txId: id }, 'Flutterwave verify — transaction not found')
    return null
  }

  if (!response.ok) {
    logger.error({ status: response.status, txId: id }, 'Flutterwave verify — unexpected status')
    return null
  }

  const data = await response.json()
  const parsed = flwVerifyResponseSchema.safeParse(data)

  if (!parsed.success) {
    logger.error({ raw: data, txId: id }, 'Flutterwave verify — unexpected shape')
    return null
  }

  return parsed.data.data
}
