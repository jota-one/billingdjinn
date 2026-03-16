import { ref } from 'vue'
import PocketBase from 'pocketbase'
import config from '../../config'

export interface TInvoiceTotal {
  id: string
  invoice_number: string
  date: string
  due_date?: string
  status: 'draft' | 'sent' | 'paid'
  client: string
  tva_enabled?: boolean
  tva_rate?: number
  total_ht: number
  total_tva: number
  total_ttc: number
  expand?: {
    client?: { id: string; name: string }
  }
}

export default function useInvoiceTotals() {
  const pb = new PocketBase(config.apiBaseUrl)
  const invoices = ref<TInvoiceTotal[]>([])

  const loadInvoiceTotals = async () => {
    invoices.value = await pb
      .collection('invoice_totals')
      .getFullList<TInvoiceTotal>({ expand: 'client', sort: '-date' })
  }

  return { invoices, loadInvoiceTotals }
}
