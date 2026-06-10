<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { ref } from 'vue'
import { apiFetch } from '../../utils/api'
import AppBadge from '../../components/ui/AppBadge.vue'
import AppEmpty from '../../components/ui/AppEmpty.vue'
import AppPagination from '../../components/ui/AppPagination.vue'
import AppSkeleton from '../../components/ui/AppSkeleton.vue'

const page = ref(1)

const { data, isLoading } = useQuery({
  queryKey: ['admin-payments', page],
      queryFn: () => apiFetch<{ data: { _id: string; voterName: string; voterEmail: string; totalAmount: number; paymentStatus: string; createdAt: string }[]; pagination: { page: number; totalPages: number } }>('/admin/votes', {
    params: { page: page.value, limit: 25 },
  }),
  staleTime: 15_000,
  placeholderData: (prev) => prev,
})
</script>

<template>
  <div>
    <div v-if="isLoading" class="space-y-3">
      <div v-for="i in 5" :key="i"><AppSkeleton height="52px" /></div>
    </div>

    <template v-else>
      <div class="overflow-x-auto rounded-2xl border border-border bg-white">
        <table class="w-full min-w-[500px] text-left text-sm">
          <thead class="border-b border-border/50 bg-surface text-xs font-700 tracking-wider text-muted uppercase">
            <tr>
              <th class="px-4 py-3">Voter</th>
              <th class="px-4 py-3">Amount</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody v-if="data?.data?.length">
            <tr v-for="vote in data.data" :key="vote._id" class="border-b border-border/30 transition-colors hover:bg-surface/50">
              <td class="px-4 py-3">
                <p class="font-600 text-ink">{{ vote.voterName }}</p>
                <p class="truncate text-xs text-muted max-w-[160px]">{{ vote.voterEmail }}</p>
              </td>
              <td class="whitespace-nowrap px-4 py-3 font-600 text-ink tabular-nums">₦{{ vote.totalAmount.toLocaleString() }}</td>
              <td class="px-4 py-3">
                <AppBadge :variant="vote.paymentStatus === 'pending' ? 'warning' : vote.paymentStatus === 'confirmed' ? 'success' : 'danger'">{{ vote.paymentStatus }}</AppBadge>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-xs text-muted tabular-nums">{{ new Date(vote.createdAt).toLocaleDateString() }}</td>
            </tr>
          </tbody>
        </table>
        <AppEmpty v-if="!data?.data?.length" />
      </div>

      <div v-if="data?.pagination && data.pagination.totalPages > 1" class="mt-6">
        <AppPagination :page="data.pagination.page" :total-pages="data.pagination.totalPages" @change="page = $event" />
      </div>
    </template>
  </div>
</template>
