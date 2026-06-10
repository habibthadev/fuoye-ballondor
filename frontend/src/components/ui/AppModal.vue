<script setup lang="ts">
import { HugeiconsIcon } from '@hugeicons/vue'
import { Cancel01Icon } from '@hugeicons/core-free-icons'

defineProps<{
  show: boolean
  title?: string
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
        <div class="absolute inset-0 bg-ink/60 backdrop-blur-sm" @click="emit('close')" />
        <div class="relative z-10 w-full max-w-lg rounded-t-2xl bg-white px-5 pb-6 pt-5 shadow-lg sm:rounded-2xl sm:p-8">
          <div v-if="title" class="mb-5 flex items-center justify-between sm:mb-6">
            <h2 class="text-lg font-800 text-ink sm:text-xl">{{ title }}</h2>
            <button @click="emit('close')" class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-ink">
              <HugeiconsIcon :icon="Cancel01Icon" :size="16" />
            </button>
          </div>
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active {
  transition: opacity 0.2s ease-out;
}
.modal-enter-active > div:last-child {
  transition: transform 0.2s ease-out, opacity 0.2s ease-out;
}
.modal-leave-active {
  transition: opacity 0.15s ease-in;
}
.modal-leave-active > div:last-child {
  transition: transform 0.15s ease-in, opacity 0.15s ease-in;
}
.modal-enter-from {
  opacity: 0;
}
.modal-enter-from > div:last-child {
  transform: translateY(16px) scale(0.97);
  opacity: 0;
}
.modal-leave-to {
  opacity: 0;
}
.modal-leave-to > div:last-child {
  transform: translateY(8px) scale(0.98);
  opacity: 0;
}
</style>
