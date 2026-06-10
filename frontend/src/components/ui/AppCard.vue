<script setup lang="ts">
withDefaults(defineProps<{
  hover?: boolean
  padding?: boolean
  variant?: 'default' | 'ink' | 'surface'
}>(), {
  hover: false,
  padding: true,
  variant: 'default',
})
</script>

<template>
  <div
    class="rounded-2xl transition-all duration-200"
    :class="[
      padding && 'p-6 md:p-8',
      variant === 'default' && 'border border-border bg-white',
      variant === 'ink' && 'border border-overlay-15 bg-blue text-white',
      variant === 'surface' && 'bg-surface',
      hover && 'cursor-pointer hover:border-blue/30',
    ]"
  >
    <slot />
  </div>
</template>
