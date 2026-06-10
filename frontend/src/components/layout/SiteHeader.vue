<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { HugeiconsIcon } from '@hugeicons/vue'
import { GridIcon } from '@hugeicons/core-free-icons'
import { Male02Icon } from '@hugeicons/core-free-icons'
import { StarIcon } from '@hugeicons/core-free-icons'
import { Shield01Icon } from '@hugeicons/core-free-icons'
import { Female02Icon } from '@hugeicons/core-free-icons'
import { InformationCircleIcon } from '@hugeicons/core-free-icons'
import { LockIcon } from '@hugeicons/core-free-icons'
import { Menu01Icon } from '@hugeicons/core-free-icons'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { AnimatePresence, m } from 'motion-v'

const router = useRouter()
const route = useRoute()
const open = ref(false)

function isActive(path: string) {
  return route.path === path
}

const links = [
  { label: 'Categories', to: '/categories', icon: GridIcon },
  { label: "Ballon D'or (Male)", to: '/categories/male-ballon-dor', icon: Male02Icon },
  { label: 'Kopa Trophy', to: '/categories/kopa-trophy', icon: StarIcon },
  { label: 'Yashin Trophy', to: '/categories/yashin-trophy', icon: Shield01Icon },
  { label: "Ballon D'or (Female)", to: '/categories/female-ballon-dor', icon: Female02Icon },
  { label: 'Defender of the Year', to: '/categories/defender-of-the-year', icon: Shield01Icon },
  { label: 'Playmaker of the Year', to: '/categories/playmaker-of-the-year', icon: StarIcon },
  { label: 'Attacker of the Year', to: '/categories/attacker-of-the-year', icon: Male02Icon },
  { label: 'How It Works', to: '/how-it-works', icon: InformationCircleIcon },
  { label: 'Admin Panel', to: '/admin/login', icon: LockIcon },
]

function go(to: string) {
  open.value = false
  if (to === '/how-it-works') {
    router.push('/')
    setTimeout(() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }), 100)
  } else {
    router.push(to)
  }
}

watch(open, (val) => {
  document.documentElement.style.overflow = val ? 'hidden' : ''
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}

document.addEventListener('keydown', onKeydown)

onUnmounted(() => {
  document.documentElement.style.overflow = ''
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <header class="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-border" style="padding-top: env(safe-area-inset-top)">
    <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
      <a href="/" class="flex items-center gap-3">
        <span class="flex h-8 w-8 items-center justify-center rounded-full bg-white p-[5px]"><img src="/images/fuoye-logo.webp" alt="FUOYE" class="h-full w-full object-contain" /></span>
        <div class="flex flex-col leading-none">
          <span class="text-sm font-800 text-ink md:text-base">FUOYE Ballon D'Or</span>
          <span class="text-[8px] font-600 tracking-[0.12em] text-blue uppercase">The Golden Verdict</span>
        </div>
      </a>

      <button
        class="flex h-10 items-center gap-2 rounded-full border border-border px-4 text-xs font-700 tracking-wider text-ink/60 uppercase transition-colors hover:border-ink/40 hover:text-ink"
        @click="open = true"
      >
        <HugeiconsIcon :icon="Menu01Icon" :size="16" />
        Menu
      </button>
    </div>
  </header>

  <Teleport to="body">
    <AnimatePresence>
      <m.div
        v-if="open"
        key="nav-overlay"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        :transition="{ duration: 0.2 }"
        class="fixed inset-0 z-[60] flex items-center justify-center"
      >
        <div class="absolute inset-0 bg-ink/60 backdrop-blur-sm" @click="open = false" />
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
                <p class="text-sm font-800 text-ink">FUOYE Ballon D'Or</p>
                <p class="text-[9px] tracking-[0.12em] text-blue uppercase">The Golden Verdict</p>
              </div>
            </div>
            <button class="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-ink" @click="open = false">
              <HugeiconsIcon :icon="Cancel01Icon" :size="16" />
            </button>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="link in links"
              :key="link.label"
              class="flex flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-colors"
              :class="isActive(link.to) ? 'bg-blue text-white' : 'bg-surface text-ink hover:bg-blue/10'"
              @click="go(link.to)"
            >
              <HugeiconsIcon :icon="link.icon" :size="20" />
              <span class="text-[11px] font-700 leading-tight">{{ link.label }}</span>
            </button>
          </div>
        </m.div>
      </m.div>
    </AnimatePresence>
  </Teleport>
</template>