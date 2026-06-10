<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Menu01Icon } from '@hugeicons/core-free-icons'

const route = useRoute()
const auth = useAuthStore()

const emit = defineEmits<{
  'open-nav': []
}>()

const pageTitles: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/scores': 'Scores',
  '/admin/nominees': 'Nominees',
  '/admin/votes': 'Votes',
  '/admin/payments': 'Payments',
  '/admin/categories': 'Categories',
  '/admin/admins': 'Admins',
  '/admin/settings': 'Settings',
}
</script>

<template>
  <header class="flex shrink-0 items-center justify-between border-b border-border/50 bg-white px-4 py-3 md:px-6 md:py-4">
    <h1 class="min-w-0 truncate text-lg font-800 text-ink sm:text-xl md:text-2xl">{{ pageTitles[route.path] || 'Admin' }}</h1>
    <div class="flex shrink-0 items-center gap-3">
      <span class="hidden truncate text-sm text-muted sm:inline">{{ auth.admin?.name || 'Admin' }}</span>
      <span class="shrink-0 rounded-full bg-blue/10 px-2.5 py-0.5 text-[10px] font-700 tracking-wider text-blue uppercase sm:px-3 sm:text-xs">{{ auth.admin?.role }}</span>
      <button
        class="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted transition-colors hover:border-blue/30 hover:bg-blue/5 hover:text-blue"
        aria-label="Open navigation"
        @click="emit('open-nav')"
      >
        <HugeiconsIcon :icon="Menu01Icon" :size="16" />
      </button>
    </div>
  </header>
</template>