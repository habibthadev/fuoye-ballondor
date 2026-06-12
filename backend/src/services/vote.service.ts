import mongoose from 'mongoose'
import { Vote } from '../models/vote.model.js'
import { Nominee } from '../models/nominee.model.js'
import { Settings } from '../models/settings.model.js'
import { Category } from '../models/category.model.js'
import { Admin } from '../models/admin.model.js'
import { env } from '../config/env.js'
import { AppError, NotFoundError } from '../utils/errors.js'
import { calculateFees } from '../utils/fees.js'
import * as flwService from './flutterwave.service.js'
import * as emailService from './email.service.js'
import * as cloudinaryService from './cloudinary.service.js'
import { logger } from '../config/pino.js'

let cachedSettings: { votingActive: boolean; flutterwaveEnabled: boolean } | null = null
let settingsCacheTime = 0
const SETTINGS_CACHE_TTL = 10_000

async function getCachedSettings() {
  const now = Date.now()
  if (cachedSettings && now - settingsCacheTime < SETTINGS_CACHE_TTL) {
    return cachedSettings
  }
  const settings = await Settings.findOne().lean()
  if (!settings) {
    throw new AppError('System not configured', 500, 'SETTINGS_MISSING')
  }
  cachedSettings = { votingActive: settings.votingActive, flutterwaveEnabled: settings.flutterwaveEnabled }
  settingsCacheTime = now
  return cachedSettings
}

export function invalidateSettingsCache() {
  cachedSettings = null
  settingsCacheTime = 0
}

export async function initiateVote(params: {
  nomineeId: string
  quantity: number
  voterName: string
  voterEmail: string
  ipAddress: string
}) {
  const settings = await getCachedSettings()
  if (!settings) {
    throw new AppError('System not configured', 500, 'SETTINGS_MISSING')
  }

  if (!settings.votingActive) {
    throw new AppError('Voting is currently closed', 403, 'VOTING_CLOSED')
  }

  if (!settings.flutterwaveEnabled) {
    throw new AppError('Online payment is currently unavailable', 400, 'FLW_DISABLED')
  }

  const nominee = await Nominee.findOne({ _id: params.nomineeId, isActive: true }).lean()
  if (!nominee) {
    throw new NotFoundError('Nominee')
  }

  const category = await Category.findById(nominee.categoryId).lean()
  if (!category) {
    throw new AppError('Category not found', 500, 'CATEGORY_MISSING')
  }

  const pricePerVote = category.pricePerVote ?? 200
  const totalAmount = params.quantity * pricePerVote
  const { fee, vatOnFee, totalCharged } = calculateFees(totalAmount)

  const vote = await Vote.create({
    nomineeId: nominee._id,
    categoryId: nominee.categoryId,
    voterName: params.voterName,
    voterEmail: params.voterEmail,
    quantity: params.quantity,
    pricePerVote,
    totalAmount,
    fee,
    vatOnFee,
    totalCharged,
    paymentMethod: 'flutterwave',
    paymentStatus: 'pending',
    ipAddress: params.ipAddress,
  })

  logger.info(
    { voteId: vote._id, quantity: params.quantity, totalAmount, fee, vatOnFee, totalCharged, nomineeId: params.nomineeId },
    'Vote initiated'
  )

  const payment = await flwService.initializePayment({
    amount: totalCharged,
    email: params.voterEmail,
    name: params.voterName,
    txRef: vote._id.toString(),
    meta: {
      voteId: vote._id.toString(),
      nomineeId: nominee._id.toString(),
      nomineeName: nominee.name,
      quantity: params.quantity,
    },
  })

  return {
    checkoutUrl: payment.link,
    txRef: vote._id.toString(),
    voteId: vote._id.toString(),
    publicKey: env.FLW_PUBLIC_KEY,
    amount: totalCharged,
    fee,
    vatOnFee,
    totalCharged,
    totalAmount,
  }
}

export async function confirmFlutterwaveVote(txRef: string, flwTxId: number, signal?: AbortSignal) {
  const vote = await Vote.findOne({ _id: txRef })
  if (!vote) {
    logger.warn({ txRef }, 'Vote not found for Flutterwave tx_ref')
    return
  }

  const updated = await Vote.findOneAndUpdate(
    { _id: vote._id, paymentStatus: 'pending' },
    { $set: { paymentStatus: 'processing', flwTxId } },
    { new: true }
  )

  if (!updated) {
    logger.info({ voteId: vote._id }, 'Duplicate webhook or already processed — skipping')
    return
  }

  const verified = await flwService.verifyTransaction(flwTxId, signal)
  if (!verified) {
    await Vote.findByIdAndUpdate(vote._id, { paymentStatus: 'failed', flwTxId })
    logger.warn({ txRef, flwTxId }, 'Flutterwave verify failed — vote failed')
    return
  }

  const expected = vote.totalCharged || vote.totalAmount
  const isValid =
    verified.status === 'successful' &&
    verified.tx_ref === txRef &&
    verified.currency === 'NGN' &&
    verified.amount === expected

  if (!isValid) {
    await Vote.findByIdAndUpdate(vote._id, {
      paymentStatus: 'failed',
      flwTxId,
    })
    logger.warn({ txRef, flwTxId, verifiedStatus: verified.status, verifiedAmount: verified.amount, expected }, 'Flutterwave verification validation failed')
    return
  }

  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      await Vote.findByIdAndUpdate(
        vote._id,
        { paymentStatus: 'confirmed', confirmedAt: new Date(), flwTxId },
        { session }
      )

      await Nominee.findByIdAndUpdate(
        vote.nomineeId,
        { $inc: { voteCount: vote.quantity } },
        { session }
      )
    })

    const nominee = await Nominee.findById(vote.nomineeId).lean()
    const category = nominee ? await Category.findById(nominee.categoryId).lean() : null

    emailService.voteReceivedEmail(
      vote.voterEmail,
      vote.voterName,
      nominee?.name ?? '',
      category?.name ?? '',
      vote.quantity,
      vote.totalAmount,
      txRef
    ).catch((err) => logger.error({ err, to: vote.voterEmail }, 'Vote confirmation email failed'))

    logger.info({ voteId: vote._id, flwTxId, nomineeId: vote.nomineeId, quantity: vote.quantity }, 'Vote confirmed via Flutterwave')
  } catch (err) {
    await Vote.findByIdAndUpdate(vote._id, { paymentStatus: 'pending' })
    logger.error({ err, voteId: vote._id }, 'Vote confirmation transaction failed — reverted')
  } finally {
    session.endSession()
  }
}

export async function handleDispute(txRef: string) {
  const vote = await Vote.findOneAndUpdate(
    { _id: txRef, paymentStatus: 'confirmed' },
    { $set: { paymentStatus: 'disputed' } },
    { new: true }
  )

  if (!vote) {
    logger.warn({ txRef }, 'Dispute received but vote not found or not confirmed')
    return
  }

  await Nominee.findByIdAndUpdate(
    vote.nomineeId,
    { $inc: { voteCount: -vote.quantity } }
  )

  const superadmin = await Admin.findOne({ role: 'superadmin', isActive: true }).lean()
  if (superadmin) {
    emailService.sendDisputeAlert(superadmin.email, {
      voteId: vote._id.toString(),
      txRef,
      amount: vote.totalAmount,
      nomineeId: vote.nomineeId.toString(),
      voterName: vote.voterName,
    }).catch((err) => logger.error({ err, to: superadmin.email }, 'Dispute alert email failed'))
  }

  logger.warn({ voteId: vote._id, txRef }, 'Vote disputed and reversed')
}



export async function recordFlwReturn(txRef: string, flwTxId: number) {
  const vote = await Vote.findOneAndUpdate(
    { _id: txRef, paymentStatus: 'pending' },
    { $set: { flwTxId } },
    { new: true }
  )

  if (!vote) {
    logger.info({ txRef, flwTxId }, 'recordFlwReturn — vote not found or already processed')
    return
  }

  await confirmFlutterwaveVote(txRef, flwTxId).catch((err) => {
    logger.error({ err, txRef, flwTxId }, 'recordFlwReturn — immediate verify failed, fallback to webhook/reconciliation')
  })
}

export async function reconcilePendingOrders() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)

  const abandoned = await Vote.updateMany(
    {
      paymentMethod: 'flutterwave',
      paymentStatus: 'pending',
      flwTxId: { $eq: null },
      createdAt: { $lt: twoHoursAgo },
    },
    { $set: { paymentStatus: 'failed' } }
  )
  if (abandoned.modifiedCount) {
    logger.info({ count: abandoned.modifiedCount }, 'Abandoned votes marked as failed')
  }

  const stuckPending = await Vote.find({
    paymentMethod: 'flutterwave',
    paymentStatus: 'pending',
    createdAt: { $lt: fiveMinutesAgo },
    flwTxId: { $ne: null },
  }).lean()

  for (const order of stuckPending) {
    const claimed = await Vote.findOneAndUpdate(
      { _id: order._id, paymentStatus: 'pending' },
      { $set: { paymentStatus: 'processing' } },
      { new: true }
    )
    if (!claimed || !claimed.flwTxId) continue

    const verified = await flwService.verifyTransaction(claimed.flwTxId)
    if (!verified) {
      await Vote.findByIdAndUpdate(order._id, { paymentStatus: 'failed' })
      continue
    }

    const allowed = order.totalCharged || order.totalAmount
  const isValid =
      verified.status === 'successful' &&
      verified.currency === 'NGN' &&
      verified.amount === allowed

    if (!isValid) {
      await Vote.findByIdAndUpdate(order._id, { paymentStatus: 'failed' })
      continue
    }

    const session = await mongoose.startSession()
    try {
      await session.withTransaction(async () => {
        await Vote.findByIdAndUpdate(order._id, { paymentStatus: 'confirmed', confirmedAt: new Date() }, { session })
        await Nominee.findByIdAndUpdate(order.nomineeId, { $inc: { voteCount: order.quantity } }, { session })
      })
      logger.info({ voteId: order._id }, 'Vote reconciled successfully')
    } catch {
      await Vote.findByIdAndUpdate(order._id, { paymentStatus: 'pending' })
    } finally {
      session.endSession()
    }
  }

  const stuckProcessing = await Vote.find({
    paymentMethod: 'flutterwave',
    paymentStatus: 'processing',
    flwTxId: { $ne: null },
    createdAt: { $lt: fiveMinutesAgo },
  }).lean()

  for (const order of stuckProcessing) {
    if (!order.flwTxId) continue

    const verified = await flwService.verifyTransaction(order.flwTxId)
    if (!verified) {
      await Vote.findByIdAndUpdate(order._id, { paymentStatus: 'failed' })
      continue
    }

    const allowed = order.totalCharged || order.totalAmount
    const isValid =
      verified.status === 'successful' &&
      verified.currency === 'NGN' &&
      verified.amount === allowed

    if (!isValid) {
      await Vote.findByIdAndUpdate(order._id, { paymentStatus: 'failed' })
      continue
    }

    const session = await mongoose.startSession()
    try {
      await session.withTransaction(async () => {
        await Vote.findByIdAndUpdate(order._id, { paymentStatus: 'confirmed', confirmedAt: new Date() }, { session })
        await Nominee.findByIdAndUpdate(order.nomineeId, { $inc: { voteCount: order.quantity } }, { session })
      })
      logger.info({ voteId: order._id }, 'Stuck processing vote reconciled')
    } catch {
      logger.error({ voteId: order._id }, 'Failed to confirm stuck processing vote')
    } finally {
      session.endSession()
    }
  }

  await Vote.updateMany(
    {
      paymentMethod: 'flutterwave',
      paymentStatus: { $in: ['pending', 'processing'] },
      createdAt: { $lt: twoHoursAgo },
    },
    { $set: { paymentStatus: 'failed' } }
  )

  logger.info({ reconciled: stuckPending.length + stuckProcessing.length }, 'Reconciliation job completed')
}
