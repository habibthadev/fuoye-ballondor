<script setup lang="ts">
withDefaults(defineProps<{
  width?: string
  height?: string
  rounded?: string
}>(), {
  width: '100%',
  height: '100%',
  rounded: 'rounded-2xl',
})
</script>

<template>
  <div
    :class="[rounded]"
    :style="{ width, height }"
    class="animate-pulse bg-border/40"
  />
</template>
