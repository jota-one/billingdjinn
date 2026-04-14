<template>
  <div class="p-8">
    <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
      <span class="i-fa-solid-layer-group text-xl"></span>
      Analytique
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

    <template v-else-if="profitCenters.length === 0">
      <div class="alert alert-info max-w-xl">
        <span class="i-fa-solid-circle-info"></span>
        Aucun centre de profit défini. Configurez-les dans
        <RouterLink to="/settings" class="font-semibold underline ml-1">Mon entreprise</RouterLink>.
      </div>
    </template>

    <template v-else>
      <!-- Tableau analytique -->
      <div class="card bg-base-200 p-6 max-w-4xl mb-6 overflow-x-auto">
        <table class="table table-sm w-full">
          <thead>
            <tr class="text-base-content/60 text-xs uppercase">
              <th>Centre de profit</th>
              <th class="text-right">Revenus</th>
              <th class="text-right">Charges</th>
              <th class="text-right">Marge</th>
              <th class="text-right">% Marge</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.profitCenter?.id ?? 'unallocated'">
              <td class="flex items-center gap-2">
                <span
                  v-if="row.profitCenter"
                  class="w-3 h-3 rounded-full shrink-0"
                  :style="{ backgroundColor: row.profitCenter.color }"
                ></span>
                <span v-else class="w-3 h-3 rounded-full bg-base-content/20 flex-shrink-0"></span>
                <span :class="{ 'text-base-content/50 italic': !row.profitCenter }">
                  {{ row.profitCenter?.name ?? 'Non alloué' }}
                </span>
              </td>
              <td class="text-right font-mono text-success">{{ fmt(row.revenue) }}</td>
              <td class="text-right font-mono text-error">{{ fmt(row.charges) }}</td>
              <td
                class="text-right font-mono font-semibold"
                :class="row.marge >= 0 ? 'text-success' : 'text-error'"
              >
                {{ fmt(row.marge) }}
              </td>
              <td
                class="text-right font-mono"
                :class="row.margePct >= 0 ? 'text-success' : 'text-error'"
              >
                {{ row.margePct.toFixed(1) }}%
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="font-bold border-t border-base-300">
              <td>Total</td>
              <td class="text-right font-mono text-success">{{ fmt(totals.revenue) }}</td>
              <td class="text-right font-mono text-error">{{ fmt(totals.charges) }}</td>
              <td
                class="text-right font-mono"
                :class="totals.marge >= 0 ? 'text-success' : 'text-error'"
              >
                {{ fmt(totals.marge) }}
              </td>
              <td
                class="text-right font-mono"
                :class="totals.margePct >= 0 ? 'text-success' : 'text-error'"
              >
                {{ totals.margePct.toFixed(1) }}%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Graphique -->
      <div class="card bg-base-200 p-6 max-w-4xl" v-if="chartData">
        <Chart type="bar" :data="chartData" :options="chartOptions" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useStorage } from '@vueuse/core'
import Select from 'primevue/select'
import Chart from 'primevue/chart'
import useLedger from '@/admin/composables/useLedger'
import useCategories from '@/admin/composables/useCategories'
import useProfitCenters from '@/admin/composables/useProfitCenters'
import useAnalytics from '@/admin/composables/useAnalytics'

const realYear = new Date().getFullYear()
const selectedYear = useStorage('analytics-year', realYear)

const { entries, loadEntries } = useLedger()
const { categories, loadCategories } = useCategories()
const { profitCenters, loadProfitCenters } = useProfitCenters()

const { rows, totals } = useAnalytics(entries, categories, profitCenters, selectedYear)

const loading = ref(true)

const availableYears = computed(() => {
  const years = new Set<number>([realYear])
  entries.value.forEach(e => {
    years.add(e.fiscal_year || parseInt(e.date.substring(0, 4)))
  })
  return [...years].sort((a, b) => b - a)
})

const fmt = (n: number): string => {
  const sign = n < 0 ? '-' : ''
  const [intPart, decPart] = Math.abs(n).toFixed(2).split('.')
  const formattedInt =
    Number(intPart) >= 10000 ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "'") : intPart
  return `${sign}${formattedInt}.${decPart}`
}

const gridColor = 'rgba(128,128,128,0.1)'

const chartData = computed(() => {
  if (!rows.value.length) return null
  const labels = rows.value.map(r => r.profitCenter?.name ?? 'Non alloué')
  const colors = rows.value.map(r => r.profitCenter?.color ?? 'rgba(128,128,128,0.5)')
  return {
    labels,
    datasets: [
      {
        label: 'Revenus',
        data: rows.value.map(r => r.revenue),
        backgroundColor: colors.map(c => c + 'cc'),
        borderColor: colors,
        borderWidth: 1,
      },
      {
        label: 'Charges',
        data: rows.value.map(r => r.charges),
        backgroundColor: 'rgba(239,68,68,0.3)',
        borderColor: 'rgba(239,68,68,0.8)',
        borderWidth: 1,
      },
      {
        label: 'Marge',
        data: rows.value.map(r => r.marge),
        backgroundColor: 'rgba(59,130,246,0.3)',
        borderColor: 'rgba(59,130,246,0.8)',
        borderWidth: 1,
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { position: 'bottom' as const },
    tooltip: {
      callbacks: { label: (ctx: any) => ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y)}` },
    },
  },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, grid: { color: gridColor } },
  },
}

onMounted(async () => {
  await Promise.all([loadEntries(), loadCategories(), loadProfitCenters()])
  loading.value = false
})
</script>
