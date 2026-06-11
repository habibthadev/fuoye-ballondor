import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('../layouts/DefaultLayout.vue'),
      children: [
        { path: '', name: 'home', component: () => import('../pages/Index.vue') },
        { path: 'categories', name: 'categories', component: () => import('../pages/categories/Index.vue') },
        { path: 'categories/:slug', name: 'category-slug', component: () => import('../pages/categories/[slug].vue') },
        { path: 'nominees/:id', name: 'nominee', component: () => import('../pages/nominees/[id].vue') },
        { path: 'vote/success', name: 'vote-success', component: () => import('../pages/vote/Success.vue') },
      ],
    },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('../pages/admin/Login.vue'),
    },
    {
      path: '/admin',
      component: () => import('../layouts/AdminLayout.vue'),
      children: [
        { path: '', redirect: { name: 'admin-scores' } },
        { path: 'dashboard', name: 'admin-dashboard', component: () => import('../pages/admin/Dashboard.vue'), meta: { requiresAuth: true, roles: ['admin', 'superadmin'] } },
        { path: 'scores', name: 'admin-scores', component: () => import('../pages/admin/Scores.vue'), meta: { requiresAuth: true, roles: ['moderator', 'admin', 'superadmin'] } },
        { path: 'nominees', name: 'admin-nominees', component: () => import('../pages/admin/Nominees.vue'), meta: { requiresAuth: true, roles: ['admin', 'superadmin'] } },
        { path: 'votes', name: 'admin-votes', component: () => import('../pages/admin/Votes.vue'), meta: { requiresAuth: true, roles: ['admin', 'superadmin'] } },
        { path: 'payments', name: 'admin-payments', component: () => import('../pages/admin/Payments.vue'), meta: { requiresAuth: true, roles: ['admin', 'superadmin'] } },
        { path: 'categories', name: 'admin-categories', component: () => import('../pages/admin/Categories.vue'), meta: { requiresAuth: true, roles: ['admin', 'superadmin'] } },
        { path: 'admins', name: 'admin-admins', component: () => import('../pages/admin/Admins.vue'), meta: { requiresAuth: true, roles: ['superadmin'] } },
        { path: 'settings', name: 'admin-settings', component: () => import('../pages/admin/Settings.vue'), meta: { requiresAuth: true, roles: ['superadmin'] } },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../pages/NotFound.vue'),
    },
  ],
})

router.afterEach(() => {
  window.scrollTo(0, 0)
})

function firstAccessibleRoute(role?: string): string {
  const priority = ['admin-scores', 'admin-dashboard', 'admin-nominees', 'admin-votes', 'admin-payments', 'admin-categories', 'admin-admins', 'admin-settings']
  for (const name of priority) {
    const route = router.resolve({ name })
    const allowed = route.meta.roles as string[] | undefined
    if (!allowed || (role && allowed.includes(role))) return name
  }
  return 'admin-scores'
}

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore()

  if (to.name === 'admin-login' && auth.accessToken) {
    if (auth.admin) {
      next({ name: firstAccessibleRoute(auth.admin!.role) })
      return
    }
    const ok = await auth.refreshToken()
    if (ok) {
      next({ name: firstAccessibleRoute(auth.admin!.role) })
      return
    }
  }

  if (to.meta.requiresAuth) {
    if (!auth.admin) {
      const ok = await auth.refreshToken()
      if (!ok) {
        next({ name: 'admin-login' })
        return
      }
    }

    const allowed = to.meta.roles as string[] | undefined
    if (allowed && auth.admin && !allowed.includes(auth.admin.role)) {
      next({ name: firstAccessibleRoute(auth.admin.role) })
      return
    }
  }
  next()
})

export default router
