<script setup lang="ts">
import { useRouter } from 'vue-router'
import { m } from 'motion-v'

const router = useRouter()
</script>

<template>
  <m.section
    :initial="{ opacity: 0 }"
    :whileInView="{ opacity: 1 }"
    :viewport="{ once: true }"
    :transition="{ duration: 0.6 }"
    class="relative overflow-hidden py-24 md:py-32"
    style="background: linear-gradient(135deg, #0099F6, #007BCC)"
  >
    <div class="pointer-events-none absolute inset-0 opacity-[0.08] bg-pattern-conic" />
    <div class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
    <div class="relative mx-auto max-w-3xl px-4 text-center md:px-6">
      <m.p
        :initial="{ opacity: 0, y: 20 }"
        :whileInView="{ opacity: 1, y: 0 }"
        :viewport="{ once: true }"
        :transition="{ duration: 0.4 }"
        class="font-mulish text-xs font-900 tracking-[0.15em] text-white/70 uppercase md:text-sm"
      >Cast Your Vote</m.p>
      <m.h2
        :initial="{ opacity: 0, y: 24 }"
        :whileInView="{ opacity: 1, y: 0 }"
        :viewport="{ once: true }"
        :transition="{ duration: 0.5, delay: 0.1 }"
        class="mt-4 text-4xl font-800 text-white md:text-5xl"
      >The vote is open.</m.h2>
      <m.p
        :initial="{ opacity: 0, y: 20 }"
        :whileInView="{ opacity: 1, y: 0 }"
        :viewport="{ once: true }"
        :transition="{ duration: 0.4, delay: 0.2 }"
        class="mt-4 text-lg text-white/70"
      >Every vote counts. Cast yours before the window closes.</m.p>
      <m.div
        :initial="{ opacity: 0, y: 20 }"
        :whileInView="{ opacity: 1, y: 0 }"
        :viewport="{ once: true }"
        :transition="{ duration: 0.4, delay: 0.3 }"
        class="mt-10 flex flex-wrap justify-center gap-4"
      >
        <button
          @click="router.push('/categories')"
          class="rounded-full bg-white px-10 py-4 text-sm font-800 tracking-wider text-blue transition-all hover:bg-white/90 active:scale-[0.97]"
        >
          Start Voting
        </button>
        <a
          href="#how-it-works"
          class="rounded-full border border-white/30 px-10 py-4 text-sm font-700 tracking-wider text-white/80 transition-all hover:border-white hover:text-white"
        >
          Learn More
        </a>
      </m.div>
    </div>
  </m.section>
</template>