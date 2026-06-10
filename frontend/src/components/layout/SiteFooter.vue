<script setup lang="ts">
const categories = [
  { name: "Ballon D'or (Male)", slug: 'male-ballon-dor' },
  { name: 'Kopa Trophy', slug: 'kopa-trophy' },
  { name: 'Yashin Trophy', slug: 'yashin-trophy' },
  { name: "Ballon D'or (Female)", slug: 'female-ballon-dor' },
  { name: 'Defender of the Year', slug: 'defender-of-the-year' },
  { name: 'Playmaker of the Year', slug: 'playmaker-of-the-year' },
  { name: 'Attacker of the Year', slug: 'attacker-of-the-year' },
]
</script>

<template>
  <footer class="relative overflow-hidden border-t border-border bg-surface" style="padding-bottom: env(safe-area-inset-bottom)">
    <div class="pointer-events-none absolute inset-0 opacity-[0.03] bg-pattern-conic" />
    <div class="relative mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
      <div class="grid gap-10 md:grid-cols-12">
        <div class="md:col-span-5">
          <div class="mb-4 flex items-center gap-3">
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-white p-[5px] ring-1 ring-border"><img src="/images/fuoye-logo.webp" alt="FUOYE" class="h-full w-full object-contain" /></span>
            <div>
              <span class="text-base font-800 text-ink">FUOYE Ballon D'Or</span>
              <span class="block text-[9px] font-600 tracking-[0.12em] text-blue uppercase">The Golden Verdict</span>
            </div>
          </div>
          <p class="mt-3 max-w-xs text-sm leading-relaxed text-muted">Celebrating FUOYE's finest football talents. Seven categories, one campus, one verdict.</p>
          <div class="mt-5 flex items-center gap-4">
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-white p-[5px] ring-1 ring-border"><img src="/images/fuoye-sug-logo.webp" alt="FUOYESUG" class="h-full w-full object-contain" title="FUOYESUG" /></span>
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-white p-[5px] ring-1 ring-border"><img src="/images/bdc-logo.webp" alt="BDC" class="h-full w-full object-contain" title="Better Days Cabinet" /></span>
          </div>
        </div>
        <div class="md:col-span-4">
          <h6 class="mb-4 text-xs font-700 tracking-[0.12em] text-muted/70 uppercase">Categories</h6>
          <ul class="space-y-2.5">
            <li v-for="cat in categories" :key="cat.slug">
              <router-link :to="`/categories/${cat.slug}`" class="text-sm text-muted transition-colors hover:text-ink">{{ cat.name }}</router-link>
            </li>
          </ul>
        </div>
        <div class="md:col-span-3">
          <h6 class="mb-4 text-xs font-700 tracking-[0.12em] text-muted/70 uppercase">Links</h6>
          <ul class="space-y-2.5">
            <li><router-link to="/categories" class="text-sm text-muted transition-colors hover:text-ink">Categories</router-link></li>
            <li><a href="#how-it-works" class="text-sm text-muted transition-colors hover:text-ink">How It Works</a></li>
            <li><router-link to="/admin/login" class="text-sm text-muted transition-colors hover:text-ink">Admin</router-link></li>
          </ul>
        </div>
      </div>
      <div class="mt-12 border-t border-border pt-8 text-center">
        <p class="text-xs text-muted/50">2026 &middot; FUOYE Ballon D'Or &middot; Powered by FUOYESUG &amp; Better Days Cabinet</p>
        <p class="mt-3 text-xs text-muted/40">Built by <a href="https://habibthadev.tech" target="_blank" rel="noopener noreferrer" class="text-blue transition-colors hover:text-ink">habibthadev</a></p>
      </div>
    </div>
  </footer>
</template>