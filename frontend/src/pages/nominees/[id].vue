<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { useRoute, useRouter } from 'vue-router'
import { ref, computed } from 'vue'
import AppBadge from '../../components/ui/AppBadge.vue'
import AppCard from '../../components/ui/AppCard.vue'
import AppSkeleton from '../../components/ui/AppSkeleton.vue'
import VoteDrawer from '../../components/voting/VoteDrawer.vue'
import { API_BASE } from '../../config/api.js'

function priceForSlug(slug?: string) {
  if (!slug) return 200
  if (slug === 'male-ballon-dor' || slug === 'female-ballon-dor') return 200
  return 100
}

const route = useRoute()
const router = useRouter()
const showDrawer = ref(false)
const nomineeId = computed(() => route.params.id as string)
const nominee = computed(() => data.value?.data)
const categorySlug = computed(() => nominee.value?.categoryId?.slug as string | undefined)
const ppv = computed(() => priceForSlug(categorySlug.value))

interface NomineeResponse {
  data: {
    _id: string
    name: string
    imageUrl: string
    department: string
    faculty: string
    position: string
    categoryId: { _id: string; name: string; slug: string }
  }
}

const { data, isLoading } = useQuery({
  queryKey: ['nominee', nomineeId],
  queryFn: (): Promise<NomineeResponse> => fetch(`${API_BASE}/api/nominees/${nomineeId.value}`).then(r => r.json()),
  staleTime: 15_000,
  refetchInterval: 30_000,
})
</script>

<template>
  <div class="min-h-screen bg-surface py-16 md:py-24">
    <div class="mx-auto max-w-7xl px-4 md:px-6">
      <div v-if="isLoading" class="grid gap-8 md:grid-cols-[1.2fr_1fr] md:gap-12">
        <AppSkeleton height="500px" />
        <div class="space-y-6"><AppSkeleton height="300px" /><AppSkeleton height="200px" /></div>
      </div>

      <div v-else-if="nominee" class="grid gap-8 md:grid-cols-[1.2fr_1fr] md:gap-12">
        <div>
          <div class="overflow-hidden rounded-2xl">
            <img :src="nominee.imageUrl" :alt="nominee.name" loading="lazy" class="w-full" />
          </div>
          <button class="mt-4 text-sm font-600 text-blue transition-colors hover:text-blue/70" @click="router.push(`/categories/${categorySlug}`)">
            &larr; Back to {{ nominee.categoryId?.name }}
          </button>
        </div>

        <div>
          <AppBadge class="mb-4">{{ nominee.categoryId?.name }}</AppBadge>
          <h1 class="text-3xl font-800 text-ink md:text-5xl">{{ nominee.name }}</h1>

          <AppCard class="mt-6">
            <div class="grid grid-cols-3 gap-5">
              <div>
                <p class="text-[11px] font-700 tracking-wider text-muted uppercase">Department</p>
                <p class="mt-1 text-sm font-600 text-ink">{{ nominee.department }}</p>
              </div>
              <div>
                <p class="text-[11px] font-700 tracking-wider text-muted uppercase">Faculty</p>
                <p class="mt-1 text-sm font-600 text-ink">{{ nominee.faculty }}</p>
              </div>
              <div>
                <p class="text-[11px] font-700 tracking-wider text-muted uppercase">Position</p>
                <p class="mt-1 text-sm font-600 text-ink">{{ nominee.position }}</p>
              </div>
            </div>
          </AppCard>

          <AppCard class="mt-6">
            <h3 class="mb-4 text-xl font-700 text-ink">Cast Your Vote</h3>
            <p class="mb-6 text-sm text-muted">Votes are ₦{{ ppv }} each. Quantity and pricing will be set in the checkout drawer.</p>
            <button
              class="w-full rounded-full bg-ink px-6 py-3.5 text-sm font-800 tracking-wider text-white transition-colors hover:bg-blue active:scale-[0.98]"
              @click="showDrawer = true"
            >
              Vote Now — ₦{{ ppv }}/vote
            </button>
          </AppCard>
        </div>
      </div>

      <div v-else class="py-20 text-center">
        <p class="text-muted">Nominee not found</p>
      </div>
    </div>

    <VoteDrawer v-if="nominee" :show="showDrawer" :nominee="nominee" :price-per-vote="ppv" @close="showDrawer = false" />
  </div>
</template>
