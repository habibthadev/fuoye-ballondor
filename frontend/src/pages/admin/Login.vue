<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store'
import { HugeiconsIcon } from '@hugeicons/vue'
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'

const auth = useAuthStore()
const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    router.push('/admin/dashboard')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative flex min-h-dvh bg-surface">
    <div class="absolute inset-0 overflow-hidden">
      <img src="/images/hero-bg.webp" alt="" aria-hidden="true" class="h-full w-full object-cover opacity-[0.04]" />
    </div>

    <div class="relative mx-auto flex w-full max-w-md flex-col justify-center px-5 py-12">
      <router-link
        to="/"
        class="mb-12 flex items-center gap-2 text-xs font-600 text-muted transition-colors hover:text-ink md:mb-16"
      >
        <HugeiconsIcon :icon="ArrowLeft01Icon" :size="16" />
        Back to site
      </router-link>

      <div class="rounded-3xl border border-border bg-white p-8 shadow-sm md:p-10">
        <div class="mb-8 text-center">
          <div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue/10">
            <img src="/images/fuoye-logo.webp" alt="FUOYE" class="h-8 w-8 object-contain" />
          </div>
          <h1 class="text-xl font-800 text-ink md:text-2xl">Welcome back</h1>
          <p class="mt-1 text-sm text-muted">Sign in to the admin panel</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="mb-2 block text-[11px] font-700 tracking-[0.12em] text-muted uppercase">Email</label>
            <input
              v-model="email"
              type="email"
              placeholder="admin@fuoye.edu.ng"
              autocomplete="email"
              class="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-muted/50 focus:border-blue focus:ring-1 focus:ring-blue/20"
            />
          </div>

          <div>
            <label class="mb-2 block text-[11px] font-700 tracking-[0.12em] text-muted uppercase">Password</label>
            <input
              v-model="password"
              type="password"
              placeholder="Enter your password"
              autocomplete="current-password"
              class="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-muted/50 focus:border-blue focus:ring-1 focus:ring-blue/20"
            />
          </div>

          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="translate-y-1 opacity-0"
            leave-active-class="transition-all duration-150 ease-in"
            leave-to-class="translate-y-1 opacity-0"
          >
            <p v-if="error" class="rounded-xl bg-rose/10 px-4 py-3 text-sm font-600 text-rose ring-1 ring-rose/20">{{ error }}</p>
          </Transition>

          <button
            type="submit"
            class="mt-2 w-full rounded-xl bg-blue px-6 py-3.5 text-sm font-800 tracking-wider text-white transition-all hover:bg-blue/80 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-30"
            :disabled="loading"
          >
            <span v-if="loading" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span v-else>Sign in</span>
          </button>
        </form>
      </div>

      <p class="mt-8 text-center text-xs text-muted/50">
        FUOYE Ballon D'Or &middot; Admin Panel
      </p>
    </div>
  </div>
</template>