<template>
  <div class="p-8">
    <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
      <span class="i-fa6-solid-house"></span>
      Tableau de bord
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
      <!-- KPI cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="card bg-base-200 p-4">
          <p class="text-xs text-base-content/50 uppercase tracking-wide mb-1">
            {{ currentMonthLabel }}
          </p>
          <p class="text-2xl font-bold font-mono">{{ fmt(caCurrentMonth) }}</p>
          <p class="text-xs text-base-content/40 mt-1">{{ currency }} · HT · payé</p>
        </div>
        <div class="card bg-base-200 p-4">
          <p class="text-xs text-base-content/50 uppercase tracking-wide mb-1">
            CA {{ selectedYear }}
          </p>
          <p class="text-2xl font-bold font-mono">{{ fmt(caCurrentYear) }}</p>
          <p class="text-xs text-base-content/40 mt-1">{{ currency }} · HT · payé</p>
        </div>
        <div class="card bg-base-200 p-4">
          <p class="text-xs text-base-content/50 uppercase tracking-wide mb-1">CA total</p>
          <p class="text-2xl font-bold font-mono">{{ fmt(caAllTime) }}</p>
          <p class="text-xs text-base-content/40 mt-1">
            {{ currency }} · HT · toutes années · payé
          </p>
        </div>
        <div class="card bg-base-200 p-4 border border-warning/30">
          <p class="text-xs text-base-content/50 uppercase tracking-wide mb-1">En attente</p>
          <p class="text-2xl font-bold font-mono text-warning">{{ fmt(pendingAmount) }}</p>
          <p class="text-xs text-base-content/40 mt-1">
            {{ currency }} · TTC · {{ pendingInvoices.length }} facture{{
              pendingInvoices.length !== 1 ? 's' : ''
            }}
          </p>
        </div>
      </div>

      <!-- CA mensuel + évolution annuelle -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div class="card bg-base-200 p-5 lg:col-span-2">
          <h3 class="font-semibold mb-4">CA mensuel {{ selectedYear }}</h3>
          <Chart type="bar" :data="monthlyChartData" :options="barOptions" />
        </div>
        <div class="flex flex-col gap-6">
          <div class="card bg-base-200 p-5">
            <h3 class="font-semibold mb-4">Évolution annuelle (total)</h3>
            <Chart type="line" :data="annualChartData" :options="lineOptions" />
          </div>
          <div class="card bg-base-200 p-5">
            <h3 class="font-semibold mb-4">À fin {{ prevMonthName }}</h3>
            <Chart type="line" :data="ytdChartData" :options="lineOptions" />
          </div>
        </div>
      </div>

      <!-- Top clients -->
      <div class="card bg-base-200 p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold">Top clients (CA HT payé)</h3>
          <div class="flex items-center gap-2 text-sm text-base-content/60">
            <span :class="!topClientsAllTime ? 'text-base-content font-medium' : ''">{{
              selectedYear
            }}</span>
            <input type="checkbox" v-model="topClientsAllTime" class="toggle toggle-sm" />
            <span :class="topClientsAllTime ? 'text-base-content font-medium' : ''">all time</span>
          </div>
        </div>
        <Chart
          type="bar"
          :data="topClientsAllTime ? topClientsAllTimeChartData : topClientsChartData"
          :options="clientsBarOptions"
          style="max-height: 260px"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useStorage } from '@vueuse/core'
import Chart from 'primevue/chart'
import Select from 'primevue/select'
import useDashboard from '../composables/useDashboard'
import useSettings from '../composables/useSettings'

const realYear = new Date().getFullYear()
const selectedYear = useStorage('dashboard-year', realYear)
const topClientsAllTime = useStorage('dashboard-top-clients-alltime', false)

const {
  load,
  availableYears,
  caAllTime,
  caCurrentYear,
  caCurrentMonth,
  pendingInvoices,
  pendingAmount,
  monthlyChartData,
  annualChartData,
  ytdChartData,
  prevMonthName,
  topClientsChartData,
  topClientsAllTimeChartData,
} = useDashboard(selectedYear)

const { settings, loadSettings } = useSettings()
const currency = computed(() => settings.value?.currency ?? 'CHF')

const loading = ref(true)

const currentMonthLabel = computed(() =>
  selectedYear.value === realYear ? 'CA mois en cours' : `CA décembre ${selectedYear.value}`,
)

const fmt = (n: number): string => {
  const sign = n < 0 ? '-' : ''
  const [intPart, decPart] = Math.abs(n).toFixed(2).split('.')
  const formattedInt =
    Number(intPart) >= 10000 ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "'") : intPart
  return `${sign}${formattedInt}.${decPart}`
}

const gridColor = 'rgba(128,128,128,0.1)'
const fmtTick = (v: any) => new Intl.NumberFormat('fr-CH', { notation: 'compact' }).format(v)
const fmtTooltip = (ctx: any) => ` ${fmt(ctx.parsed.y ?? ctx.parsed)}`

const barOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { position: 'bottom' as const },
    tooltip: { callbacks: { label: fmtTooltip } },
  },
  scales: {
    x: { stacked: true, grid: { display: false } },
    y: { stacked: true, ticks: { callback: fmtTick }, grid: { color: gridColor } },
  },
}))

const lineOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: fmtTooltip } },
  },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, ticks: { callback: fmtTick }, grid: { color: gridColor } },
  },
}

const clientsBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: fmtTooltip } },
  },
  scales: {
    x: { ticks: { callback: fmtTick }, grid: { color: gridColor } },
    y: { grid: { display: false } },
  },
}

onMounted(async () => {
  await Promise.all([load(), loadSettings()])
  loading.value = false
})
</script>
