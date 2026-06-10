<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { m } from 'motion-v'
import { API_BASE } from '../../config/api.js'

const totalNominees = ref(0)
const totalCategories = ref(0)

onMounted(async () => {
  try {
    const res = await fetch(`${API_BASE}/api/stats`)
    const data = await res.json()
    totalNominees.value = data.data.totalNominees
    totalCategories.value = data.data.totalCategories
  } catch {}
})

const stats = computed(() => [
  { number: String(totalCategories.value), label: 'Award Categories', color: 'bg-blue' },
  { number: `${totalNominees.value}+`, label: 'Nominees', color: 'bg-rose' },
])
</script>

<template>
  <m.section
    :initial="{ opacity: 0 }"
    :whileInView="{ opacity: 1 }"
    :viewport="{ once: true }"
    :transition="{ duration: 0.6 }"
    class="relative border-y border-border/50 bg-white"
  >
    <div class="mx-auto max-w-7xl px-4 md:px-6">
      <div class="grid grid-cols-1 divide-y divide-border/50 md:grid-cols-2 md:divide-x md:divide-y-0">
        <m.div
          v-for="(stat, i) in stats"
          :key="stat.label"
          :initial="{ opacity: 0, y: 24 }"
          :whileInView="{ opacity: 1, y: 0 }"
          :viewport="{ once: true }"
          :transition="{ duration: 0.5, delay: i * 0.15 }"
          class="relative flex flex-col items-center px-4 py-10 md:py-12"
        >
          <span class="mb-4 h-1 w-8 rounded-full" :class="stat.color" />
          <span class="text-4xl font-800 text-ink md:text-5xl">{{ stat.number }}</span>
          <span class="mt-1.5 text-sm font-500 tracking-wide text-muted-2">{{ stat.label }}</span>
        </m.div>
      </div>
    </div>
  </m.section>
</template>