import pdfMake from 'pdfmake/build/pdfmake'
import * as pdfFonts from 'pdfmake/build/vfs_fonts'
import type { TInvoiceBase, TInvoiceLine, TClientSnapshot, TCompanySnapshot } from './useInvoices'
import PocketBase from 'pocketbase'
import config from '@/config'
import { resolveLabels } from '@/admin/utils/invoice-labels'
import type { TInvoiceLabels } from '@/admin/types/invoice-labels'
import { templates } from '@/admin/invoice-templates'
import type { TemplateName } from '@/admin/invoice-templates'

// Init Roboto fonts
;(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs ?? (pdfFonts as any).vfs ?? pdfFonts

// ─── data resolution ────────────────────────────────────────────────────────

async function resolveData(invoice: TInvoiceBase): Promise<{
  client: TClientSnapshot
  company: TCompanySnapshot
  labels: Required<TInvoiceLabels>
  template: string
}> {
  const pb = new PocketBase(config.apiBaseUrl)
  const [clientRaw, settingsRaw] = await Promise.all([
    pb.collection('clients').getOne<Record<string, any>>(invoice.client),
    pb.collection('company_settings').getFirstListItem<Record<string, any>>(''),
  ])

  const labels = resolveLabels(settingsRaw.labels, clientRaw.labels)
  const template = settingsRaw.invoice_template || 'default'

  if (invoice.client_snapshot && invoice.company_snapshot) {
    // Merge live settings for fields missing in older snapshots
    const company: TCompanySnapshot = {
      ...invoice.company_snapshot,
      bank_account: invoice.company_snapshot.bank_account || settingsRaw.bank_account || '',
    }
    const template = company.invoice_template || settingsRaw.invoice_template || 'default'
    return { client: invoice.client_snapshot, company, labels, template }
  }

  // Draft fallback: build snapshots from live data
  let logo_base64: string | null = null
  if (settingsRaw.logo) {
    try {
      const url = `${config.apiBaseUrl}/api/files/company_settings/${settingsRaw.id}/${settingsRaw.logo}`
      const blob = await (await fetch(url)).blob()
      logo_base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch {
      /* logo unavailable */
    }
  }

  return {
    client: {
      name: clientRaw.name || '',
      street: clientRaw.street || '',
      zip: clientRaw.zip || '',
      city: clientRaw.city || '',
      country: clientRaw.country || 'CH',
      email: clientRaw.email || '',
      phone: clientRaw.phone || '',
      contact_person: clientRaw.contact_person || '',
    },
    company: {
      name: settingsRaw.company_name || '',
      street: settingsRaw.street || '',
      zip: settingsRaw.zip || '',
      city: settingsRaw.city || '',
      country: settingsRaw.country || 'CH',
      phone: settingsRaw.phone || '',
      email: settingsRaw.email || '',
      bank_account: settingsRaw.bank_account || '',
      tva_number: settingsRaw.tva_number || '',
      logo_base64,
      currency: clientRaw.currency || settingsRaw.currency || 'CHF',
    },
    labels,
    template,
  }
}

// ─── public API ─────────────────────────────────────────────────────────────

export async function downloadInvoicePdf(invoice: TInvoiceBase, lines: TInvoiceLine[]) {
  const { client, company, labels, template } = await resolveData(invoice)
  const templateKey = template in templates ? (template as TemplateName) : 'default'
  const { default: buildDocDef } = await templates[templateKey]()
  const docDef = buildDocDef(invoice, lines, client, company, labels)
  const filename = `facture-${invoice.invoice_number || invoice.id}.pdf`
  return pdfMake.createPdf(docDef).download(filename)
}
