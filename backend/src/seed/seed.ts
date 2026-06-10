import { connectDB, disconnectDB } from '../config/db.js'
import { env } from '../config/env.js'
import { Admin } from '../models/admin.model.js'
import { Category } from '../models/category.model.js'
import { Settings } from '../models/settings.model.js'
import { hashPassword } from '../services/auth.service.js'
import { logger } from '../config/pino.js'

const CATEGORIES = [
  {
    name: "Ballon D'or (Male)",
    slug: 'male-ballon-dor',
    description:
      'The ultimate recognition for the finest male footballer on campus. This award celebrates overall excellence, leadership, and impact on the pitch throughout the season.',
    iconName: 'Trophy01Icon',
    order: 1,
  },
  {
    name: 'Kopa Trophy',
    slug: 'kopa-trophy',
    description:
      'Honouring the most outstanding young talent in FUOYE football. Reserved for players under 21 who have shown exceptional promise and skill.',
    iconName: 'Star01Icon',
    order: 2,
  },
  {
    name: 'Yashin Trophy',
    slug: 'yashin-trophy',
    description:
      'The goalkeeper\'s crown. Recognises the shot-stopper who has delivered the most commanding, decisive, and consistent performances between the posts.',
    iconName: 'Shield01Icon',
    order: 3,
  },
  {
    name: "Ballon D'or (Female)",
    slug: 'female-ballon-dor',
    description:
      'Celebrating the best female footballer at FUOYE. This award honours the player whose talent, determination, and sportsmanship have defined the women\'s game this season.',
    iconName: 'Trophy01Icon',
    order: 4,
  },
  {
    name: 'Defender of the Year',
    slug: 'defender-of-the-year',
    description:
      'For the backline general who has made the difference. This award recognises defensive excellence — tackles, interceptions, positioning, and leadership at the back.',
    iconName: 'Shield01Icon',
    order: 5,
  },
  {
    name: 'Playmaker of the Year',
    slug: 'playmaker-of-the-year',
    description:
      'The architect of attacks. Honouring the player whose vision, passing range, and creativity have been the driving force behind their team\'s best moments.',
    iconName: 'Lightbulb01Icon',
    order: 6,
  },
  {
    name: 'Attacker of the Year',
    slug: 'attacker-of-the-year',
    description:
      'For the goalscorers, the dribblers, the ones who live to find the back of the net. Recognises the most lethal and exciting attacking player on campus.',
    iconName: 'Target01Icon',
    order: 7,
  },
]

async function seed() {
  await connectDB()
  logger.info('Starting seed...')

  const adminCount = await Admin.countDocuments()
  if (adminCount === 0) {
    const passwordHash = await hashPassword(env.ADMIN_SEED_PASSWORD)
    await Admin.create({
      email: env.ADMIN_SEED_EMAIL,
      name: 'Super Admin',
      passwordHash,
      role: 'superadmin',
    })
    logger.info({ email: env.ADMIN_SEED_EMAIL }, 'Superadmin created')
  } else {
    logger.info('Admin already exists, skipping')
  }

  for (const cat of CATEGORIES) {
    const existing = await Category.findOne({ slug: cat.slug }).lean()
    if (!existing) {
      await Category.create(cat)
      logger.info({ slug: cat.slug }, 'Category created')
    }
  }

  const settingsExist = await Settings.findOne().lean()
  if (!settingsExist) {
    await Settings.create({
      votingActive: false,
      pricePerVote: 200,
      flutterwaveEnabled: true,
    })
    logger.info('Default settings created')
  }

  logger.info('Seed complete')
  await disconnectDB()
}

seed().catch((err) => {
  logger.error({ err }, 'Seed failed')
  process.exit(1)
})
