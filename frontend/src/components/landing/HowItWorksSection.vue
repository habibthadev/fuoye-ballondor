<script setup lang="ts">
import { m } from 'motion-v'

const steps = [
  { num: '01', title: 'Pick a category', desc: 'Browse through seven award categories and find the one you care about most.' },
  { num: '02', title: 'Choose your nominee', desc: 'Select the player you believe deserves the recognition.' },
  { num: '03', title: 'Pay & vote', desc: 'Complete your payment securely and your votes are counted instantly.' },
]
</script>

<template>
  <section id="how-it-works" class="relative overflow-hidden bg-surface py-20 md:py-28">
    <div class="pointer-events-none absolute inset-0 opacity-[0.02] bg-pattern-triangles" />
    <div class="relative mx-auto max-w-7xl px-4 md:px-6">
      <m.div
        :initial="{ opacity: 0, y: 24 }"
        :whileInView="{ opacity: 1, y: 0 }"
        :viewport="{ once: true }"
        :transition="{ duration: 0.5 }"
        class="mb-14 md:mb-16"
      >
        <p class="font-mulish text-xs font-900 tracking-[0.15em] text-blue uppercase md:text-sm">The Process</p>
        <h2 class="mt-4 text-3xl font-800 text-ink md:text-5xl">Simple. Transparent. Fair.</h2>
        <p class="mt-3 max-w-xl text-muted">Three steps to make your voice count.</p>
      </m.div>
      <div class="relative grid gap-6 md:grid-cols-3 md:gap-10">
        <m.div
          v-for="(step, i) in steps"
          :key="i"
          :initial="{ opacity: 0, y: 24 }"
          :whileInView="{ opacity: 1, y: 0 }"
          :viewport="{ once: true }"
          :transition="{ duration: 0.4, delay: i * 0.12 }"
          class="group relative rounded-2xl border border-border bg-white p-6 transition-all hover:border-blue/30 hover:shadow-sm md:p-8"
        >
          <span class="font-mulish relative text-5xl font-200 text-ink/10 md:text-7xl">{{ step.num }}</span>
          <h3 class="relative mt-4 text-xl font-700 text-ink">{{ step.title }}</h3>
          <p class="relative mt-2 text-sm leading-relaxed text-muted">{{ step.desc }}</p>
        </m.div>
      </div>
    </div>
  </section>
</template>