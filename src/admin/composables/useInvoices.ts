import { ref } from 'vue'
import config from '@/config'
import PocketBase from 'pocketbase'
import type { TClient } from './useClients'

export type TInvoiceStatus = 'draft' | 'sent' | 'paid'

export interface TClientSnapshot {
  name: string
  address: string
  email: string
  phone: string
  contact_person: string
}

export interface TCompanySnapshot {
  name: string
  address: string
  phone: string
  email: string
  bank_account: string
  tva_number: string
  logo_base64: string | null
  currency: string
}

export interface TInvoiceBase {
  id: string
  client: string
  invoice_number: string
  date: string
  due_date?: string
  status: TInvoiceStatus
  tva_enabled?: boolean
  tva_rate?: number
  notes?: string
  converted_amount?: number | null
  client_snapshot?: TClientSnapshot
  company_snapshot?: TCompanySnapshot
}

export interface TInvoice extends TInvoiceBase {
  tva_enabled: boolean
  created: string
  updated: string
  expand?: { client?: TClient }
}

export interface TInvoiceLine {
  id?: string
  invoice: string
  description: string
  quantity: number
  unit_price: number
  sort_order?: number
}

export interface TInvoiceLineForm {
  id?: string
  description: string
  quantity: number
  unit_price: number
}

export interface TInvoiceForm {
  client: string
  invoice_number: string
  date: string
  due_date: string
  status: TInvoiceStatus
  tva_enabled: boolean
  tva_rate: number | null
  notes: string
  converted_amount: number | null
}

export const STATUS_LABELS: Record<TInvoiceStatus, string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  paid: 'Payée',
}

export const STATUS_BADGE: Record<TInvoiceStatus, string> = {
  draft: 'badge-neutral',
  sent: 'badge-info',
  paid: 'badge-success',
}

export default function useInvoices() {
  const pb = new PocketBase(config.apiBaseUrl)

  const invoices = ref<TInvoice[]>([])

  const loadInvoices = async () => {
    invoices.value = await pb.collection<TInvoice>('invoices').getFullList({
      sort: '-date,-created',
      expand: 'client',
    })
  }

  const loadInvoice = async (id: string): Promise<TInvoice> => {
    return pb.collection<TInvoice>('invoices').getOne(id, { expand: 'client' })
  }

  const loadInvoiceLines = async (invoiceId: string): Promise<TInvoiceLine[]> => {
    return pb.collection<TInvoiceLine>('invoice_lines').getFullList({
      filter: `invoice = "${invoiceId}"`,
      sort: 'sort_order,created',
    })
  }

  const generateInvoiceNumber = async (): Promise<string> => {
    const year = new Date().getFullYear()
    const existing = await pb.collection<TInvoice>('invoices').getFullList({
      filter: `invoice_number ~ "${year}-"`,
      fields: 'invoice_number',
    })
    const numbers = existing.map(inv => {
      const parts = inv.invoice_number.split('-')
      return parseInt(parts[parts.length - 1]) || 0
    })
    const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1
    return `${year}-${String(next).padStart(3, '0')}`
  }

  const createInvoice = async (
    payload: TInvoiceForm,
    lines: TInvoiceLineForm[],
  ): Promise<TInvoice> => {
    const invoice = await pb.collection<TInvoice>('invoices').create(buildInvoiceData(payload))
    await saveLines(invoice.id, lines)
    return invoice
  }

  /**
   * @param currentStatus  Status of the invoice before this save
   * @param hasSnapshot    True if client_snapshot already exists (already frozen)
   */
  const updateInvoice = async (
    id: string,
    payload: TInvoiceForm,
    lines: TInvoiceLineForm[],
    currentStatus: TInvoiceStatus,
    hasSnapshot: boolean,
  ): Promise<TInvoice> => {
    const data: Record<string, unknown> = buildInvoiceData(payload)

    // Build snapshot on first transition out of draft
    if (payload.status !== 'draft' && !hasSnapshot) {
      const { clientSnapshot, companySnapshot } = await buildSnapshots(payload.client, pb)
      data.client_snapshot = clientSnapshot
      data.company_snapshot = companySnapshot
    }

    const invoice = await pb.collection<TInvoice>('invoices').update<TInvoice>(id, data)

    // Only replace lines while the invoice was still a draft
    if (currentStatus === 'draft') {
      const existing = await loadInvoiceLines(id)
      await Promise.all(existing.map(l => pb.collection('invoice_lines').delete(l.id!)))
      await saveLines(id, lines)
    }

    return invoice
  }

  const deleteInvoice = async (id: string): Promise<void> => {
    await pb.collection('invoices').delete(id)
  }

  return {
    invoices,
    loadInvoices,
    loadInvoice,
    loadInvoiceLines,
    generateInvoiceNumber,
    createInvoice,
    updateInvoice,
    deleteInvoice,
  }
}

function buildInvoiceData(payload: TInvoiceForm): Record<string, unknown> {
  return {
    client: payload.client,
    invoice_number: payload.invoice_number.trim(),
    date: payload.date,
    due_date: payload.due_date || null,
    status: payload.status,
    tva_enabled: payload.tva_enabled,
    tva_rate: payload.tva_enabled ? (payload.tva_rate ?? null) : null,
    notes: payload.notes || '',
    converted_amount: payload.converted_amount ?? null,
  }
}

export async function buildSnapshots(
  clientId: string,
  pb: PocketBase,
): Promise<{ clientSnapshot: TClientSnapshot; companySnapshot: TCompanySnapshot }> {
  const [client, settings] = await Promise.all([
    pb.collection('clients').getOne<Record<string, any>>(clientId),
    pb.collection('company_settings').getFirstListItem<Record<string, any>>(''),
  ])

  const clientSnapshot: TClientSnapshot = {
    name: client.name || '',
    address: client.address || '',
    email: client.email || '',
    phone: client.phone || '',
    contact_person: client.contact_person || '',
  }

  let logo_base64: string | null = null
  if (settings.logo) {
    try {
      const logoUrl = `${config.apiBaseUrl}/api/files/company_settings/${settings.id}/${settings.logo}`
      const response = await fetch(logoUrl)
      const blob = await response.blob()
      logo_base64 = await blobToBase64(blob)
    } catch {
      logo_base64 = null
    }
  }

  const companySnapshot: TCompanySnapshot = {
    name: settings.company_name || '',
    address: settings.address || '',
    phone: settings.phone || '',
    email: settings.email || '',
    bank_account: settings.bank_account || '',
    tva_number: settings.tva_number || '',
    logo_base64,
    currency: client.currency || settings.currency || 'CHF',
  }

  return { clientSnapshot, companySnapshot }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function saveLines(invoiceId: string, lines: TInvoiceLineForm[]) {
  const pb = new PocketBase(config.apiBaseUrl)
  await Promise.all(
    lines.map((line, index) =>
      pb.collection('invoice_lines').create({
        invoice: invoiceId,
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unit_price,
        sort_order: index,
      }),
    ),
  )
}
