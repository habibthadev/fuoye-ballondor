<script setup lang="ts">
import { ref } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiFetch } from '../../utils/api'
import AppBadge from '../../components/ui/AppBadge.vue'
import AppButton from '../../components/ui/AppButton.vue'
import AppInput from '../../components/ui/AppInput.vue'
import AppModal from '../../components/ui/AppModal.vue'
import AppSkeleton from '../../components/ui/AppSkeleton.vue'
import AppToast from '../../components/ui/AppToast.vue'

interface Admin {
  _id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

const queryClient = useQueryClient()
const showCreate = ref(false)
const createName = ref('')
const createEmail = ref('')
const createPassword = ref('')
const createRole = ref<'admin' | 'superadmin'>('admin')
const createError = ref('')
const toastMsg = ref('')
const toastType = ref<'success' | 'error' | 'info'>('success')
const showToast = ref(false)

const { data, isLoading } = useQuery({
  queryKey: ['admin-admins'],
  queryFn: () => apiFetch<{ data: Admin[] }>('/admin/admins'),
})

const createMutation = useMutation({
  mutationFn: () =>
    apiFetch('/admin/admins', {
      method: 'POST',
      body: JSON.stringify({
        name: createName.value,
        email: createEmail.value,
        password: createPassword.value,
        role: createRole.value,
      }),
    }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['admin-admins'] })
    showCreate.value = false
    createName.value = ''
    createEmail.value = ''
    createPassword.value = ''
    createRole.value = 'admin'
    createError.value = ''
    toastMsg.value = 'Admin created successfully'
    toastType.value = 'success'
    showToast.value = true
  },
  onError: (err: Error) => {
    createError.value = err.message
  },
})

function openCreate() {
  createError.value = ''
  showCreate.value = true
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div />
      <AppButton size="sm" @click="openCreate">+ Create Admin</AppButton>
    </div>

    <div v-if="isLoading" class="space-y-3">
      <div v-for="i in 3" :key="i"><AppSkeleton height="56px" /></div>
    </div>
    <div v-else-if="data?.data?.length" class="overflow-x-auto rounded-2xl border border-border bg-white">
      <table class="w-full min-w-[400px] text-left text-sm">
        <thead class="border-b border-border/50 bg-surface text-xs font-700 tracking-wider text-muted uppercase">
          <tr>
            <th class="px-4 py-3">Name</th>
            <th class="px-4 py-3">Email</th>
            <th class="px-4 py-3">Role</th>
            <th class="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="admin in data.data" :key="admin._id" class="border-b border-border/30 transition-colors hover:bg-surface/50">
            <td class="whitespace-nowrap px-4 py-3 font-600 text-ink">{{ admin.name }}</td>
            <td class="px-4 py-3 text-muted">{{ admin.email }}</td>
            <td class="px-4 py-3"><AppBadge :variant="admin.role === 'superadmin' ? 'default' : 'warning'">{{ admin.role }}</AppBadge></td>
            <td class="px-4 py-3"><AppBadge :variant="admin.isActive ? 'success' : 'danger'">{{ admin.isActive ? 'Active' : 'Inactive' }}</AppBadge></td>
          </tr>
        </tbody>
      </table>
    </div>

    <AppModal :show="showCreate" @close="showCreate = false">
      <template #title>Create Admin</template>
      <form class="space-y-4" @submit.prevent="createMutation.mutate()">
        <AppInput v-model="createName" label="Name" placeholder="Full name" required />
        <AppInput v-model="createEmail" label="Email" type="email" placeholder="admin@fuoye.edu.ng" required />
        <AppInput v-model="createPassword" label="Password" type="password" placeholder="Min 12 characters" required />
        <div>
          <label class="mb-1 block text-xs font-700 tracking-wider text-muted uppercase">Role</label>
          <div class="flex gap-3">
            <label class="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm has-[:checked]:border-blue has-[:checked]:bg-blue-10">
              <input v-model="createRole" type="radio" value="admin" class="accent-blue" />
              Admin
            </label>
            <label class="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm has-[:checked]:border-blue has-[:checked]:bg-blue-10">
              <input v-model="createRole" type="radio" value="superadmin" class="accent-blue" />
              Superadmin
            </label>
          </div>
        </div>
        <p v-if="createError" class="text-xs text-rose">{{ createError }}</p>
        <div class="flex justify-end gap-3 pt-2">
          <AppButton variant="outline" size="sm" type="button" @click="showCreate = false">Cancel</AppButton>
          <AppButton size="sm" type="submit" :loading="createMutation.isPending.value">Create</AppButton>
        </div>
      </form>
    </AppModal>

    <AppToast :show="showToast" :message="toastMsg" :type="toastType" @close="showToast = false" />
  </div>
</template>
