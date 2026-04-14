import { computed } from 'vue'
import type { Ref } from 'vue'
import type { TLedgerEntry } from './useLedger'
import type { TCategory } from '@/admin/types/category'
import type { TProfitCenter } from '@/admin/types/profit-center'

export interface TAnalyticsRow {
  profitCenter: TProfitCenter | null // null = "Non alloué"
  revenue: number
  charges: number
  marge: number
  margePct: number
}

export default function useAnalytics(
  entries: Ref<TLedgerEntry[]>,
  categories: Ref<TCategory[]>,
  profitCenters: Ref<TProfitCenter[]>,
  selectedYear: Ref<number>,
) {
  const rows = computed<TAnalyticsRow[]>(() => {
    if (!profitCenters.value.length) return []

    const categoryMap = new Map(categories.value.map(c => [c.id, c]))

    // Filter entries for selected year
    const yearEntries = entries.value.filter(e => {
      const year = e.fiscal_year || parseInt(e.date.substring(0, 4))
      return year === selectedYear.value
    })

    // Accumulators: revenue and charges per profit center id
    const revenue = new Map<string, number>()
    const charges = new Map<string, number>()
    const fallbackEntries: TLedgerEntry[] = []

    const addAmount = (map: Map<string, number>, key: string, amount: number) => {
      map.set(key, (map.get(key) ?? 0) + amount)
    }

    const distribute = (entry: TLedgerEntry, pcId: string, pct: number) => {
      const share = Math.abs(entry.amount) * (pct / 100)
      if (entry.amount >= 0) {
        addAmount(revenue, pcId, share)
      } else {
        addAmount(charges, pcId, share)
      }
    }

    // Passe 1: Tier 1 (override direct) + Tier 2 (allocation keys)
    for (const entry of yearEntries) {
      if (entry.profit_center_id) {
        // Tier 1: direct assignment
        distribute(entry, entry.profit_center_id, 100)
      } else {
        const cat = entry.category_id ? categoryMap.get(entry.category_id) : undefined
        if (cat?.allocation_keys?.length) {
          // Tier 2: allocation keys
          for (const key of cat.allocation_keys) {
            distribute(entry, key.profit_center_id, key.percentage)
          }
        } else {
          // Tier 3: fallback
          fallbackEntries.push(entry)
        }
      }
    }

    // Passe 2: compute CA ratio from Tier 1 + Tier 2 revenues
    const totalAllocatedRevenue = Array.from(revenue.values()).reduce((s, v) => s + v, 0)
    const caRatio = new Map<string, number>()
    if (totalAllocatedRevenue > 0) {
      for (const pc of profitCenters.value) {
        const pcRevenue = revenue.get(pc.id) ?? 0
        caRatio.set(pc.id, pcRevenue / totalAllocatedRevenue)
      }
    }

    // Passe 3: distribute fallback entries
    const unallocatedRevenue = { value: 0 }
    const unallocatedCharges = { value: 0 }

    for (const entry of fallbackEntries) {
      if (totalAllocatedRevenue === 0) {
        // No CA ratio available — group as "Non alloué"
        if (entry.amount >= 0) {
          unallocatedRevenue.value += entry.amount
        } else {
          unallocatedCharges.value += Math.abs(entry.amount)
        }
      } else {
        for (const pc of profitCenters.value) {
          const ratio = caRatio.get(pc.id) ?? 0
          if (ratio > 0) {
            distribute(entry, pc.id, ratio * 100)
          }
        }
        // Remainder due to floating-point: negligible, but handle entries
        // with no CA-bearing centers gracefully (ratio sum < 1)
      }
    }

    // Build result rows for each profit center
    const result: TAnalyticsRow[] = profitCenters.value.map(pc => {
      const rev = round(revenue.get(pc.id) ?? 0)
      const chg = round(charges.get(pc.id) ?? 0)
      const marge = round(rev - chg)
      return {
        profitCenter: pc,
        revenue: rev,
        charges: chg,
        marge,
        margePct: rev > 0 ? round((marge / rev) * 100) : 0,
      }
    })

    // "Non alloué" row (only if there is something)
    if (unallocatedRevenue.value > 0 || unallocatedCharges.value > 0) {
      const rev = round(unallocatedRevenue.value)
      const chg = round(unallocatedCharges.value)
      const marge = round(rev - chg)
      result.push({
        profitCenter: null,
        revenue: rev,
        charges: chg,
        marge,
        margePct: rev > 0 ? round((marge / rev) * 100) : 0,
      })
    }

    return result
  })

  const totals = computed(() => {
    const rev = round(rows.value.reduce((s, r) => s + r.revenue, 0))
    const chg = round(rows.value.reduce((s, r) => s + r.charges, 0))
    const marge = round(rev - chg)
    return { revenue: rev, charges: chg, marge, margePct: rev > 0 ? round((marge / rev) * 100) : 0 }
  })

  return { rows, totals }
}

function round(v: number): number {
  return Math.round(v * 100) / 100
}
