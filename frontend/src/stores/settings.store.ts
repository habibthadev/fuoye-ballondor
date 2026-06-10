import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API_BASE } from '../config/api.js'

interface Settings {
  votingActive: boolean
  flutterwaveEnabled: boolean
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings | null>(null)

  async function fetchSettings() {
    const res = await fetch(`${API_BASE}/api/admin/settings`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    })
    if (res.ok) {
      const data = await res.json()
      settings.value = data.data
    }
  }

  return { settings, fetchSettings }
})
