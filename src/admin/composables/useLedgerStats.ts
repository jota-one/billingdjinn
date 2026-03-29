import { computed, ref, type Ref } from 'vue'
import PocketBase from 'pocketbase'
import config from '../../config'

interface TLedgerStatEntry {
  id: string
  date: string
  category: string
  amount: number
  fiscal_year?: number
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
  const entries = ref<TLedgerStatEntry[]>([])
  const pb = new PocketBase(config.apiBaseUrl)

  const load = async () => {
    entries.value = await pb.collection('ledger').getFullList<TLedgerStatEntry>({
      fields: 'id,date,category,amount,fiscal_year',
    })
  }

  const fiscalYearOf = (e: TLedgerStatEntry) => e.fiscal_year || parseInt(e.date.substring(0, 4))

  const availableYears = computed(() => {
    const years = new Set<number>([new Date().getFullYear()])
    entries.value.forEach(e => years.add(fiscalYearOf(e)))
    return [...years].sort((a, b) => b - a)
  })

  const yearEntries = computed(() =>
    entries.value.filter(e => fiscalYearOf(e) === selectedYear.value && e.category !== 'Erreur'),
  )

  const totalRevenu = computed(() =>
    yearEntries.value.filter(e => e.amount > 0 && e.category === 'Revenu').reduce((s, e) => s + e.amount, 0),
  )

  const totalCharges = computed(() =>
    yearEntries.value.filter(e => e.amount < 0).reduce((s, e) => s + Math.abs(e.amount), 0),
  )

  const chargesSociales = computed(() =>
    yearEntries.value
      .filter(e => e.amount < 0 && SOCIAL_CATEGORIES.includes(e.category))
      .reduce((s, e) => s + Math.abs(e.amount), 0),
  )

  const ratioCharges = computed(() => {
    if (totalRevenu.value === 0) return null
    return Math.round((totalCharges.value / totalRevenu.value) * 1000) / 10
  })

  // ── Donut — charges par catégorie (année sélectionnée) ─────────────────────

  const chargesByCategoryChartData = computed(() => {
    const map = new Map<string, number>()
    yearEntries.value
      .filter(e => e.amount < 0 && e.category)
      .forEach(e => map.set(e.category, (map.get(e.category) ?? 0) + Math.abs(e.amount)))
    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1])
    return {
      labels: sorted.map(([cat]) => cat),
      datasets: [
        {
          data: sorted.map(([, v]) => Math.round(v * 100) / 100),
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
    const trendEntries = entries.value.filter(
      e => e.amount < 0 && e.category && e.category !== 'Erreur' && years.includes(fiscalYearOf(e)),
    )
    const cats = [...new Set(trendEntries.map(e => e.category))].sort()
    return {
      labels: years.map(String),
      datasets: cats.map((cat, i) => {
        const color = PALETTE[i % PALETTE.length]
        return {
          label: cat,
          data: years.map(
            y =>
              Math.round(
                trendEntries
                  .filter(e => e.category === cat && fiscalYearOf(e) === y)
                  .reduce((s, e) => s + Math.abs(e.amount), 0) * 100,
              ) / 100,
          ),
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
