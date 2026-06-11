import { API_BASE } from '../config/api.js'
import { useAuthStore } from '../stores/auth.store'

let isRefreshing = false
let pendingQueue: Array<{
  resolve: (token: string) => void
  reject: (err: Error) => void
}> = []

function getToken(): string | null {
  return localStorage.getItem('accessToken')
}

function setToken(token: string) {
  localStorage.setItem('accessToken', token)
}

function clearToken() {
  localStorage.removeItem('accessToken')
}

async function refreshAccessToken(): Promise<string> {
  const res = await fetch(`${API_BASE}/api/admin/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!res.ok) {
    clearToken()
    window.location.href = '/admin/login'
    throw new Error('Session expired')
  }

  const data = await res.json()
  setToken(data.accessToken)
  try {
    const auth = useAuthStore()
    auth.accessToken = data.accessToken
  } catch {}
  return data.accessToken
}

function processQueue(token: string | null, error: Error | null) {
  for (const item of pendingQueue) {
    if (error) {
      item.reject(error)
    } else {
      item.resolve(token!)
    }
  }
  pendingQueue = []
}

interface ApiFetchOptions extends RequestInit {
  params?: Record<string, string | number | undefined>
}

export async function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options

  let url = `${API_BASE}/api${path}`
  if (params) {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) searchParams.set(key, String(value))
    }
    const qs = searchParams.toString()
    if (qs) url += `?${qs}`
  }

  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string>),
  }

  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const isFormData = fetchOptions.body instanceof FormData
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  let response = await fetch(url, {
    ...fetchOptions,
    headers,
  })

  if (response.status === 401 && token) {
    if (!isRefreshing) {
      isRefreshing = true

      try {
        const newToken = await refreshAccessToken()
        isRefreshing = false
        processQueue(newToken, null)

        headers['Authorization'] = `Bearer ${newToken}`
        response = await fetch(url, {
          ...fetchOptions,
          headers,
        })
      } catch (err) {
        isRefreshing = false
        processQueue(null, err as Error)
        throw err
      }
    } else {
      const newToken = await new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      })
      headers['Authorization'] = `Bearer ${newToken}`
      response = await fetch(url, {
        ...fetchOptions,
        headers,
      })
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(errorBody.error || `HTTP ${response.status}`)
  }

  return response.json()
}
