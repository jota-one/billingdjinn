import { computed, ref } from 'vue'
import PocketBase from 'pocketbase'
import config from '../../config'
import type { TInvoiceTotal } from './useInvoiceTotals'

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

export default function useDashboard() {
  const pb = new PocketBase(config.apiBaseUrl)
  const invoices = ref<TInvoiceTotal[]>([])

  const load = async () => {
    invoices.value = await pb
      .collection('invoice_totals')
      .getFullList<TInvoiceTotal>({ expand: 'client', sort: '-date' })
  }

  // ── KPI ─────────────────────────────────────────────────────────────────────

  const currentYear = new Date().getFullYear()

  const caAllTime = computed(() =>
    invoices.value.filter(i => i.status === 'paid').reduce((s, i) => s + i.total_ht, 0),
  )

  const caCurrentYear = computed(() =>
    invoices.value
      .filter(i => i.status === 'paid' && i.date?.startsWith(String(currentYear)))
      .reduce((s, i) => s + i.total_ht, 0),
  )

  const pendingInvoices = computed(() => invoices.value.filter(i => i.status === 'sent'))

  const pendingAmount = computed(() => pendingInvoices.value.reduce((s, i) => s + i.total_ttc, 0))

  const caCurrentMonth = computed(() => {
    const ym = new Date().toISOString().substring(0, 7) // YYYY-MM
    return invoices.value
      .filter(i => i.status === 'paid' && i.date?.startsWith(ym))
      .reduce((s, i) => s + i.total_ht, 0)
  })

  // ── Graphique mensuel (année en cours, barres empilées paid + sent) ──────────

  const monthlyChartData = computed(() => {
    const paid = Array(12).fill(0)
    const sent = Array(12).fill(0)
    invoices.value
      .filter(i => i.status !== 'draft' && i.date?.startsWith(String(currentYear)))
      .forEach(i => {
        const m = new Date(i.date).getMonth()
        if (i.status === 'paid') paid[m] += i.total_ht
        else sent[m] += i.total_ht
      })
    return {
      labels: MONTHS,
      datasets: [
        {
          label: 'Payé (HT)',
          data: paid.map(v => Math.round(v * 100) / 100),
          backgroundColor: 'rgba(34, 197, 94, 0.75)',
          borderRadius: 4,
          stack: 'ca',
        },
        {
          label: 'En attente (HT)',
          data: sent.map(v => Math.round(v * 100) / 100),
          backgroundColor: 'rgba(251, 146, 60, 0.65)',
          borderRadius: 4,
          stack: 'ca',
        },
      ],
    }
  })

  // ── Graphique annuel (5 dernières années, ligne) ─────────────────────────────

  const annualChartData = computed(() => {
    const years = Array.from({ length: 5 }, (_, i) => String(currentYear - 4 + i))
    const data = years.map(
      y =>
        Math.round(
          invoices.value
            .filter(i => i.status === 'paid' && i.date?.startsWith(y))
            .reduce((s, i) => s + i.total_ht, 0) * 100,
        ) / 100,
    )
    return {
      labels: years,
      datasets: [
        {
          label: 'CA HT payé',
          data,
          borderColor: 'rgba(99, 102, 241, 0.9)',
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
          pointBackgroundColor: 'rgba(99, 102, 241, 1)',
          fill: true,
          tension: 0.3,
        },
      ],
    }
  })

  // ── CA par client (top 8) ────────────────────────────────────────────────────

  const topClientsChartData = computed(() => {
    const map = new Map<string, { name: string; ca: number }>()
    invoices.value
      .filter(i => i.status === 'paid')
      .forEach(i => {
        const name = i.expand?.client?.name ?? 'Inconnu'
        const existing = map.get(name) ?? { name, ca: 0 }
        existing.ca += i.total_ht
        map.set(name, existing)
      })
    const sorted = [...map.values()].sort((a, b) => b.ca - a.ca).slice(0, 8)
    return {
      labels: sorted.map(c => c.name),
      datasets: [
        {
          label: 'CA HT payé',
          data: sorted.map(c => Math.round(c.ca * 100) / 100),
          backgroundColor: [
            'rgba(99, 102, 241, 0.75)',
            'rgba(34, 197, 94, 0.75)',
            'rgba(251, 146, 60, 0.75)',
            'rgba(236, 72, 153, 0.75)',
            'rgba(14, 165, 233, 0.75)',
            'rgba(168, 85, 247, 0.75)',
            'rgba(234, 179, 8, 0.75)',
            'rgba(239, 68, 68, 0.75)',
          ],
          borderRadius: 4,
        },
      ],
    }
  })

  return {
    load,
    invoices,
    caAllTime,
    caCurrentYear,
    caCurrentMonth,
    pendingInvoices,
    pendingAmount,
    monthlyChartData,
    annualChartData,
    topClientsChartData,
  }
}
