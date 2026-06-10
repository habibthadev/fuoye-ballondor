<script setup lang="ts">
withDefaults(defineProps<{
  modelValue?: string
  type?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  label?: string
}>(), {
  type: 'text',
  placeholder: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function onInput(e: Event) {
  const target = e.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="mb-2 block text-[11px] font-700 tracking-widest text-ink/50 uppercase">{{ label }}</label>
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full border-b-2 px-0 pb-2.5 pt-1 text-sm text-ink outline-none transition-colors placeholder:text-muted-3 focus:border-blue disabled:cursor-not-allowed disabled:opacity-30"
      :class="[error ? 'border-rose' : 'border-border/60 hover:border-ink/30']"
      @input="onInput"
    />
    <p v-if="error" class="mt-1.5 text-xs font-600 text-rose">{{ error }}</p>
  </div>
</template>
