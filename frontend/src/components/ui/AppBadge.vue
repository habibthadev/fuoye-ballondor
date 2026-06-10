<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'default' | 'success' | 'warning' | 'danger'
}>(), {
  variant: 'default',
})
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-800 tracking-wider uppercase"
    :class="[
      variant === 'default' && 'bg-blue-20 text-blue',
      variant === 'success' && 'bg-emerald-50 text-emerald-700',
      variant === 'warning' && 'bg-amber-50 text-amber-700',
      variant === 'danger' && 'bg-rose/10 text-rose',
    ]"
  >
    <slot />
  </span>
</template>
