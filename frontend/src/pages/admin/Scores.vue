<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { Bar, Pie } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import type { TooltipItem } from 'chart.js'
import { Download01Icon } from '@hugeicons/core-free-icons'
import { apiFetch } from '../../utils/api'
import AppSkeleton from '../../components/ui/AppSkeleton.vue'
import AppEmpty from '../../components/ui/AppEmpty.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

interface NomineeScore {
  _id: string
  name: string
  imageUrl: string
  department: string
  faculty: string
  position: string
  voteCount: number
}

interface CategoryScore {
  _id: string
  name: string
  slug: string
  totalNominees: number
  totalVotes: number
  nominees: NomineeScore[]
}

interface ScoresResponse {
  data: CategoryScore[]
}

const activeCategory = ref<string | null>(null)
const barChartRef = ref<any>(null)
const pieChartRef = ref<any>(null)

const { data, isLoading } = useQuery({
  queryKey: ['admin-scores'],
  queryFn: () => apiFetch<ScoresResponse>('/admin/scores'),
})

const categories = computed(() => data.value?.data ?? [])

const activeScores = computed<CategoryScore | null>(() => {
  if (!activeCategory.value && categories.value.length) {
    const first = categories.value[0]
    if (first) activeCategory.value = first._id
  }
  return categories.value.find(c => c._id === activeCategory.value) ?? null
})

const barColors = ['#0099F6', '#F0457D', '#07122B', '#4FC3F7', '#F06292', '#6C7A89', '#A8D8EA']
const pieColors = [
  '#0099F6', '#F0457D', '#07122B', '#4FC3F7', '#F06292',
  '#6C7A89', '#A8D8EA', '#2E86AB', '#D64550', '#1A936F',
  '#FFA07A', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71',
]

const barChartData = computed(() => {
  const s = activeScores.value
  if (!s) {
    return { labels: [] as string[], datasets: [{ label: 'Votes', data: [] as number[], backgroundColor: [] as string[], borderRadius: 4, borderSkipped: false }] }
  }
  return {
    labels: s.nominees.map(n => n.name.length > 15 ? n.name.slice(0, 15) + '...' : n.name),
    datasets: [{
      label: 'Votes',
      data: s.nominees.map(n => n.voteCount),
      backgroundColor: s.nominees.map((_, i) => barColors[i % barColors.length]),
      borderRadius: 4,
      borderSkipped: false,
    }],
  }
})

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#fff',
      titleColor: '#07122B',
      bodyColor: '#838895',
      borderColor: '#DBDCE0',
      borderWidth: 1,
      cornerRadius: 12,
      padding: 12,
      bodyFont: { size: 12 },
      callbacks: {
        label: (ctx: TooltipItem<'bar'>) => `${ctx.parsed.x ?? 0} votes`,
      },
    },
  },
  scales: {
    x: {
      ticks: { color: '#838895', font: { size: 11 } },
      grid: { color: '#F2F4F7' },
      beginAtZero: true,
    },
    y: {
      ticks: { color: '#07122B', font: { size: 11 } },
      grid: { display: false },
      autoSkip: false,
    },
  },
}

const pieChartData = computed(() => {
  const s = activeScores.value
  if (!s) {
    return { labels: [] as string[], datasets: [{ data: [] as number[], backgroundColor: [] as string[], borderWidth: 0 }] }
  }
  return {
    labels: s.nominees.map(n => n.name),
    datasets: [{
      data: s.nominees.map(n => n.voteCount),
      backgroundColor: s.nominees.map((_, i) => pieColors[i % pieColors.length]),
      borderWidth: 2,
      borderColor: '#fff',
    }],
  }
})

const pieChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        color: '#07122B',
        font: { size: 11, weight: 'bold' as const },
        boxWidth: 12,
        padding: 14,
        usePointStyle: true,
        pointStyle: 'circle' as const,
      },
    },
    tooltip: {
      backgroundColor: '#fff',
      titleColor: '#07122B',
      bodyColor: '#838895',
      borderColor: '#DBDCE0',
      borderWidth: 1,
      cornerRadius: 12,
      padding: 12,
      bodyFont: { size: 12 },
      callbacks: {
        label: (ctx: TooltipItem<'pie'>) => {
          const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0) as number
          const pct = total > 0 ? ((ctx.parsed as number / total) * 100).toFixed(1) : '0'
          return ` ${ctx.parsed} votes (${pct}%)`
        },
      },
    },
  },
}

function downloadChart(chartRef: any, filename: string) {
  const instance = chartRef?.chart
  if (!instance) return
  const url = instance.toBase64Image('image/png', 1)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="isLoading">
      <div class="mb-6 flex gap-2 overflow-x-auto pb-2">
        <div v-for="i in 7" :key="i" class="shrink-0"><AppSkeleton width="120px" height="36px" /></div>
      </div>
      <div class="grid gap-6 lg:grid-cols-2">
        <AppSkeleton height="400px" />
        <AppSkeleton height="400px" />
      </div>
    </div>

    <template v-else-if="categories.length">
      <div class="mb-6 flex gap-2 overflow-x-auto pb-1">
        <button
          v-for="cat in categories"
          :key="cat._id"
          class="shrink-0 rounded-full px-4 py-1.5 text-xs font-700 transition-colors whitespace-nowrap sm:px-5 sm:py-2 sm:text-sm"
          :class="activeCategory === cat._id ? 'bg-blue text-white' : 'bg-surface text-muted hover:bg-border hover:text-ink'"
          @click="activeCategory = cat._id"
        >
          {{ cat.name }}
          <span class="ml-1 text-xs opacity-60">({{ cat.totalVotes }})</span>
        </button>
      </div>

      <div v-if="activeScores">
        <div class="mb-5 flex flex-wrap items-baseline gap-2">
          <h2 class="text-base font-800 text-ink sm:text-lg">{{ activeScores.name }}</h2>
          <span class="text-xs text-muted sm:text-sm">{{ activeScores.totalNominees }} nominees &middot; {{ activeScores.totalVotes }} total votes</span>
        </div>

        <div v-if="!activeScores.nominees.length" class="py-12">
          <AppEmpty title="No votes recorded yet" description="No votes recorded in this category yet" />
        </div>

        <div v-else class="grid gap-5 lg:grid-cols-2">
          <div class="rounded-2xl border border-border bg-white p-4 sm:p-6">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-xs font-700 tracking-wider text-muted uppercase sm:text-sm">Vote Distribution</h3>
              <button
                @click="downloadChart(barChartRef, `${activeScores?.slug || 'category'}-bar`)" class="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[10px] font-700 text-muted transition-colors hover:border-blue/30 hover:text-blue sm:text-xs"
              >
                <HugeiconsIcon :icon="Download01Icon" :size="14" />
                Download
              </button>
            </div>
            <div class="h-[400px] sm:h-[500px]">
              <Bar ref="barChartRef" :data="barChartData" :options="barChartOptions" />
            </div>
          </div>
          <div class="rounded-2xl border border-border bg-white p-4 sm:p-6">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-xs font-700 tracking-wider text-muted uppercase sm:text-sm">Vote Share</h3>
              <button
                @click="downloadChart(pieChartRef, `${activeScores?.slug || 'category'}-pie`)"
                class="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[10px] font-700 text-muted transition-colors hover:border-blue/30 hover:text-blue sm:text-xs"
              >
                <HugeiconsIcon :icon="Download01Icon" :size="14" />
                Download
              </button>
            </div>
            <div class="h-[400px] sm:h-[500px]">
              <Pie ref="pieChartRef" :data="pieChartData" :options="pieChartOptions" />
            </div>
          </div>

          <div class="overflow-x-auto rounded-2xl border border-border bg-white lg:col-span-2">
            <table class="w-full min-w-[480px] text-left text-sm">
              <thead class="border-b border-border/50 bg-surface text-xs font-700 tracking-wider text-muted uppercase">
                <tr>
                  <th class="px-3 py-2.5 sm:px-4 sm:py-3">#</th>
                  <th class="px-3 py-2.5 sm:px-4 sm:py-3">Nominee</th>
                  <th class="px-3 py-2.5 sm:px-4 sm:py-3">Position</th>
                  <th class="hidden px-3 py-2.5 sm:table-cell sm:px-4 sm:py-3">Department</th>
                  <th class="px-3 py-2.5 sm:px-4 sm:py-3">Votes</th>
                  <th class="px-3 py-2.5 sm:px-4 sm:py-3">Share</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(nom, i) in activeScores.nominees"
                  :key="nom._id"
                  class="border-b border-border/30 transition-colors hover:bg-surface/50"
                >
                  <td class="px-3 py-2.5 sm:px-4 sm:py-3">
                    <span
                      class="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-800 sm:h-7 sm:w-7 sm:text-xs"
                      :class="i === 0 ? 'bg-blue/10 text-blue' : i === 1 ? 'bg-surface text-muted' : i === 2 ? 'bg-rose/10 text-rose' : 'bg-surface text-muted'"
                    >{{ i + 1 }}</span>
                  </td>
                  <td class="px-3 py-2.5 sm:px-4 sm:py-3">
                    <div class="flex items-center gap-2 sm:gap-3">
                      <img :src="nom.imageUrl" :alt="nom.name" loading="lazy" class="h-7 w-7 shrink-0 rounded-full object-cover sm:h-8 sm:w-8" />
                      <span class="truncate font-600 text-ink max-w-[120px] sm:max-w-[200px]">{{ nom.name }}</span>
                    </div>
                  </td>
                  <td class="whitespace-nowrap px-3 py-2.5 text-muted sm:px-4 sm:py-3">{{ nom.position }}</td>
                  <td class="hidden whitespace-nowrap px-3 py-2.5 text-muted sm:table-cell sm:px-4 sm:py-3">{{ nom.department }}</td>
                  <td class="whitespace-nowrap px-3 py-2.5 font-800 text-ink tabular-nums sm:px-4 sm:py-3">{{ nom.voteCount }}</td>
                  <td class="px-3 py-2.5 sm:px-4 sm:py-3">
                    <div class="flex items-center gap-1.5 sm:gap-2">
                      <div class="h-1.5 w-12 overflow-hidden rounded-full bg-surface sm:h-2 sm:w-20">
                        <div
                          class="h-full rounded-full transition-all"
                          :style="{ width: activeScores.totalVotes > 0 ? `${(nom.voteCount / activeScores.totalVotes) * 100}%` : '0%', background: barColors[i % barColors.length] }"
                        />
                      </div>
                      <span class="text-[10px] font-600 text-muted tabular-nums sm:text-xs">
                        {{ activeScores.totalVotes > 0 ? ((nom.voteCount / activeScores.totalVotes) * 100).toFixed(1) : 0 }}%
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <div v-else-if="!isLoading" class="py-12">
      <AppEmpty title="No categories found" />
    </div>
  </div>
</template>