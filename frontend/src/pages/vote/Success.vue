<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'
import { HugeiconsIcon } from '@hugeicons/vue'
import { CheckmarkCircle01Icon, CancelCircleIcon } from '@hugeicons/core-free-icons'
import { API_BASE } from '../../config/api.js'

const route = useRoute()
const router = useRouter()
const status = ref<'loading' | 'verifying' | 'confirmed' | 'pending' | 'not-found'>('loading')

async function checkStatus(voteId: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/votes/${voteId}/status`)
    if (!res.ok) return null
    const data = await res.json()
    return data.data.paymentStatus
  } catch {
    return null
  }
}

onMounted(async () => {
  const voteId = (route.query.tx_ref ?? route.query.ref) as string
  if (!voteId) {
    status.value = 'not-found'
    return
  }

  const result = await checkStatus(voteId)
  if (result === 'confirmed') {
    status.value = 'confirmed'
    return
  }
  if (result === null) {
    status.value = 'not-found'
    return
  }

  status.value = 'verifying'

  let retries = 0
  const maxRetries = 15
  const interval = setInterval(async () => {
    retries++
    const s = await checkStatus(voteId)
    if (s === 'confirmed') {
      clearInterval(interval)
      status.value = 'confirmed'
    } else if (s === null || s === 'failed' || retries >= maxRetries) {
      clearInterval(interval)
      status.value = s === null ? 'not-found' : 'pending'
    }
  }, 2000)

  onUnmounted(() => clearInterval(interval))
})
</script>

<template>
  <div class="flex min-h-[calc(100dvh-4rem)] justify-center bg-surface pt-[22vh] md:min-h-[calc(100dvh-4.5rem)]">
    <div class="w-full max-w-md px-4 text-center">
      <div v-if="status === 'loading' || status === 'verifying'">
        <div class="mx-auto mb-8 h-16 w-16 animate-spin rounded-full border-[3px] border-ink border-t-transparent" />
        <p class="text-lg text-muted">{{ status === 'verifying' ? 'Confirming your vote...' : 'Verifying your payment...' }}</p>
      </div>

      <div v-else-if="status === 'confirmed'">
        <div class="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
          <HugeiconsIcon :icon="CheckmarkCircle01Icon" :size="40" color="#059669" />
        </div>
        <h1 class="text-3xl font-800 text-ink">Your vote is in!</h1>
        <p class="mt-3 text-muted">Confirmation sent to your email.</p>
        <div class="mt-8">
          <button
            @click="router.push('/categories')"
            class="rounded-full bg-ink px-8 py-3.5 text-sm font-700 text-white transition-colors hover:bg-blue active:scale-[0.98]"
          >
            View All Categories
          </button>
        </div>
      </div>

      <div v-else>
        <div class="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
          <HugeiconsIcon :icon="CancelCircleIcon" :size="40" color="#D97706" />
        </div>
        <h1 class="text-3xl font-800 text-ink">Payment pending</h1>
        <p class="mt-3 text-muted">Your payment is being processed or was not found.</p>
        <div class="mt-8">
          <button
            @click="router.push('/categories')"
            class="rounded-full bg-ink px-8 py-3.5 text-sm font-700 text-white transition-colors hover:bg-blue active:scale-[0.98]"
          >
            Back to Categories
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
