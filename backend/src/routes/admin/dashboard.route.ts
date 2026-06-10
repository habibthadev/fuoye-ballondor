import { Hono } from 'hono'
import { Vote } from '../../models/vote.model.js'
import { Nominee } from '../../models/nominee.model.js'
import { Category } from '../../models/category.model.js'
import type { AppEnv } from '../../types.js'

const router = new Hono<AppEnv>()

router.get('/', async (c) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const [
    totalVotes,
    totalRevenue,
    pendingCount,
    activeNominees,
    todayVotes,
    yesterdayVotes,
    categoryStats,
    recentPending,
  ] = await Promise.all([
    Vote.countDocuments({ paymentStatus: 'confirmed' }),
    Vote.aggregate([
      { $match: { paymentStatus: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Vote.countDocuments({ paymentStatus: { $in: ['pending', 'processing'] } }),
    Nominee.countDocuments({ isActive: true }),
    Vote.countDocuments({ paymentStatus: 'confirmed', confirmedAt: { $gte: today } }),
    Vote.countDocuments({ paymentStatus: 'confirmed', confirmedAt: { $gte: yesterday, $lt: today } }),
    Category.aggregate([
      {
        $lookup: {
          from: 'nominees',
          localField: '_id',
          foreignField: 'categoryId',
          as: 'nominees',
        },
      },
      {
        $project: {
          name: 1,
          slug: 1,
          totalVotes: { $sum: '$nominees.voteCount' },
          nomineeCount: { $size: '$nominees' },
        },
      },
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
      totalVotes,
      totalRevenue: totalRevenue[0]?.total ?? 0,
      pendingCount,
      activeNominees,
      votesDelta: todayVotes - yesterdayVotes,
      categoryStats,
      recentPending,
    },
  })
})

export default router
