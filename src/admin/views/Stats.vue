<template>
  <div class="p-8">
    <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
      <span class="i-fa-solid-chart-pie text-xl"></span>
      Statistiques
      <Select
        v-model="selectedYear"
        :options="availableYears"
        size="small"
        class="ml-3 w-28 font-normal text-base"
      />
    </h2>

    <div v-if="loading" class="flex items-center gap-2 text-base-content/50">
      <span class="loading loading-spinner loading-sm"></span>
      Chargement...
    </div>

    <template v-else>
      <!-- KPIs -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="card bg-base-200 p-4">
          <p class="text-xs text-base-content/50 uppercase tracking-wide mb-1">Revenus {{ selectedYear }}</p>
          <p class="text-2xl font-bold font-mono">{{ fmt(totalRevenu) }}</p>
          <p class="text-xs text-base-content/40 mt-1">{{ currency }} · encaissé</p>
        </div>
        <div class="card bg-base-200 p-4">
          <p class="text-xs text-base-content/50 uppercase tracking-wide mb-1">Charges {{ selectedYear }}</p>
          <p class="text-2xl font-bold font-mono">{{ fmt(totalCharges) }}</p>
          <p class="text-xs text-base-content/40 mt-1">{{ currency }} · décaissé</p>
        </div>
        <div class="card bg-base-200 p-4">
          <p class="text-xs text-base-content/50 uppercase tracking-wide mb-1">Charges sociales</p>
          <p class="text-2xl font-bold font-mono">{{ fmt(chargesSociales) }}</p>
          <p class="text-xs text-base-content/40 mt-1">{{ currency }} · AVS + LPP + LAA</p>
        </div>
        <div class="card bg-base-200 p-4">
          <p class="text-xs text-base-content/50 uppercase tracking-wide mb-1">Ratio charges / revenus</p>
          <p
            class="text-2xl font-bold font-mono"
            :class="ratioCharges !== null && ratioCharges > 80 ? 'text-error' : ratioCharges !== null && ratioCharges > 60 ? 'text-warning' : ''"
          >
            {{ ratioCharges !== null ? `${ratioCharges.toFixed(1)}\u202f%` : '—' }}
          </p>
          <p class="text-xs text-base-content/40 mt-1">part des revenus en charges</p>
        </div>
      </div>

      <!-- Donut + Trend -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="card bg-base-200 p-5">
          <h3 class="font-semibold mb-4">Charges par catégorie — {{ selectedYear }}</h3>
          <Chart
            type="doughnut"
            :data="chargesByCategoryChartData"
            :options="donutOptions"
            style="max-height: 340px;"
          />
        </div>
        <div class="card bg-base-200 p-5">
          <h3 class="font-semibold mb-4">Évolution des charges par catégorie (5 ans)</h3>
          <Chart
            type="line"
            :data="categoryTrendsChartData"
            :options="trendOptions"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useStorage } from '@vueuse/core'
import Chart from 'primevue/chart'
import Select from 'primevue/select'
import useLedgerStats from '../composables/useLedgerStats'
import useSettings from '../composables/useSettings'

const realYear = new Date().getFullYear()
const selectedYear = useStorage('stats-year', realYear)

const {
  load,
  availableYears,
  totalRevenu,
  totalCharges,
  chargesSociales,
  ratioCharges,
  chargesByCategoryChartData,
  categoryTrendsChartData,
} = useLedgerStats(selectedYear)

const { settings, loadSettings } = useSettings()
const currency = computed(() => settings.value?.currency ?? 'CHF')
const loading = ref(true)

const fmt = (n: number): string => {
  const sign = n < 0 ? '-' : ''
  const [intPart, decPart] = Math.abs(n).toFixed(2).split('.')
  const formattedInt = Number(intPart) >= 10000
    ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "'")
    : intPart
  return `${sign}${formattedInt}.${decPart}`
}

const gridColor = 'rgba(128,128,128,0.1)'
const fmtTick = (v: any) => new Intl.NumberFormat('fr-CH', { notation: 'compact' }).format(v)

const donutOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { position: 'right' as const },
    tooltip: {
      callbacks: {
        label: (ctx: any) => ` ${ctx.label}: ${fmt(ctx.parsed)}`,
      },
    },
  },
}

const trendOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { position: 'bottom' as const },
    tooltip: {
      callbacks: {
        label: (ctx: any) => ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y)}`,
      },
    },
  },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, ticks: { callback: fmtTick }, grid: { color: gridColor } },
  },
}

onMounted(async () => {
  await Promise.all([load(), loadSettings()])
  loading.value = false
})
</script>
