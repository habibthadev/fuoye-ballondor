<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiFetch } from '../../utils/api'
import AppBadge from '../../components/ui/AppBadge.vue'
import AppEmpty from '../../components/ui/AppEmpty.vue'
import AppPagination from '../../components/ui/AppPagination.vue'
import AppSkeleton from '../../components/ui/AppSkeleton.vue'

interface Category {
  _id: string
  name: string
  slug: string
}

interface Nominee {
  _id: string
  name: string
  department: string
  position: string
  categoryId: { name: string }
  voteCount: number
  isActive: boolean
}

const route = useRoute()
const router = useRouter()
const page = computed(() => Number(route.query.page) || 1)
const search = computed(() => (route.query.search as string) || '')
const activeCategory = computed(() => (route.query.category as string) || null)

const { data: categoriesData } = useQuery({
  queryKey: ['admin-categories-list'],
  queryFn: () => apiFetch<{ data: Category[] }>('/admin/categories'),
  staleTime: 5 * 60 * 1000,
})

const categories = computed<Category[]>(() => categoriesData.value?.data ?? [])

const { data, isLoading } = useQuery({
  queryKey: ['admin-nominees', page, search, activeCategory],
  queryFn: () => apiFetch<{ data: Nominee[]; pagination: { page: number; totalPages: number } }>('/admin/nominees', {
    params: { page: page.value, limit: 25, search: search.value || undefined, categoryId: activeCategory.value || undefined },
  }),
  staleTime: 30_000,
  placeholderData: (prev) => prev,
})

function selectCategory(id: string | null) {
  router.push({ query: { ...route.query, category: id || undefined, page: undefined } })
}

function onSearch(v: string) {
  router.push({ query: { ...route.query, search: v || undefined, page: undefined } })
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex gap-2 overflow-x-auto pb-1">
        <button
          class="shrink-0 rounded-full px-4 py-1.5 text-xs font-700 transition-colors whitespace-nowrap"
          :class="!activeCategory ? 'bg-blue text-white' : 'bg-surface text-muted hover:bg-border hover:text-ink'"

          @click="selectCategory(null)"
        >All</button>
        <button
          v-for="cat in categories"
          :key="cat._id"
          class="shrink-0 rounded-full px-4 py-1.5 text-xs font-700 transition-colors whitespace-nowrap"
          :class="activeCategory === cat._id ? 'bg-blue text-white' : 'bg-surface text-muted hover:bg-border hover:text-ink'"
          @click="selectCategory(cat._id)"
        >{{ cat.name }}</button>
      </div>
      <input
        :value="search"
        placeholder="Search nominees..."
        class="w-full rounded-xl border-2 border-border px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-2 focus:border-blue sm:w-64"
        @input="onSearch(($event.target as HTMLInputElement).value)"
      />
    </div>

    <div v-if="isLoading" class="space-y-3">
      <div v-for="i in 5" :key="i"><AppSkeleton height="52px" /></div>
    </div>

    <template v-else>
      <div class="overflow-x-auto rounded-2xl border border-border bg-white">
        <table class="w-full min-w-[600px] text-left text-sm">
          <thead class="border-b border-border/50 bg-surface text-xs font-700 tracking-wider text-muted uppercase">
            <tr>
              <th class="px-4 py-3">Name</th>
              <th class="px-4 py-3">Department</th>
              <th class="px-4 py-3">Position</th>
              <th class="px-4 py-3">Category</th>
              <th class="px-4 py-3">Votes</th>
              <th class="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody v-if="data?.data?.length">
            <tr v-for="nominee in data.data" :key="nominee._id" class="border-b border-border/30 transition-colors hover:bg-surface/50">
              <td class="whitespace-nowrap px-4 py-3 font-600 text-ink">{{ nominee.name }}</td>
              <td class="px-4 py-3 text-muted">{{ nominee.department }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-muted">{{ nominee.position }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-muted">{{ nominee.categoryId?.name }}</td>
              <td class="whitespace-nowrap px-4 py-3 font-700 text-blue tabular-nums">{{ nominee.voteCount }}</td>
              <td class="px-4 py-3"><AppBadge :variant="nominee.isActive ? 'success' : 'danger'">{{ nominee.isActive ? 'Active' : 'Inactive' }}</AppBadge></td>
            </tr>
          </tbody>
        </table>
        <AppEmpty v-if="!data?.data?.length" />
      </div>

      <div v-if="data?.pagination && data.pagination.totalPages > 1" class="mt-6">
        <AppPagination :page="data.pagination.page" :total-pages="data.pagination.totalPages" @change="p => router.push({ query: { ...route.query, page: String(p) } })" />
      </div>
    </template>
  </div>
</template>
