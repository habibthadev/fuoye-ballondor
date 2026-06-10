<script setup lang="ts">
import { useRouter } from 'vue-router'
import { m } from 'motion-v'

const router = useRouter()
</script>

<template>
  <section class="relative min-h-dvh overflow-hidden bg-white">
    <div class="absolute inset-0">
      <img src="/images/hero-bg.webp" alt="" aria-hidden="true" class="h-full w-full object-cover opacity-[0.80]" loading="eager" />
      <div class="absolute inset-0 bg-gradient-to-r from-white/80 via-white/60 to-white/30" />
    </div>
    <div class="pointer-events-none absolute inset-0 opacity-[0.03] bg-pattern-conic" />
    <div class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue/20 to-transparent" />
    <div class="relative mx-auto flex min-h-[calc(100dvh-4rem)] max-w-7xl flex-col justify-center px-4 pb-20 md:min-h-[calc(100dvh-4.5rem)] md:px-6">
      <m.p
        :initial="{ opacity: 0, y: 20 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.5 }"
        class="font-mulish text-xs font-900 tracking-[0.15em] text-blue uppercase md:text-sm"
      >FUOYE Awards 2026</m.p>
      <h1 class="mt-6">
        <m.span
          :initial="{ opacity: 0, y: 24 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.5, delay: 0.15 }"
          class="block text-5xl font-800 leading-[0.95] text-ink md:text-7xl lg:text-8xl"
        >The Golden</m.span>
        <m.span
          :initial="{ opacity: 0, y: 24 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.5, delay: 0.3 }"
          class="block text-5xl font-800 leading-[0.95] text-blue md:text-7xl lg:text-8xl"
        >Verdict.</m.span>
      </h1>
      <m.p
        :initial="{ opacity: 0, y: 20 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.5, delay: 0.45 }"
        class="mt-6 max-w-xl text-base leading-relaxed text-muted md:text-lg"
      >
        Seven categories. One campus. Vote for FUOYE's finest — the players who defined the pitch this season.
      </m.p>
      <m.div
        :initial="{ opacity: 0, y: 20 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.5, delay: 0.6 }"
        class="mt-10 flex flex-wrap gap-4"
      >
        <button
          @click="router.push('/categories')"
          class="rounded-full bg-blue px-8 py-3.5 text-sm font-800 tracking-wider text-white transition-all hover:bg-blue/80 active:scale-[0.97]"
        >
          Explore Categories
        </button>
        <a
          href="#how-it-works"
          class="rounded-full border-2 border-border px-8 py-3.5 text-sm font-700 tracking-wider text-ink/60 transition-all hover:border-ink/40 hover:text-ink"
        >
          How it Works
        </a>
      </m.div>
    </div>
  </section>
</template>