<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Male02Icon, StarIcon, Shield01Icon, Female02Icon } from '@hugeicons/core-free-icons'
import { m } from 'motion-v'
import AppSkeleton from '../../components/ui/AppSkeleton.vue'
import { API_BASE } from '../../config/api.js'

const slugIcon: Record<string, object> = {
  'male-ballon-dor': Male02Icon,
  'kopa-trophy': StarIcon,
  'yashin-trophy': Shield01Icon,
  'female-ballon-dor': Female02Icon,
  'defender-of-the-year': Shield01Icon,
  'playmaker-of-the-year': StarIcon,
  'attacker-of-the-year': Male02Icon,
}

interface Category {
  _id: string
  name: string
  slug: string
  description: string
  iconName: string
  order: number
}

const { data, isLoading } = useQuery({
  queryKey: ['categories'],
  queryFn: () => fetch(`${API_BASE}/api/categories`).then(r => r.json()),
})
</script>

<template>
  <div class="min-h-screen bg-surface">
    <div class="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <m.div
        :initial="{ opacity: 0, y: 24 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.5 }"
        class="mb-12"
      >
        <p class="font-mulish text-xs font-900 tracking-[0.15em] text-blue uppercase md:text-sm">Categories</p>
        <h1 class="mt-3 text-4xl font-800 text-ink md:text-6xl">Award Categories</h1>
        <p class="mt-4 max-w-xl text-base leading-relaxed text-muted">Browse all categories and vote for your favourite nominees.</p>
      </m.div>
      <div class="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        <div v-if="isLoading" v-for="i in 7" :key="i">
          <AppSkeleton height="260px" rounded="rounded-2xl" />
        </div>
        <m.div
          v-for="(cat, i) in data?.data || []"
          :key="cat._id"
          :initial="{ opacity: 0, y: 24 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.4, delay: i * 0.06 }"
        >
          <router-link
            :to="`/categories/${cat.slug}`"
            class="group relative flex min-h-[240px] flex-col justify-end overflow-hidden rounded-2xl border border-border/50 bg-white p-6 transition-all hover:border-blue/30 md:p-8"
          >
            <div class="z-10">
              <span class="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-surface/80 text-blue">
                <HugeiconsIcon :icon="slugIcon[cat.slug] || Shield01Icon" :size="22" />
              </span>
              <h3 class="text-xl font-700 text-ink md:text-2xl">{{ cat.name }}</h3>
              <p class="mt-2 text-sm text-muted">{{ cat.description }}</p>
            </div>
          </router-link>
        </m.div>
      </div>
    </div>
  </div>
</template>