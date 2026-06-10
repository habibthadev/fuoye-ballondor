<script setup lang="ts">
import SiteHeader from '../components/layout/SiteHeader.vue'
import SiteFooter from '../components/layout/SiteFooter.vue'
import ScrollToTop from '../components/ui/ScrollToTop.vue'
</script>

<template>
  <div class="flex min-h-dvh flex-col overflow-x-hidden">
    <SiteHeader />
    <main class="flex-1 pt-16 md:pt-18">
      <router-view />
    </main>
    <SiteFooter />
    <ScrollToTop />
  </div>
</template>
