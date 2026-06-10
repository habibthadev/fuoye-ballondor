import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { logger } from 'hono/logger'
import { env } from './config/env.js'
import { connectDB } from './config/db.js'
import { logger as pinoLogger } from './config/pino.js'
import { generalPublicLimit } from './middleware/rate-limit.middleware.js'
import categoriesRouter from './routes/public/categories.route.js'
import nomineesRouter from './routes/public/nominees.route.js'
import votesRouter from './routes/public/votes.route.js'
import flwWebhookRouter from './routes/webhooks/flutterwave.route.js'
import adminRouter from './routes/admin/index.js'
import { Category } from './models/category.model.js'
import { Nominee } from './models/nominee.model.js'
import { Admin } from './models/admin.model.js'
import { Settings } from './models/settings.model.js'
import { hashPassword } from './services/auth.service.js'
import { reconcilePendingOrders } from './services/vote.service.js'
import { AppError } from './utils/errors.js'
import type { AppEnv } from './types.js'

const CATEGORIES = [
  { name: "Ballon D'or (Male)", slug: 'male-ballon-dor', description: 'The ultimate recognition for the finest male footballer on campus.', iconName: 'Trophy01Icon', order: 1, pricePerVote: 200 },
  { name: 'Kopa Trophy', slug: 'kopa-trophy', description: 'Honouring the most outstanding young talent in FUOYE football.', iconName: 'Star01Icon', order: 2, pricePerVote: 100 },
  { name: 'Yashin Trophy', slug: 'yashin-trophy', description: "The goalkeeper's crown.", iconName: 'Shield01Icon', order: 3, pricePerVote: 100 },
  { name: "Ballon D'or (Female)", slug: 'female-ballon-dor', description: "Celebrating the best female footballer at FUOYE.", iconName: 'Trophy01Icon', order: 4, pricePerVote: 200 },
  { name: 'Defender of the Year', slug: 'defender-of-the-year', description: 'For the backline general who has made the difference.', iconName: 'Shield01Icon', order: 5, pricePerVote: 100 },
  { name: 'Playmaker of the Year', slug: 'playmaker-of-the-year', description: 'The architect of attacks.', iconName: 'Lightbulb01Icon', order: 6, pricePerVote: 100 },
  { name: 'Attacker of the Year', slug: 'attacker-of-the-year', description: 'For the goalscorers, the dribblers.', iconName: 'Target01Icon', order: 7, pricePerVote: 100 },
]

const app = new Hono<AppEnv>()

app.use('*', secureHeaders())
const allowedOrigins = env.FRONTEND_URL.split(',').map(s => s.trim())
app.use('*', cors({
  origin: (origin) => {
    if (!origin || allowedOrigins.some(o => origin === o || origin.startsWith(o + '/'))) return origin
    return allowedOrigins[0] ?? origin
  },
  credentials: true,
}))
app.use('*', logger())

app.onError((err, c) => {
  if (err instanceof AppError) {
    pinoLogger.warn({ err }, 'Application error')
    return c.json({ error: err.message, code: err.code }, err.statusCode as 400)
  }
  pinoLogger.error({ err }, 'Unhandled error')
  return c.json({ error: 'Internal server error' }, 500)
})

app.get('/api/stats', generalPublicLimit, async (c) => {
  const totalNominees = await Nominee.countDocuments({ isActive: true })
  const totalCategories = await Category.countDocuments({ isActive: true })
  return c.json({ data: { totalNominees, totalCategories } })
})

app.use('/api/categories/*', generalPublicLimit)
app.use('/api/categories', generalPublicLimit)
app.route('/api/categories', categoriesRouter)

app.use('/api/nominees/*', generalPublicLimit)
app.use('/api/nominees', generalPublicLimit)
app.route('/api/nominees', nomineesRouter)

app.route('/api/votes', votesRouter)
app.route('/api/webhooks/flutterwave', flwWebhookRouter)
app.route('/api/admin', adminRouter)

async function seedAdmin() {
  const existing = await Admin.findOne({ email: env.ADMIN_SEED_EMAIL })
  if (existing) return

  const passwordHash = await hashPassword(env.ADMIN_SEED_PASSWORD)
  await Admin.create({
    email: env.ADMIN_SEED_EMAIL,
    name: 'Super Admin',
    passwordHash,
    role: 'superadmin',
  })
  pinoLogger.info({ email: env.ADMIN_SEED_EMAIL }, 'Superadmin created')
}

async function seedCategories() {
  for (const cat of CATEGORIES) {
    const existing = await Category.findOne({ slug: cat.slug }).lean()
    if (!existing) {
      await Category.create(cat)
      pinoLogger.info({ slug: cat.slug }, 'Category created')
    }
  }
}

async function migrateSettings() {
  await Settings.collection.updateMany(
    { flutterwaveEnabled: { $exists: false } },
    { $set: { flutterwaveEnabled: true }, $unset: { korapayEnabled: '', manualEnabled: '', bankDetails: '' } }
  )
}

async function migrateCategoryPrices() {
  for (const cat of CATEGORIES) {
    await Category.updateOne(
      { slug: cat.slug, pricePerVote: { $exists: false } },
      { $set: { pricePerVote: cat.pricePerVote } }
    )
  }
  pinoLogger.info('Category prices migrated')
}

async function seedSettings() {
  const existing = await Settings.findOne().lean()
  if (existing) return

  await Settings.create({
    votingActive: false,
    flutterwaveEnabled: true,
  })
  pinoLogger.info('Default settings created')
}

function startReconciliation() {
  setInterval(() => {
    reconcilePendingOrders().catch((err) => {
      pinoLogger.error({ err }, 'Reconciliation job failed')
    })
  }, 5 * 60 * 1000)
  pinoLogger.info('Payment reconciliation job started (every 5 min)')
}

async function init(isServerlessEnv = false) {
  await connectDB()
  await seedAdmin()
  await seedCategories()
  await migrateSettings()
  await migrateCategoryPrices()
  await seedSettings()
  if (!isServerlessEnv) startReconciliation()
  pinoLogger.info({ event: 'app_initialized', serverless: isServerlessEnv })
}

const isServerless = env.NODE_ENV === 'production'

if (isServerless) {
  init(true)
} else {
  init(false).then(() => {
    import('@hono/node-server').then(({ serve }) => {
      serve({
        fetch: app.fetch,
        port: env.PORT,
      })
      pinoLogger.info({ event: 'server_started', port: env.PORT, env: env.NODE_ENV })
    }).catch((err) => {
      pinoLogger.error({ event: 'server_startup_failed', err })
      process.exit(1)
    })
  }).catch((err) => {
    pinoLogger.error({ event: 'init_failed', err })
    process.exit(1)
  })
}

export default app
