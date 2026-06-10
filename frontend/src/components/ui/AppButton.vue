<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'outline' | 'ghost' | 'rose'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit'
}>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  type: 'button',
})

const emit = defineEmits<{
  click: [e: MouseEvent]
}>()
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center gap-2 rounded-full font-800 tracking-wider transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40"
    :class="[
      size === 'sm' && 'px-5 py-1.5 text-[11px]',
      size === 'md' && 'px-7 py-3 text-sm',
      size === 'lg' && 'px-10 py-4 text-base',
      variant === 'primary' && 'bg-blue text-white hover:bg-blue-hover active:scale-[0.98]',
      variant === 'rose' && 'bg-rose text-white hover:opacity-90 active:scale-[0.98]',
      variant === 'outline' && 'border-2 border-ink text-ink hover:bg-ink hover:text-white',
      variant === 'ghost' && 'text-blue hover:bg-blue-20',
    ]"
    @click="emit('click', $event)"
  >
    <span v-if="loading" class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
    <slot />
  </button>
</template>
