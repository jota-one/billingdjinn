import { computed, ref, type Ref } from 'vue'
import PocketBase from 'pocketbase'
import config from '@/config'

interface TLedgerStatRow {
  id: string
  category: string
  year: number
  total_credit: number
  total_debit: number
}

const SOCIAL_CATEGORIES = ['AVS', 'LPP', 'LAA']

const PALETTE = [
  'rgba(99, 102, 241, 0.85)',
  'rgba(34, 197, 94, 0.85)',
  'rgba(251, 146, 60, 0.85)',
  'rgba(236, 72, 153, 0.85)',
  'rgba(14, 165, 233, 0.85)',
  'rgba(168, 85, 247, 0.85)',
  'rgba(234, 179, 8, 0.85)',
  'rgba(239, 68, 68, 0.85)',
  'rgba(20, 184, 166, 0.85)',
  'rgba(245, 158, 11, 0.85)',
  'rgba(16, 185, 129, 0.85)',
  'rgba(139, 92, 246, 0.85)',
  'rgba(59, 130, 246, 0.85)',
  'rgba(248, 113, 113, 0.85)',
  'rgba(52, 211, 153, 0.85)',
]

export default function useLedgerStats(selectedYear: Ref<number>) {
  const stats = ref<TLedgerStatRow[]>([])
  const pb = new PocketBase(config.apiBaseUrl)

  const load = async () => {
    stats.value = await pb.collection('ledger_stats').getFullList<TLedgerStatRow>()
  }

  const availableYears = computed(() => {
    const years = new Set<number>([new Date().getFullYear()])
    stats.value.forEach(r => years.add(r.year))
    return [...years].sort((a, b) => b - a)
  })

  const yearStats = computed(() =>
    stats.value.filter(r => r.year === selectedYear.value && r.category !== 'Erreur'),
  )

  const totalRevenu = computed(
    () => yearStats.value.find(r => r.category === 'Revenu')?.total_credit ?? 0,
  )

  const totalCharges = computed(() => yearStats.value.reduce((s, r) => s + r.total_debit, 0))

  const chargesSociales = computed(() =>
    yearStats.value
      .filter(r => SOCIAL_CATEGORIES.includes(r.category))
      .reduce((s, r) => s + r.total_debit, 0),
  )

  const ratioCharges = computed(() => {
    if (totalRevenu.value === 0) {
      return null
    }
    return Math.round((totalCharges.value / totalRevenu.value) * 1000) / 10
  })

  // ── Donut — charges par catégorie (année sélectionnée) ─────────────────────

  const chargesByCategoryChartData = computed(() => {
    const sorted = yearStats.value
      .filter(r => r.total_debit > 0)
      .sort((a, b) => b.total_debit - a.total_debit)
    return {
      labels: sorted.map(r => r.category),
      datasets: [
        {
          data: sorted.map(r => Math.round(r.total_debit * 100) / 100),
          backgroundColor: PALETTE.slice(0, sorted.length),
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    }
  })

  // ── Lignes — évolution des charges par catégorie (5 ans) ───────────────────

  const trendYears = computed(() => {
    const cur = new Date().getFullYear()
    return [cur - 4, cur - 3, cur - 2, cur - 1, cur]
  })

  const categoryTrendsChartData = computed(() => {
    const years = trendYears.value
    const trendStats = stats.value.filter(
      r => r.total_debit > 0 && r.category && r.category !== 'Erreur' && years.includes(r.year),
    )
    const cats = [...new Set(trendStats.map(r => r.category))].sort()
    return {
      labels: years.map(String),
      datasets: cats.map((cat, i) => {
        const color = PALETTE[i % PALETTE.length]
        return {
          label: cat,
          data: years.map(y => {
            const row = trendStats.find(r => r.category === cat && r.year === y)
            return Math.round((row?.total_debit ?? 0) * 100) / 100
          }),
          borderColor: color,
          backgroundColor: color.replace('0.85', '0.12'),
          fill: false,
          tension: 0.3,
          pointRadius: 4,
        }
      }),
    }
  })

  return {
    load,
    availableYears,
    totalRevenu,
    totalCharges,
    chargesSociales,
    ratioCharges,
    chargesByCategoryChartData,
    categoryTrendsChartData,
  }
}
