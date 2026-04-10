import { ref } from 'vue'
import PocketBase from 'pocketbase'
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
  }> {
    confirming.value = true
    let linked = 0,
      created = 0,
      ignored = 0
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

        if (row.action === 'link' && row.linkedEntryId) {
          await pb.collection('ledger').update(row.linkedEntryId, payload)
          linked++
        } else if (row.action === 'create') {
          await pb.collection('ledger').create(payload)
          created++
        }
      }
    } finally {
      confirming.value = false
    }
    return { linked, created, ignored }
  }

  return {
    rows,
    confirming,
    initReconciliation,
    confirmReconciliation,
  }
}
