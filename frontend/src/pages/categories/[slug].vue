<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { useRoute } from 'vue-router'
import { ref, computed } from 'vue'
import AppSkeleton from '../../components/ui/AppSkeleton.vue'
import AppPagination from '../../components/ui/AppPagination.vue'
import AppBadge from '../../components/ui/AppBadge.vue'
import AppEmpty from '../../components/ui/AppEmpty.vue'
import { API_BASE } from '../../config/api.js'

const route = useRoute()
const page = ref(1)
const slug = computed(() => route.params.slug as string)

const { data, isLoading } = useQuery({
  queryKey: ['category-nominees', slug, page],
  queryFn: () => fetch(`${API_BASE}/api/nominees?slug=${slug.value}&page=${page.value}&limit=20`).then(r => r.json()),
})

const { data: category } = useQuery({
  queryKey: ['category', slug],
  queryFn: () => fetch(`${API_BASE}/api/categories/${slug.value}`).then(r => r.json()),
})
</script>

<template>
  <div class="min-h-screen bg-surface py-16 md:py-24">
    <div class="mx-auto max-w-7xl px-4 md:px-6">
      <div v-if="category" class="mb-10 md:mb-12">
        <AppBadge class="mb-4">{{ category.data.name }}</AppBadge>
        <h1 class="text-3xl font-800 text-ink md:text-5xl">{{ category.data.name }}</h1>
        <p class="mt-3 max-w-xl text-base leading-relaxed text-muted">{{ category.data.description }}</p>
      </div>

      <div v-if="isLoading" class="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        <div v-for="i in 6" :key="i"><AppSkeleton height="360px" /></div>
      </div>

      <div v-else-if="data?.data?.length" class="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        <router-link
          v-for="nominee in data.data"
          :key="nominee._id"
          :to="`/nominees/${nominee._id}`"
          class="group overflow-hidden rounded-2xl border border-border/50 bg-white transition-colors hover:border-blue/30"
        >
          <div class="aspect-[4/5] overflow-hidden bg-surface">
            <img :src="nominee.imageUrl" :alt="nominee.name" loading="lazy" class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
          </div>
          <div class="space-y-1.5 p-4 md:p-5">
            <h3 class="text-base font-700 text-ink md:text-lg">{{ nominee.name }}</h3>
            <p class="text-sm text-muted">{{ nominee.department }}</p>
            <div class="pt-1">
              <AppBadge>{{ nominee.position }}</AppBadge>
            </div>
          </div>
        </router-link>
      </div>

      <AppEmpty v-else />

      <div v-if="data?.pagination?.totalPages > 1" class="mt-12">
        <AppPagination :page="data.pagination.page" :total-pages="data.pagination.totalPages" @change="page = $event" />
      </div>
    </div>
  </div>
</template>
