<script setup lang="ts">
import { ref, watch } from 'vue'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Cancel01Icon } from '@hugeicons/core-free-icons'

const props = withDefaults(defineProps<{
  message: string
  type?: 'success' | 'error' | 'info'
  show: boolean
}>(), {
  type: 'info',
})

const emit = defineEmits<{
  close: []
}>()

const visible = ref(false)

watch(() => props.show, (val) => {
  if (val) {
    visible.value = true
    setTimeout(() => {
      visible.value = false
      emit('close')
    }, 4000)
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed bottom-6 right-6 z-[100] animate-fade-up"
    >
      <div
        class="flex items-center gap-3 rounded-2xl px-6 py-4 shadow-2xl"
        :class="[
          type === 'success' && 'bg-emerald-50 text-emerald-800 border border-emerald-200',
          type === 'error' && 'bg-rose/5 text-rose border border-rose/20',
          type === 'info' && 'bg-blue text-white',
        ]"
      >
        <span v-if="type === 'success'" class="text-lg">&#10003;</span>
        <span v-else-if="type === 'error'" class="text-lg">&#9888;</span>
        <span class="text-sm font-600">{{ message }}</span>
        <button @click="visible = false; emit('close')" class="ml-2 opacity-60 hover:opacity-100">
          <HugeiconsIcon :icon="Cancel01Icon" :size="14" />
        </button>
      </div>
    </div>
  </Teleport>
</template>
