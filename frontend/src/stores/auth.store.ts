import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { API_BASE } from '../config/api.js'

interface Admin {
  id: string
  name: string
  email: string
  role: string
}

export const useAuthStore = defineStore('auth', () => {
  const admin = ref<Admin | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const isAuthenticated = computed(() => !!admin.value)

  let refreshPromise: Promise<boolean> | null = null

  async function login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Login failed')
    }

    const data = await res.json()
    accessToken.value = data.accessToken
    admin.value = data.admin
    localStorage.setItem('accessToken', data.accessToken)
  }

  async function refreshToken() {
    if (refreshPromise) return refreshPromise

    refreshPromise = (async () => {
      const res = await fetch(`${API_BASE}/api/admin/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!res.ok) {
        accessToken.value = null
        admin.value = null
        localStorage.removeItem('accessToken')
        return false
      }

      const data = await res.json()
      accessToken.value = data.accessToken
      admin.value = data.admin
      localStorage.setItem('accessToken', data.accessToken)
      return true
    })()

    refreshPromise.finally(() => { refreshPromise = null })
    return refreshPromise
  }

  async function logout() {
    refreshPromise = null
    try {
      await fetch(`${API_BASE}/api/admin/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken.value}` },
        credentials: 'include',
      })
    } catch {}
    accessToken.value = null
    admin.value = null
    localStorage.removeItem('accessToken')
  }

  return { admin, accessToken, isAuthenticated, login, refreshToken, logout }
})
