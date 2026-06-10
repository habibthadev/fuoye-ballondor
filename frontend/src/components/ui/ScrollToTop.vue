<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { HugeiconsIcon } from '@hugeicons/vue'
import { ArrowUp01Icon } from '@hugeicons/core-free-icons'

const visible = ref(false)

let ticking = false

function onScroll() {
  if (!ticking) {
    requestAnimationFrame(() => {
      visible.value = window.scrollY > 400
      ticking = false
    })
    ticking = true
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <Teleport to="body">
    <button
      v-show="visible"
      class="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-blue text-white transition-all duration-200 hover:bg-blue/80 active:scale-90 md:bottom-8 md:right-8"
      @click="scrollToTop"
      aria-label="Back to top"
    >
      <HugeiconsIcon :icon="ArrowUp01Icon" :size="18" />
    </button>
  </Teleport>
</template>
