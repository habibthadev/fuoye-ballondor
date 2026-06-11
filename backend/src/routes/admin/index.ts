import { Hono } from 'hono'
import { authMiddleware, superadminMiddleware, requireRole } from '../../middleware/auth.middleware.js'
import type { AppEnv } from '../../types.js'
import authRoutes from './auth.route.js'
import dashboardRoutes from './dashboard.route.js'
import nomineesRoutes from './nominees.route.js'
import votesRoutes from './votes.route.js'
import categoriesRoutes from './categories.route.js'
import scoresRoutes from './scores.route.js'
import settingsRoutes from './settings.route.js'
import adminsRoutes from './admins.route.js'

const router = new Hono<AppEnv>()

router.route('/auth', authRoutes)

router.use('*', authMiddleware)

router.use('/dashboard/*', requireRole('admin', 'superadmin'))
router.use('/dashboard', requireRole('admin', 'superadmin'))
router.route('/dashboard', dashboardRoutes)

router.use('/nominees/*', requireRole('admin', 'superadmin'))
router.use('/nominees', requireRole('admin', 'superadmin'))
router.route('/nominees', nomineesRoutes)

router.use('/votes/*', requireRole('admin', 'superadmin'))
router.use('/votes', requireRole('admin', 'superadmin'))
router.route('/votes', votesRoutes)

router.use('/categories/*', requireRole('admin', 'superadmin'))
router.use('/categories', requireRole('admin', 'superadmin'))
router.route('/categories', categoriesRoutes)

router.use('/scores/*', requireRole('moderator', 'admin', 'superadmin'))
router.use('/scores', requireRole('moderator', 'admin', 'superadmin'))
router.route('/scores', scoresRoutes)

router.use('/settings/*', superadminMiddleware)
router.use('/settings', superadminMiddleware)
router.route('/settings', settingsRoutes)

router.use('/admins/*', superadminMiddleware)
router.use('/admins', superadminMiddleware)
router.route('/admins', adminsRoutes)

export default router
