import { Hono } from 'hono'
import { Category } from '../../models/category.model.js'
import { Nominee } from '../../models/nominee.model.js'
import { Vote } from '../../models/vote.model.js'
import type { AppEnv } from '../../types.js'

const router = new Hono<AppEnv>()

router.get('/', async (c) => {
  const categories = await Category.find({ isActive: true }).sort({ order: 1 }).lean()

  const scores = await Promise.all(
    categories.map(async (cat) => {
      const nominees = await Nominee.find({ categoryId: cat._id, isActive: true })
        .select('name imageUrl department faculty position voteCount')
        .sort({ voteCount: -1 })
        .lean()

      const nomineeIds = nominees.map((n) => n._id)
      const votesPerNominee = await Vote.aggregate([
        { $match: { nomineeId: { $in: nomineeIds }, paymentStatus: 'confirmed' } },
        { $group: { _id: '$nomineeId', totalVotes: { $sum: '$quantity' } } },
      ])

      const voteMap = new Map<string, number>()
      for (const v of votesPerNominee) {
        voteMap.set(v._id.toString(), v.totalVotes)
      }

      const nomineeData = nominees.map((n) => ({
        _id: n._id.toString(),
        name: n.name,
        imageUrl: n.imageUrl,
        department: n.department,
        faculty: n.faculty,
        position: n.position,
        voteCount: voteMap.get(n._id.toString()) ?? n.voteCount,
      }))

      return {
        _id: cat._id.toString(),
        name: cat.name,
        slug: cat.slug,
        totalNominees: nomineeData.length,
        totalVotes: nomineeData.reduce((sum, n) => sum + n.voteCount, 0),
        nominees: nomineeData,
      }
    })
  )

  return c.json({ data: scores })
})

export default router
