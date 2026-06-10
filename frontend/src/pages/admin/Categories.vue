<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { Edit01Icon } from '@hugeicons/core-free-icons'
import { apiFetch } from '../../utils/api'
import AppSkeleton from '../../components/ui/AppSkeleton.vue'
import AppModal from '../../components/ui/AppModal.vue'

interface Category {
  _id: string
  name: string
  slug: string
  description: string
  iconName: string
  coverImage?: string
  order: number
  isActive: boolean
  pricePerVote?: number
}

const queryClient = useQueryClient()

const { data, isLoading } = useQuery({
  queryKey: ['admin-categories'],
  queryFn: () => apiFetch<{ data: Category[] }>('/admin/categories'),
})

const editingId = ref<string | null>(null)
const showEdit = ref(false)
const form = reactive({
  name: '',
  slug: '',
  description: '',
  iconName: '',
  order: 0,
  isActive: true,
  pricePerVote: 100,
  coverImage: '',
})

function openEdit(cat: Category) {
  editingId.value = cat._id
  form.name = cat.name
  form.slug = cat.slug
  form.description = cat.description
  form.iconName = cat.iconName
  form.order = cat.order
  form.isActive = cat.isActive
  form.pricePerVote = cat.pricePerVote ?? 100
  form.coverImage = cat.coverImage ?? ''
  showEdit.value = true
}

function closeEdit() {
  showEdit.value = false
  editingId.value = null
}

const { isPending: saving, mutate: updateCategory } = useMutation({
  mutationFn: (payload: Partial<Category>) =>
    apiFetch<{ data: Category }>(`/admin/categories/${editingId.value}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
    closeEdit()
  },
})

function handleSave() {
  updateCategory({
    name: form.name,
    slug: form.slug,
    description: form.description,
    iconName: form.iconName,
    order: form.order,
    isActive: form.isActive,
    pricePerVote: form.pricePerVote,
    coverImage: form.coverImage || undefined,
  })
}
</script>

<template>
  <div>
    <div v-if="isLoading" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="i in 7" :key="i"><AppSkeleton height="160px" /></div>
    </div>
    <div v-else-if="data?.data?.length" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="cat in data.data"
        :key="cat._id"
        class="rounded-2xl border border-border bg-white p-5 transition-colors hover:border-blue/30 sm:p-6"
      >
        <div class="flex items-start justify-between gap-3">
          <h3 class="text-base font-700 text-ink sm:text-lg">{{ cat.name }}</h3>
          <button
            @click="openEdit(cat)"
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-blue"
            aria-label="Edit category"
          >
            <HugeiconsIcon :icon="Edit01Icon" :size="14" />
          </button>
        </div>
        <div class="mt-2 space-y-1">
          <p class="text-xs text-muted"><span class="text-[10px] font-700 tracking-wider uppercase">Slug:</span> {{ cat.slug }}</p>
          <p class="text-xs text-muted"><span class="text-[10px] font-700 tracking-wider uppercase">Order:</span> {{ cat.order }}</p>
          <p class="text-xs text-muted">
            <span class="text-[10px] font-700 tracking-wider uppercase">Price:</span>
            <button
              @click="openEdit(cat)"
              class="ml-1 rounded-md border border-dashed border-border px-1.5 py-0.5 text-xs font-700 text-blue transition-colors hover:border-blue/40 hover:bg-blue/5"
            >₦{{ cat.pricePerVote ?? 100 }}/vote</button>
          </p>
        </div>
        <div class="mt-4 flex items-center gap-3">
          <span
            class="inline-block rounded-full px-3 py-0.5 text-xs font-700"
            :class="cat.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose/10 text-rose'"
          >{{ cat.isActive ? 'Active' : 'Inactive' }}</span>
        </div>
      </div>
    </div>

    <AppModal :show="showEdit" title="Edit Category" @close="closeEdit">
      <form @submit.prevent="handleSave" class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="mb-1.5 block text-[10px] font-700 tracking-wider text-muted uppercase">Name</label>
            <input
              v-model="form.name"
              class="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-blue focus:ring-1 focus:ring-blue/20"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-[10px] font-700 tracking-wider text-muted uppercase">Slug</label>
            <input
              v-model="form.slug"
              class="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-blue focus:ring-1 focus:ring-blue/20"
            />
          </div>
        </div>
        <div>
          <label class="mb-1.5 block text-[10px] font-700 tracking-wider text-muted uppercase">Description</label>
          <textarea
            v-model="form.description"
            rows="2"
            class="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-blue focus:ring-1 focus:ring-blue/20"
          />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="mb-1.5 block text-[10px] font-700 tracking-wider text-muted uppercase">Icon Name</label>
            <input
              v-model="form.iconName"
              class="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-blue focus:ring-1 focus:ring-blue/20"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-[10px] font-700 tracking-wider text-muted uppercase">Order</label>
            <input
              v-model.number="form.order"
              type="number"
              min="0"
              class="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-blue focus:ring-1 focus:ring-blue/20"
            />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="mb-1.5 block text-[10px] font-700 tracking-wider text-muted uppercase">Price per Vote (₦)</label>
            <input
              v-model.number="form.pricePerVote"
              type="number"
              min="1"
              max="10000"
              class="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-blue focus:ring-1 focus:ring-blue/20"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-[10px] font-700 tracking-wider text-muted uppercase">Status</label>
            <label class="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-sm text-ink transition-colors hover:border-blue/30">
              <div
                class="h-5 w-9 rounded-full transition-colors"
                :class="form.isActive ? 'bg-blue' : 'bg-border'"
              >
                <div
                  class="h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
                  :class="form.isActive ? 'translate-x-4' : 'translate-x-0'"
                />
              </div>
              <input v-model="form.isActive" type="checkbox" class="sr-only" />
              <span class="text-xs font-600" :class="form.isActive ? 'text-emerald-700' : 'text-muted'">{{ form.isActive ? 'Active' : 'Inactive' }}</span>
            </label>
          </div>
        </div>
        <div class="flex gap-3 pt-2">
          <button
            type="button"
            @click="closeEdit"
            class="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-700 text-muted transition-colors hover:bg-surface"
          >Cancel</button>
          <button
            type="submit"
            :disabled="saving"
            class="flex-1 rounded-xl bg-blue px-4 py-2.5 text-sm font-700 text-white transition-colors hover:bg-blue/80 disabled:cursor-not-allowed disabled:opacity-30"
          >{{ saving ? 'Saving...' : 'Save' }}</button>
        </div>
      </form>
    </AppModal>
  </div>
</template>