import { ref } from 'vue'
import PocketBase from 'pocketbase'
import dayjs from 'dayjs'
import config from '../../config'
import { buildReconciliation } from '../helpers/bankReconciliation'
import type { TLedgerEntry } from './useLedger'
import type { TBankEntry } from '../types/bank-entry'
import type { TLedgerCategory } from '../types/ledger-category'
import type { TReconciliationRow } from '../helpers/bankReconciliation'

export type { ReconciliationAction, TReconciliationRow } from '../helpers/bankReconciliation'

export default function useBankReconciliation() {
  const pb = new PocketBase(config.apiBaseUrl)
  const rows = ref<TReconciliationRow[]>([])
  const confirming = ref(false)

  function initReconciliation(
    bankEntries: TBankEntry[],
    plannedEntries: TLedgerEntry[],
    categories: TLedgerCategory[],
  ) {
    rows.value = buildReconciliation(bankEntries, plannedEntries, categories)
  }

  async function confirmReconciliation(): Promise<{
    linked: number
    created: number
    ignored: number
    invoiceMatched: number
  }> {
    confirming.value = true
    let linked = 0,
      created = 0,
      ignored = 0,
      invoiceMatched = 0
    try {
      for (const row of rows.value) {
        if (row.action === 'ignore') {
          ignored++
          continue
        }

        const payload = {
          description: row.editedDescription.trim(),
          category: row.editedCategory,
          date: row.editedDate,
          amount: row.editedAmount,
          is_checked: true,
        }

        let entryId: string | null = null

        if (row.action === 'link' && row.linkedEntryId) {
          await pb.collection('ledger').update(row.linkedEntryId, payload)
          entryId = row.linkedEntryId
          linked++
        } else if (row.action === 'create') {
          const newEntry = await pb.collection('ledger').create(payload)
          entryId = newEntry.id
          created++
        }

        if (entryId && row.editedAmount > 0) {
          const matched = await matchInvoice(entryId, row.editedAmount, row.editedDate)
          if (matched) invoiceMatched++
        }
      }
    } finally {
      confirming.value = false
    }
    return { linked, created, ignored, invoiceMatched }
  }

  async function matchInvoice(entryId: string, amount: number, date: string): Promise<boolean> {
    const from = dayjs(date).subtract(60, 'day').format('YYYY-MM-DD')
    const to = dayjs(date).add(60, 'day').format('YYYY-MM-DD')
    const candidates = await pb.collection('invoice_totals').getFullList({
      filter: `status = "sent" && date >= "${from}" && date <= "${to}"`,
      requestKey: null,
    })
    const scored = candidates
      .map(inv => {
        const refDate = (inv as any).due_date || (inv as any).date
        const daysDiff = Math.abs(dayjs(refDate).diff(dayjs(date), 'day'))
        const dateScore = Math.max(0, 1 - daysDiff / 60)
        const invAmount = (inv as any).converted_amount || (inv as any).total_ttc
        const amountDiff = Math.abs(invAmount - amount)
        const amountScore = amount !== 0 ? Math.max(0, 1 - amountDiff / (Math.abs(amount) * 1.5)) : 0
        return { id: (inv as any).id, score: dateScore * 0.6 + amountScore * 0.4 }
      })
      .filter(c => c.score > 0.5)
      .sort((a, b) => b.score - a.score)
    if (!scored.length) return false
    const best = scored[0]
    await pb.collection('invoices').update(best.id, { status: 'paid' })
    await pb.collection('ledger').update(entryId, { invoice: best.id })
    return true
  }

  return {
    rows,
    confirming,
    initReconciliation,
    confirmReconciliation,
  }
}
