<script setup lang="ts">
import { HugeiconsIcon } from '@hugeicons/vue'
import { Search01Icon } from '@hugeicons/core-free-icons'

withDefaults(defineProps<{
  title?: string
  description?: string
}>(), {
  title: 'Nothing here yet',
  description: 'Content will appear once available.',
})
</script>

<template>
  <div class="flex flex-col items-center justify-center py-20 text-center">
    <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface">
      <HugeiconsIcon :icon="Search01Icon" :size="32" color="#9CA0AA" />
    </div>
    <h3 class="mb-1 text-lg font-700 text-ink">{{ title }}</h3>
    <p class="text-sm text-muted">{{ description }}</p>
  </div>
</template>
