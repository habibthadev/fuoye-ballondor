<script setup lang="ts">
import { m } from 'motion-v'

const items = [
  { name: "Ballon D'or (Male)", slug: 'male-ballon-dor', img: '/images/football-action.webp' },
  { name: 'Kopa Trophy', slug: 'kopa-trophy', img: '/images/trophy.webp' },
  { name: 'Yashin Trophy', slug: 'yashin-trophy', img: '/images/football-action.webp' },
  { name: "Ballon D'or (Female)", slug: 'female-ballon-dor', img: '/images/football-action.webp' },
  { name: 'Defender of the Year', slug: 'defender-of-the-year', img: '/images/trophy.webp' },
  { name: 'Playmaker of the Year', slug: 'playmaker-of-the-year', img: '/images/football-action.webp' },
  { name: 'Attacker of the Year', slug: 'attacker-of-the-year', img: '/images/trophy.webp' },
]
</script>

<template>
  <section class="relative overflow-hidden bg-surface py-20 md:py-28">
    <div class="pointer-events-none absolute inset-0 opacity-[0.03] bg-pattern-conic" />
    <div class="mx-auto max-w-7xl px-4 md:px-6">
      <m.div
        :initial="{ opacity: 0, y: 24 }"
        :whileInView="{ opacity: 1, y: 0 }"
        :viewport="{ once: true }"
        :transition="{ duration: 0.5 }"
        class="relative mb-14 md:mb-16"
      >
        <span class="font-mulish block text-xs font-900 tracking-[0.15em] text-blue uppercase md:text-sm">The Awards</span>
        <h2 class="mt-4 text-3xl font-800 text-ink md:text-5xl">Seven ways to be remembered.</h2>
        <p class="mt-3 max-w-xl text-muted">From the young breakout star to the defensive anchor — every category tells a story.</p>
      </m.div>
      <div class="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        <m.div
          v-for="(cat, i) in items"
          :key="cat.slug"
          :initial="{ opacity: 0, y: 24 }"
          :whileInView="{ opacity: 1, y: 0 }"
          :viewport="{ once: true }"
          :transition="{ duration: 0.4, delay: i * 0.08 }"
        >
          <router-link
            :to="`/categories/${cat.slug}`"
            class="group relative overflow-hidden rounded-2xl border border-border/50 bg-white transition-all hover:-translate-y-0.5 hover:border-blue/30 hover:shadow-sm"
          >
            <div class="aspect-[16/10] overflow-hidden bg-surface">
              <img :src="cat.img" alt="" aria-hidden="true" class="h-full w-full object-cover transition-all duration-500 group-hover:scale-105" loading="lazy" />
            </div>
            <div class="p-5 md:p-6">
              <div class="mb-3 flex items-center gap-3">
                <span
                  class="inline-block h-0.5 w-6 rounded-full"
                  :class="i < 2 ? 'bg-blue' : i < 5 ? 'bg-rose' : 'bg-ink'"
                />
                <span class="font-mulish text-xs font-700 tracking-wider text-muted-2 uppercase">{{ String(i + 1).padStart(2, '0') }}</span>
              </div>
              <h6 class="text-lg font-700 text-ink md:text-xl">{{ cat.name }}</h6>
              <p class="mt-2 text-sm font-500 text-muted-2">View nominees &rarr;</p>
            </div>
          </router-link>
        </m.div>
      </div>
    </div>
  </section>
</template>