<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store'
import { HugeiconsIcon } from '@hugeicons/vue'
import { DashboardSquare01Icon } from '@hugeicons/core-free-icons'
import { BarChartIcon } from '@hugeicons/core-free-icons'
import { UserGroupIcon } from '@hugeicons/core-free-icons'
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import { CreditCardIcon } from '@hugeicons/core-free-icons'
import { Folder01Icon } from '@hugeicons/core-free-icons'
import { Shield01Icon } from '@hugeicons/core-free-icons'
import { Settings01Icon } from '@hugeicons/core-free-icons'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { Logout01Icon } from '@hugeicons/core-free-icons'
import { AnimatePresence, m } from 'motion-v'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const emit = defineEmits<{
  close: []
}>()

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => {
  document.documentElement.style.overflow = 'hidden'
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.documentElement.style.overflow = ''
  document.removeEventListener('keydown', onKeydown)
})

const allNavItems = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: DashboardSquare01Icon, roles: ['admin', 'superadmin'] },
  { label: 'Scores', to: '/admin/scores', icon: BarChartIcon, roles: ['moderator', 'admin', 'superadmin'] },
  { label: 'Nominees', to: '/admin/nominees', icon: UserGroupIcon, roles: ['admin', 'superadmin'] },
  { label: 'Votes', to: '/admin/votes', icon: CheckmarkCircle02Icon, roles: ['admin', 'superadmin'] },
  { label: 'Payments', to: '/admin/payments', icon: CreditCardIcon, roles: ['admin', 'superadmin'] },
  { label: 'Categories', to: '/admin/categories', icon: Folder01Icon, roles: ['admin', 'superadmin'] },
  { label: 'Admins', to: '/admin/admins', icon: Shield01Icon, roles: ['superadmin'] },
  { label: 'Settings', to: '/admin/settings', icon: Settings01Icon, roles: ['superadmin'] },
]

const navItems = computed(() => allNavItems.filter(item => item.roles.includes(auth.admin?.role ?? '')))

function isActive(path: string) {
  return route.path === path
}

function handleNav(to: string) {
  emit('close')
  router.push(to)
}

async function handleLogout() {
  emit('close')
  await auth.logout()
  router.push('/admin/login')
}
</script>

<template>
  <Teleport to="body">
    <m.div
      :initial="{ opacity: 0 }"
      :animate="{ opacity: 1 }"
      :exit="{ opacity: 0 }"
      :transition="{ duration: 0.2 }"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div class="absolute inset-0 bg-ink/60 backdrop-blur-sm" @click="emit('close')" />
      <m.div
        :initial="{ opacity: 0, scale: 0.92, y: 10 }"
        :animate="{ opacity: 1, scale: 1, y: 0 }"
        :exit="{ opacity: 0, scale: 0.92, y: 10 }"
        :transition="{ duration: 0.2 }"
        class="relative z-10 mx-4 w-full max-w-sm rounded-2xl border border-border bg-white p-6"
      >
          <div class="mb-6 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="flex h-8 w-8 items-center justify-center rounded-full bg-white p-[5px]"><img src="/images/fuoye-logo.webp" alt="FUOYE" class="h-full w-full object-contain" /></span>
              <div>
                <p class="text-sm font-800 text-ink">FUOYE</p>
                <p class="text-[9px] tracking-[0.12em] text-blue uppercase">Admin Panel</p>
              </div>
            </div>
            <button class="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-ink" @click="emit('close')">
              <HugeiconsIcon :icon="Cancel01Icon" :size="16" />
            </button>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="item in navItems"
              :key="item.label"
              class="flex flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-colors"
              :class="isActive(item.to) ? 'bg-blue text-white' : 'bg-surface text-ink hover:bg-blue/10'"
              @click="handleNav(item.to)"
            >
              <HugeiconsIcon :icon="item.icon" :size="20" />
              <span class="text-[11px] font-700 leading-tight">{{ item.label }}</span>
            </button>
          </div>

          <button
            class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 py-2.5 text-xs font-700 text-muted transition-colors hover:border-rose/30 hover:text-rose"
            @click="handleLogout"
          >
            <HugeiconsIcon :icon="Logout01Icon" :size="14" />
            Log Out
          </button>
      </m.div>
    </m.div>
  </Teleport>
</template>