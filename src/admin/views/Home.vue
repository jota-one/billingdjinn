<template>
  <div class="p-8">
    <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
      <span class="i-fa6-solid-house"></span>
      Tableau de bord
    </h2>

    <div v-if="loading" class="flex items-center gap-2 text-base-content/50">
      <span class="loading loading-spinner loading-sm"></span>
      Chargement...
    </div>

    <template v-else>
      <!-- KPI cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="card bg-base-200 p-4">
          <p class="text-xs text-base-content/50 uppercase tracking-wide mb-1">CA mois en cours</p>
          <p class="text-2xl font-bold font-mono">{{ fmt(caCurrentMonth) }}</p>
          <p class="text-xs text-base-content/40 mt-1">HT · payé</p>
        </div>
        <div class="card bg-base-200 p-4">
          <p class="text-xs text-base-content/50 uppercase tracking-wide mb-1">CA {{ currentYear }}</p>
          <p class="text-2xl font-bold font-mono">{{ fmt(caCurrentYear) }}</p>
          <p class="text-xs text-base-content/40 mt-1">HT · payé</p>
        </div>
        <div class="card bg-base-200 p-4">
          <p class="text-xs text-base-content/50 uppercase tracking-wide mb-1">CA total</p>
          <p class="text-2xl font-bold font-mono">{{ fmt(caAllTime) }}</p>
          <p class="text-xs text-base-content/40 mt-1">HT · toutes années · payé</p>
        </div>
        <div class="card bg-base-200 p-4 border border-warning/30">
          <p class="text-xs text-base-content/50 uppercase tracking-wide mb-1">En attente</p>
          <p class="text-2xl font-bold font-mono text-warning">{{ fmt(pendingAmount) }}</p>
          <p class="text-xs text-base-content/40 mt-1">TTC · {{ pendingInvoices.length }} facture{{ pendingInvoices.length !== 1 ? 's' : '' }}</p>
        </div>
      </div>

      <!-- CA mensuel + évolution annuelle -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div class="card bg-base-200 p-5 lg:col-span-2">
          <h3 class="font-semibold mb-4">CA mensuel {{ currentYear }}</h3>
          <Chart type="bar" :data="monthlyChartData" :options="barOptions" />
        </div>
        <div class="card bg-base-200 p-5">
          <h3 class="font-semibold mb-4">Évolution annuelle</h3>
          <Chart type="line" :data="annualChartData" :options="lineOptions" />
        </div>
      </div>

      <!-- Top clients -->
      <div class="card bg-base-200 p-5">
        <h3 class="font-semibold mb-4">Top clients (CA HT payé)</h3>
        <Chart type="bar" :data="topClientsChartData" :options="clientsBarOptions" style="max-height: 260px;" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Chart from 'primevue/chart'
import useDashboard from '../composables/useDashboard'

const {
  load,
  caAllTime,
  caCurrentYear,
  caCurrentMonth,
  pendingInvoices,
  pendingAmount,
  monthlyChartData,
  annualChartData,
  topClientsChartData,
} = useDashboard()

const loading = ref(true)
const currentYear = new Date().getFullYear()

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

const gridColor = 'rgba(128,128,128,0.1)'
const fmtTick = (v: any) => new Intl.NumberFormat('fr-CH', { notation: 'compact' }).format(v)
const fmtTooltip = (ctx: any) =>
  ` ${new Intl.NumberFormat('fr-CH', { minimumFractionDigits: 2 }).format(ctx.parsed.y ?? ctx.parsed)}`

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
  await load()
  loading.value = false
})
</script>
