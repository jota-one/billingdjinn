import { ref } from 'vue'
import PocketBase from 'pocketbase'
import config from '../../config'
import { buildSnapshots } from './useInvoices'
import type { TInvoiceStatus, TInvoiceLine } from './useInvoices'
import type { ImportResult } from '../types/import-export'
import { INVOICE_CSV_COLUMNS, getUniqueFields, getImportableFields } from '../config/invoicesImportExport'

export { INVOICE_CSV_COLUMNS }
export const INVOICE_IMPORT_COLUMNS = getImportableFields().map(f => f.key)

// ─── helpers ─────────────────────────────────────────────────────────────────

const isoToDisplay = (iso: string): string => {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}.${d.getUTCFullYear()}`
}

const displayToIso = (v: string): string => {
  if (!v) return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10) // already ISO
  const [dd, mm, yyyy] = v.split('.')
  if (!dd || !mm || !yyyy) return ''
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
}

const parseStatus = (v: string): TInvoiceStatus => {
  const map: Record<string, TInvoiceStatus> = {
    draft: 'draft',
    brouillon: 'draft',
    sent: 'sent',
    envoyée: 'sent',
    envoyee: 'sent',
    paid: 'paid',
    payée: 'paid',
    payee: 'paid',
  }
  return map[v?.toLowerCase().trim()] ?? 'paid'
}

const parseBool = (v: string): boolean =>
  ['1', 'true', 'oui', 'yes'].includes(v?.toLowerCase().trim())

const escapeCSV = (v: string): string => {
  if (!v) return ''
  if (v.includes(',') || v.includes('"') || v.includes('\n')) return `"${v.replace(/"/g, '""')}"`
  return v
}

const parseCSV = (text: string): string[][] => {
  const rows: string[][] = []
  let row: string[] = [],
    current = '',
    inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i],
      next = text[i + 1]
    if (c === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        i++
      } else inQuotes = !inQuotes
      continue
    }
    if (!inQuotes && (c === '\n' || c === '\r')) {
      row.push(current)
      current = ''
      if (!(row.length === 1 && row[0] === '')) rows.push(row)
      row = []
      if (c === '\r' && next === '\n') i++
      continue
    }
    if (!inQuotes && c === ',') {
      row.push(current)
      current = ''
      continue
    }
    current += c
  }
  row.push(current)
  if (!(row.length === 1 && row[0] === '')) rows.push(row)
  return rows
}

const downloadFile = (content: string, filename: string) => {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── composable ──────────────────────────────────────────────────────────────

export default function useInvoicesImportExport() {
  const pb = new PocketBase(config.apiBaseUrl)
  const isExporting = ref(false)
  const isImporting = ref(false)

  // ── export ──────────────────────────────────────────────────────────────────

  const exportToCSV = async () => {
    isExporting.value = true
    try {
      const [invoices, allLines] = await Promise.all([
        pb.collection('invoices').getFullList<any>({ expand: 'client', sort: '-date' }),
        pb
          .collection('invoice_lines')
          .getFullList<TInvoiceLine>({ sort: 'invoice,sort_order,created' }),
      ])

      // Group lines by invoice id
      const linesByInvoice = new Map<string, TInvoiceLine[]>()
      for (const line of allLines) {
        if (!linesByInvoice.has(line.invoice)) linesByInvoice.set(line.invoice, [])
        linesByInvoice.get(line.invoice)!.push(line)
      }

      const csvRows: string[] = [INVOICE_CSV_COLUMNS.join(',')]

      for (const inv of invoices) {
        const lines = linesByInvoice.get(inv.id) ?? []
        const snapshot = inv.client_snapshot
        const liveClient = inv.expand?.client
        const clientEmail = snapshot?.email || liveClient?.email || ''
        const clientName = snapshot?.name || liveClient?.name || ''

        const invoiceRowPrefix = [
          escapeCSV(inv.invoice_number ?? ''),
          escapeCSV(isoToDisplay(inv.date)),
          escapeCSV(isoToDisplay(inv.due_date ?? '')),
          escapeCSV(inv.status),
          inv.tva_enabled ? 'oui' : 'non',
          inv.tva_rate != null ? String(inv.tva_rate) : '',
          escapeCSV(inv.notes ?? ''),
          escapeCSV(clientEmail),
          escapeCSV(clientName),
        ]

        if (lines.length === 0) {
          csvRows.push([...invoiceRowPrefix, '', '', ''].join(','))
        } else {
          for (const line of lines) {
            csvRows.push(
              [
                ...invoiceRowPrefix,
                escapeCSV(line.description),
                String(line.quantity),
                String(line.unit_price),
              ].join(','),
            )
          }
        }
      }

      downloadFile(csvRows.join('\n'), 'invoices-export.csv')
    } finally {
      isExporting.value = false
    }
  }

  // ── import ──────────────────────────────────────────────────────────────────

  const importFromCSV = async (file: File): Promise<ImportResult> => {
    isImporting.value = true
    const result: ImportResult = {
      processed: 0,
      created: 0,
      updated: 0,
      unchanged: 0,
      success: 0,
      errors: [],
    }

    try {
      const rows = parseCSV(await file.text())
      if (rows.length < 2) throw new Error('Fichier CSV vide ou invalide')

      const headers = rows[0]
      const col = (row: string[], key: string) => {
        const idx = headers.indexOf(key)
        return idx >= 0 ? (row[idx]?.trim() ?? '') : ''
      }

      // Group data rows by invoice_number
      const groups = new Map<string, string[][]>()
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        if (!row || row.every(v => v === '')) continue
        const num = col(row, 'invoice_number')
        if (!num) continue
        if (!groups.has(num)) groups.set(num, [])
        groups.get(num)!.push(row)
      }

      for (const [invoiceNumber, invoiceRows] of groups) {
        result.processed++
        const firstRow = invoiceRows[0]
        const lineNum = rows.findIndex(r => col(r, 'invoice_number') === invoiceNumber)

        try {
          // Find client by email
          const clientEmail = col(firstRow, 'client_email')
          if (!clientEmail) throw new Error('client_email requis')

          let client: any
          try {
            client = await pb.collection('clients').getFirstListItem(`email="${clientEmail}"`)
          } catch {
            throw new Error(
              `Client introuvable pour l'email "${clientEmail}" — créez d'abord le client`,
            )
          }

          // Check unique constraints (driven by config)
          let isDuplicate = false
          for (const f of getUniqueFields()) {
            const val = col(firstRow, f.key)
            if (!val) continue
            try {
              await pb.collection('invoices').getFirstListItem(`${f.key}="${val}"`)
              isDuplicate = true // already exists → skip
            } catch { /* not found → ok to create */ }
          }
          if (isDuplicate) {
            result.unchanged++
            result.success = result.created + result.updated + result.unchanged
            continue
          }

          // Build snapshots from live data
          const { clientSnapshot, companySnapshot } = await buildSnapshots(client.id, pb)

          // Create invoice
          const invoice = await pb.collection('invoices').create({
            client: client.id,
            invoice_number: invoiceNumber,
            date: displayToIso(col(firstRow, 'date')),
            due_date: displayToIso(col(firstRow, 'due_date')) || null,
            status: parseStatus(col(firstRow, 'status')),
            tva_enabled: parseBool(col(firstRow, 'tva_enabled')),
            tva_rate: col(firstRow, 'tva_rate') ? parseFloat(col(firstRow, 'tva_rate')) : null,
            notes: col(firstRow, 'notes') || '',
            client_snapshot: clientSnapshot,
            company_snapshot: companySnapshot,
          })

          // Create lines
          let sortOrder = 1
          for (const row of invoiceRows) {
            const description = col(row, 'description')
            if (!description) continue
            await pb.collection('invoice_lines').create({
              invoice: invoice.id,
              description,
              quantity: parseFloat(col(row, 'quantity') || '1'),
              unit_price: parseFloat(col(row, 'unit_price') || '0'),
              sort_order: sortOrder++,
            })
          }

          result.created++
        } catch (error: any) {
          const pbErr = error?.data || error?.response?.data
          let msg = error?.message || 'Erreur inconnue'
          if (pbErr?.data) {
            msg = Object.entries(pbErr.data)
              .map(([f, e]: [string, any]) => `${f}: ${e?.message || String(e)}`)
              .join('; ')
          } else if (pbErr?.message) {
            msg = pbErr.message
          }
          result.errors.push({ line: lineNum + 1, name: invoiceNumber, error: msg })
        } finally {
          result.success = result.created + result.updated + result.unchanged
        }
      }
    } finally {
      isImporting.value = false
    }

    return result
  }

  return { isExporting, isImporting, exportToCSV, importFromCSV }
}
