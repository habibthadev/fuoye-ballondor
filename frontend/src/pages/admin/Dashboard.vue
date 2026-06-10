<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useAuthStore } from '../../stores/auth.store'
import { HugeiconsIcon } from '@hugeicons/vue'
import { CheckmarkCircle01Icon, CreditCardIcon, Clock01Icon, UserGroupIcon } from '@hugeicons/core-free-icons'
import { apiFetch } from '../../utils/api'
import AppCard from '../../components/ui/AppCard.vue'
import AppSkeleton from '../../components/ui/AppSkeleton.vue'

const auth = useAuthStore()

interface CategoryStat {
  _id: string
  name: string
  slug: string
  totalVotes: number
  nomineeCount: number
}

interface DashboardData {
  totalVotes: number
  totalRevenue: number
  pendingCount: number
  activeNominees: number
  votesDelta: number
  categoryStats: CategoryStat[]
  recentPending: {
    _id: string
    voterName: string
    voterEmail: string
    paymentStatus: string
    nomineeId: { name: string }
  }[]
}

const { data, isLoading } = useQuery({
  queryKey: ['admin-dashboard'],
  queryFn: () => apiFetch<{ data: DashboardData }>('/admin/dashboard'),
  staleTime: 10_000,
  refetchInterval: 15000,
})

const dash = computed(() => data.value?.data ?? null)

const maxVotes = computed(() => {
  const stats = dash.value?.categoryStats
  if (!stats?.length) return 0
  return Math.max(...stats.map(c => c.totalVotes))
})

const statCards = computed(() => [
  { label: 'Total Votes', value: dash.value?.totalVotes ?? 0, icon: CheckmarkCircle01Icon },
  { label: 'Revenue', value: `₦${(dash.value?.totalRevenue ?? 0).toLocaleString()}`, icon: CreditCardIcon },
  { label: 'Pending', value: dash.value?.pendingCount ?? 0, icon: Clock01Icon },
  { label: 'Active Nominees', value: dash.value?.activeNominees ?? 0, icon: UserGroupIcon },
])

</script>

<template>
  <div class="space-y-6">
    <div v-if="isLoading" class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div v-for="i in 4" :key="i"><AppSkeleton height="120px" /></div>
    </div>

    <template v-else-if="dash">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue/10 text-sm font-700 text-blue">
          {{ auth.admin?.name?.charAt(0)?.toUpperCase() || 'A' }}
        </div>
        <div>
          <p class="text-lg font-700 text-ink">Good to see you, {{ auth.admin?.name?.split(' ')[0] || 'Admin' }}</p>
          <p class="text-sm text-muted">Here's what's happening with your awards.</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div
          v-for="stat in statCards"
          class="rounded-2xl border border-border/60 bg-white p-4 transition-all hover:border-blue/20 sm:p-5"
        >
          <div class="flex items-center justify-between">
            <p class="text-[10px] font-700 tracking-wider text-muted uppercase sm:text-xs">{{ stat.label }}</p>
            <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-muted">
              <HugeiconsIcon :icon="stat.icon" :size="15" />
            </span>
          </div>
          <p class="mt-3 text-xl font-800 text-ink sm:text-3xl">{{ stat.value }}</p>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <AppCard>
          <div class="mb-5 flex items-center justify-between">
            <h3 class="text-sm font-800 text-ink sm:text-base">Votes by Category</h3>
            <span class="rounded-full bg-blue/10 px-2.5 py-0.5 text-[10px] font-700 text-blue">{{ dash.categoryStats?.length || 0 }} categories</span>
          </div>
          <div v-if="dash.categoryStats?.length" class="space-y-2">
            <div
              v-for="cat in dash.categoryStats"
              :key="cat._id"
              class="group rounded-xl bg-surface px-4 py-3 transition-colors hover:bg-blue/5"
            >
              <div class="mb-1.5 flex items-center justify-between">
                <p class="truncate text-sm font-600 text-ink">{{ cat.name }}</p>
                <span class="ml-2 shrink-0 text-sm font-800 text-blue tabular-nums">{{ cat.totalVotes }}</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-border/60">
                  <div
                    class="h-full rounded-full transition-all"
                    :class="cat.totalVotes === maxVotes ? 'bg-blue' : cat.totalVotes > maxVotes / 2 ? 'bg-rose' : 'bg-ink/20'"
                    :style="{ width: maxVotes > 0 ? `${(cat.totalVotes / maxVotes) * 100}%` : '0%' }"
                  />
                </div>
                <span class="text-[10px] font-600 text-muted">{{ cat.nomineeCount }} nominees</span>
              </div>
            </div>
          </div>
          <p v-else class="py-8 text-center text-sm text-muted">No votes cast yet</p>
        </AppCard>

        <AppCard>
          <div class="mb-5 flex items-center justify-between">
            <h3 class="text-sm font-800 text-ink sm:text-base">Processing</h3>
            <span v-if="dash.pendingCount" class="rounded-full bg-rose/10 px-2.5 py-0.5 text-[10px] font-700 text-rose">{{ dash.pendingCount }} pending</span>
            <span v-else class="rounded-full bg-blue/10 px-2.5 py-0.5 text-[10px] font-700 text-blue">All clear</span>
          </div>
          <div v-if="dash.recentPending?.length" class="space-y-1">
            <div
              v-for="vote in dash.recentPending"
              :key="vote._id"
              class="flex items-center justify-between rounded-xl border border-border/40 bg-white px-4 py-3 transition-colors hover:border-blue/20"
            >
              <div class="min-w-0 flex-1 pr-3">
                <p class="truncate text-sm font-600 text-ink">{{ vote.voterName }}</p>
                <p class="truncate text-xs text-muted">{{ vote.nomineeId?.name || 'Unknown nominee' }}</p>
              </div>
              <span class="shrink-0 rounded-full bg-rose/10 px-2.5 py-0.5 text-[10px] font-700 tracking-wider text-rose uppercase">{{ vote.paymentStatus }}</span>
            </div>
          </div>
          <div v-else class="flex flex-col items-center gap-2 py-8 text-center">
            <span class="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-muted">
              <HugeiconsIcon :icon="CheckmarkCircle01Icon" :size="18" />
            </span>
            <p class="text-sm text-muted">All votes processed</p>
          </div>
        </AppCard>
      </div>
    </template>
  </div>
</template>