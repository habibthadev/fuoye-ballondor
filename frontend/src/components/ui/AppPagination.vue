<script setup lang="ts">
const props = withDefaults(defineProps<{
  page: number
  totalPages: number
}>(), {})

const emit = defineEmits<{
  change: [page: number]
}>()

function goTo(p: number) {
  if (p >= 1 && p <= props.totalPages) {
    emit('change', p)
  }
}
</script>

<template>
  <div class="flex items-center justify-center gap-1">
    <button
      :disabled="page <= 1"
      class="rounded-xl px-2.5 py-2 text-xs font-600 text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 sm:px-3 sm:text-sm"
      @click="goTo(page - 1)"
    >
      &larr; Prev
    </button>
    <template v-for="p in totalPages" :key="p">
      <button
        v-if="Math.abs(p - page) <= 2 || p === 1 || p === totalPages"
        class="min-w-[32px] rounded-xl px-2 py-1.5 text-xs font-700 transition-colors sm:min-w-[36px] sm:px-3 sm:py-2 sm:text-sm"
        :class="p === page ? 'bg-blue text-white' : 'text-muted hover:text-ink'"
        @click="goTo(p)"
      >
        {{ p }}
      </button>
      <span v-else-if="p === page - 3 || p === page + 3" class="px-1 text-xs text-muted sm:text-sm">...</span>
    </template>
    <button
      :disabled="page >= totalPages"
      class="rounded-xl px-2.5 py-2 text-xs font-600 text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 sm:px-3 sm:text-sm"
      @click="goTo(page + 1)"
    >
      Next &rarr;
    </button>
  </div>
</template>
