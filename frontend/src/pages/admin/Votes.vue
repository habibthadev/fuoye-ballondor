<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { ref } from 'vue'
import { apiFetch } from '../../utils/api'
import AppBadge from '../../components/ui/AppBadge.vue'
import AppEmpty from '../../components/ui/AppEmpty.vue'
import AppPagination from '../../components/ui/AppPagination.vue'
import AppSkeleton from '../../components/ui/AppSkeleton.vue'

interface Vote {
  _id: string
  voterName: string
  voterEmail: string
  nomineeId: { name: string }
  quantity: number
  totalAmount: number
  paymentMethod: string
  paymentStatus: string
  createdAt: string
}

const page = ref(1)
const statusFilter = ref('all')

const { data, isLoading } = useQuery({
  queryKey: ['admin-votes', page, statusFilter] as const,
  queryFn: () => apiFetch<{ data: Vote[]; pagination: { page: number; totalPages: number } }>('/admin/votes', {
    params: { page: page.value, limit: 25, status: statusFilter.value === 'all' ? undefined : statusFilter.value },
  }),
})

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  processing: 'warning',
  confirmed: 'success',
  rejected: 'danger',
  failed: 'danger',
  disputed: 'danger',
}

const statuses = ['all', 'pending', 'confirmed', 'failed'] as const
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap gap-2">
      <button
        v-for="s in statuses"
        :key="s"
        class="rounded-full px-4 py-1.5 text-xs font-700 transition-colors"
        :class="statusFilter === s ? 'bg-blue text-white' : 'bg-surface text-muted hover:bg-border'"
        @click="statusFilter = s; page = 1"
      >
        {{ s.charAt(0).toUpperCase() + s.slice(1) }}
      </button>
    </div>

    <div v-if="isLoading" class="space-y-3">
      <div v-for="i in 5" :key="i"><AppSkeleton height="52px" /></div>
    </div>

    <div v-else class="space-y-6">
      <div class="overflow-x-auto rounded-2xl border border-border bg-white">
        <table class="w-full min-w-[700px] text-left text-sm">
          <thead class="border-b border-border/50 bg-surface text-xs font-700 tracking-wider text-muted uppercase">
            <tr>
              <th class="px-4 py-3">Voter</th>
              <th class="px-4 py-3">Nominee</th>
              <th class="px-4 py-3">Qty</th>
              <th class="px-4 py-3">Amount</th>
              <th class="px-4 py-3">Method</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody v-if="data?.data?.length">
            <tr v-for="vote in data.data" :key="vote._id" class="border-b border-border/30 transition-colors hover:bg-surface/50">
              <td class="px-4 py-3">
                <p class="font-600 text-ink">{{ vote.voterName }}</p>
                <p class="truncate text-xs text-muted max-w-[140px]">{{ vote.voterEmail }}</p>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-muted">{{ vote.nomineeId?.name }}</td>
              <td class="whitespace-nowrap px-4 py-3 font-600 text-ink tabular-nums">{{ vote.quantity }}</td>
              <td class="whitespace-nowrap px-4 py-3 font-600 text-ink tabular-nums">₦{{ vote.totalAmount.toLocaleString() }}</td>
              <td class="px-4 py-3"><AppBadge>{{ vote.paymentMethod }}</AppBadge></td>
              <td class="px-4 py-3"><AppBadge :variant="statusVariant[vote.paymentStatus] || 'default'">{{ vote.paymentStatus }}</AppBadge></td>
              <td class="whitespace-nowrap px-4 py-3 text-xs text-muted tabular-nums">{{ new Date(vote.createdAt).toLocaleDateString() }}</td>
            </tr>
          </tbody>
        </table>
        <AppEmpty v-if="!data?.data?.length" />
      </div>

      <div v-if="data?.pagination && data.pagination.totalPages > 1">
        <AppPagination :page="data.pagination.page" :total-pages="data.pagination.totalPages" @change="page = $event" />
      </div>
    </div>
  </div>
</template>
