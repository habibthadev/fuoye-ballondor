<script setup lang="ts">
import { ref } from 'vue'
import { AnimatePresence } from 'motion-v'
import AdminHeader from '../components/layout/AdminHeader.vue'
import NavDialog from '../components/layout/NavDialog.vue'
import ScrollToTop from '../components/ui/ScrollToTop.vue'

const showNav = ref(false)

function openNav() {
  showNav.value = true
}

function closeNav() {
  showNav.value = false
}
</script>

<template>
  <div class="min-h-dvh bg-surface overflow-x-hidden">
    <AdminHeader @open-nav="openNav" />
    <main class="px-4 py-6 md:px-8 md:py-8">
      <router-view />
    </main>
    <AnimatePresence>
      <NavDialog v-if="showNav" key="admin-nav-dialog" @close="closeNav" />
    </AnimatePresence>
    <ScrollToTop />
  </div>
</template>
