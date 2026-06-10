<script setup lang="ts">
import { useRouter } from 'vue-router'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Home01Icon, GridIcon, ArrowRight02Icon } from '@hugeicons/core-free-icons'

const router = useRouter()
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-surface px-4">
    <div class="text-center">
      <div class="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
        <span class="text-3xl font-900 text-blue">404</span>
      </div>

      <h1 class="text-3xl font-800 text-ink md:text-4xl">Page Not Found</h1>
      <p class="mx-auto mt-3 max-w-md text-muted">
        The page you are looking for doesn't exist or has been moved.
      </p>

      <div class="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <router-link
          to="/"
          class="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-700 text-white transition-colors hover:bg-blue"
        >
          <HugeiconsIcon :icon="Home01Icon" :size="16" />
          Go Home
        </router-link>
        <router-link
          to="/categories"
          class="inline-flex items-center gap-2 rounded-full border border-border/50 bg-white px-6 py-3 text-sm font-700 text-ink transition-colors hover:border-blue/30 hover:text-blue"
        >
          <HugeiconsIcon :icon="GridIcon" :size="16" />
          View Categories
        </router-link>
      </div>
    </div>

    <router-link
      to="/"
      class="mt-16 text-xs text-muted transition-colors hover:text-ink"
    >
      FUOYE Ballon D'or 2026 — The Golden Verdict
    </router-link>
  </div>
</template>
