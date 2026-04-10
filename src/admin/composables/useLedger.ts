import { ref } from 'vue'
import config from '../../config'
import PocketBase from 'pocketbase'
import dayjs from 'dayjs'
import { scoreCandidate } from '../helpers/ledger'

export interface TLedgerEntry {
  id: string
  date: string
  description: string
  category: string
  amount: number
  is_checked: boolean
  invoice?: string
  fiscal_year?: number
  created: string
  updated: string
}

export interface TLedgerEntryForm {
  date: string
  description: string
  category: string
  amount: number | null
  is_checked: boolean
  invoice?: string
  fiscal_year?: number | null
}

export interface TLedgerCandidateEntry extends TLedgerEntry {
  score: number
}

export default function useLedger() {
  const pb = new PocketBase(config.apiBaseUrl)

  const entries = ref<TLedgerEntry[]>([])

  const loadEntries = async () => {
    entries.value = await pb.collection<TLedgerEntry>('ledger').getFullList({
      sort: 'date,created',
    })
  }

  const loadEntry = async (id: string): Promise<TLedgerEntry> => {
    return pb.collection<TLedgerEntry>('ledger').getOne(id)
  }

  const loadUsedCategories = async (): Promise<Set<string>> => {
    const records = await pb.collection('ledger_stats').getFullList({ fields: 'category' })
    return new Set(records.map(r => r['category'] as string).filter(Boolean))
  }

  const createEntry = async (payload: TLedgerEntryForm): Promise<TLedgerEntry> => {
    return pb.collection<TLedgerEntry>('ledger').create(buildData(payload))
  }

  const updateEntry = async (id: string, payload: TLedgerEntryForm): Promise<TLedgerEntry> => {
    return pb.collection<TLedgerEntry>('ledger').update<TLedgerEntry>(id, buildData(payload))
  }

  const deleteEntry = async (id: string): Promise<void> => {
    await pb.collection('ledger').delete(id)
  }

  const markChecked = async (id: string): Promise<void> => {
    await pb.collection('ledger').update(id, { is_checked: true })
  }

  /**
   * Search planned credit entries that could match a paid invoice.
   * Scores by date proximity (±60d around due_date) and amount proximity.
   */
  const findLedgerCandidates = async (
    dueDate: string,
    invoiceAmount: number,
  ): Promise<TLedgerCandidateEntry[]> => {
    if (!dueDate) return []
    const from = dayjs(dueDate).subtract(60, 'day').format('YYYY-MM-DD')
    const to = dayjs(dueDate).add(60, 'day').format('YYYY-MM-DD')
    const results = await pb.collection<TLedgerEntry>('ledger').getFullList({
      filter: `is_checked = false && amount > 0 && date >= "${from}" && date <= "${to}"`,
      sort: 'date',
      requestKey: null,
    })
    return results
      .map(e => ({ ...e, score: scoreCandidate(e, dueDate, invoiceAmount, 60) }))
      .filter(e => e.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  }

  /**
   * Convert an existing planned entry to actual and attach it to the invoice.
   */
  const linkEntryToInvoice = async (
    entryId: string,
    invoiceId: string,
    amount: number,
    invoiceDate: string,
  ): Promise<void> => {
    const today = dayjs().format('YYYY-MM-DD')
    const invoiceYear = dayjs(invoiceDate).year()
    const todayYear = dayjs().year()
    await pb.collection('ledger').update(entryId, {
      amount,
      is_checked: true,
      date: today,
      invoice: invoiceId,
      fiscal_year: invoiceYear !== todayYear ? invoiceYear : null,
    })
  }

  /**
   * Create a new actual ledger entry for a paid invoice (no existing planned entry matched).
   */
  const createFromInvoice = async (
    invoiceId: string,
    invoiceNumber: string,
    clientName: string,
    amount: number,
    invoiceDate: string,
  ): Promise<void> => {
    const description = clientName
      ? `Facture ${invoiceNumber} — ${clientName}`
      : `Facture ${invoiceNumber}`
    const invoiceYear = dayjs(invoiceDate).year()
    const todayYear = dayjs().year()
    await pb.collection('ledger').create({
      date: dayjs().format('YYYY-MM-DD'),
      description,
      category: 'Revenu',
      amount,
      is_checked: true,
      invoice: invoiceId,
      fiscal_year: invoiceYear !== todayYear ? invoiceYear : null,
    })
  }

  return {
    entries,
    loadEntries,
    loadEntry,
    loadUsedCategories,
    createEntry,
    updateEntry,
    deleteEntry,
    markChecked,
    findLedgerCandidates,
    linkEntryToInvoice,
    createFromInvoice,
  }
}

function buildData(payload: TLedgerEntryForm): Record<string, unknown> {
  return {
    date: payload.date,
    description: payload.description.trim(),
    category: payload.category || '',
    amount: payload.amount ?? 0,
    is_checked: payload.is_checked,
    invoice: payload.invoice || null,
    fiscal_year: payload.fiscal_year || null,
  }
}
