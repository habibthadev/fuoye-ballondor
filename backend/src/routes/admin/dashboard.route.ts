import { Hono } from 'hono'
import { Vote } from '../../models/vote.model.js'
import { Nominee } from '../../models/nominee.model.js'
import type { AppEnv } from '../../types.js'

const router = new Hono<AppEnv>()

router.get('/', async (c) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const [totals, pendingCount, activeNominees, todayVotes, yesterdayVotes, categoryStats, recentPending] = await Promise.all([
    Vote.aggregate([
      { $match: { paymentStatus: 'confirmed' } },
      { $group: { _id: null, totalVotes: { $sum: '$quantity' }, totalRevenue: { $sum: '$totalCharged' } } },
    ]).then(r => r[0] ?? { totalVotes: 0, totalRevenue: 0 }),
    Vote.countDocuments({ paymentStatus: { $in: ['pending', 'processing'] } }),
    Nominee.countDocuments({ isActive: true }),
    Vote.aggregate([
      { $match: { paymentStatus: 'confirmed', confirmedAt: { $gte: today } } },
      { $group: { _id: null, count: { $sum: '$quantity' } } },
    ]).then(r => r[0]?.count ?? 0),
    Vote.aggregate([
      { $match: { paymentStatus: 'confirmed', confirmedAt: { $gte: yesterday, $lt: today } } },
      { $group: { _id: null, count: { $sum: '$quantity' } } },
    ]).then(r => r[0]?.count ?? 0),
    Vote.aggregate([
      { $match: { paymentStatus: 'confirmed' } },
      { $group: { _id: '$categoryId', totalVotes: { $sum: '$quantity' }, totalRevenue: { $sum: '$totalCharged' } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $lookup: { from: 'nominees', localField: '_id', foreignField: 'categoryId', as: 'nominees' } },
      { $project: { _id: '$category._id', name: '$category.name', slug: '$category.slug', totalVotes: 1, totalRevenue: 1, nomineeCount: { $size: '$nominees' } } },
      { $sort: { totalVotes: -1 } },
    ]),
    Vote.find({ paymentStatus: { $in: ['pending', 'processing'] } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('nomineeId', 'name')
      .populate('categoryId', 'name')
      .lean(),
  ])

  return c.json({
    data: {
      totalVotes: totals.totalVotes,
      totalRevenue: totals.totalRevenue,
      pendingCount,
      activeNominees,
      votesDelta: todayVotes - yesterdayVotes,
      categoryStats,
      recentPending,
    },
  })
})

export default router
