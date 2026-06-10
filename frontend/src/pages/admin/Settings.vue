<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiFetch } from '../../utils/api'
import AppCard from '../../components/ui/AppCard.vue'
import AppButton from '../../components/ui/AppButton.vue'

interface SettingsData {
  votingActive: boolean
  flutterwaveEnabled: boolean
}

const votingActive = ref(false)
const flutterwaveEnabled = ref(true)
const saving = ref(false)
const saved = ref(false)

async function loadSettings() {
  try {
    const json = await apiFetch<{ data: SettingsData }>('/admin/settings')
    const s = json.data
    votingActive.value = s.votingActive ?? false
    flutterwaveEnabled.value = s.flutterwaveEnabled ?? true
  } catch {}
}

async function saveSettings() {
  saving.value = true
  saved.value = false
  try {
    await apiFetch('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify({
        votingActive: votingActive.value,
        flutterwaveEnabled: flutterwaveEnabled.value,
      }),
    })
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } finally {
    saving.value = false
  }
}

onMounted(loadSettings)
</script>

<template>
  <div class="space-y-6">
    <AppCard>
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 class="text-base font-700 text-ink sm:text-lg">Voting Status</h3>
          <p class="text-sm text-muted">{{ votingActive ? 'Voting is open' : 'Voting is closed' }}</p>
        </div>
        <button
          class="relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors"
          :class="votingActive ? 'bg-emerald-500' : 'bg-border'"
          @click="votingActive = !votingActive"
        >
          <span class="inline-block h-6 w-6 transform rounded-full bg-white transition-transform" :class="votingActive ? 'translate-x-7' : 'translate-x-1'" />
        </button>
      </div>
    </AppCard>

    <AppCard>
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 class="text-base font-700 text-ink sm:text-lg">Flutterwave Payments</h3>
          <p class="text-sm text-muted">{{ flutterwaveEnabled ? 'Online payments active' : 'Online payments disabled' }}</p>
        </div>
        <button
          class="relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors"
          :class="flutterwaveEnabled ? 'bg-blue' : 'bg-border'"
          @click="flutterwaveEnabled = !flutterwaveEnabled"
        >
          <span class="inline-block h-6 w-6 transform rounded-full bg-white transition-transform" :class="flutterwaveEnabled ? 'translate-x-7' : 'translate-x-1'" />
        </button>
      </div>
    </AppCard>

    <AppCard class="!p-5">
      <h3 class="text-sm font-700 text-ink">Per-Category Pricing Active</h3>
      <p class="mt-1 text-xs text-muted">Vote prices are set per category. Ballon D'or categories are ₦200/vote, all others ₦100/vote. Update prices in the <router-link to="/admin/categories" class="text-blue underline">Categories</router-link> page.</p>
    </AppCard>

    <div class="flex items-center gap-4">
      <AppButton variant="primary" :loading="saving" @click="saveSettings">Save Settings</AppButton>
      <span v-if="saved" class="text-sm font-600 text-emerald-600">Settings saved</span>
    </div>
  </div>
</template>
