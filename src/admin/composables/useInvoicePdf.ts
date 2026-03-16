import pdfMake from 'pdfmake/build/pdfmake'
import * as pdfFonts from 'pdfmake/build/vfs_fonts'
import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces'
import type { TInvoice, TInvoiceLine, TClientSnapshot, TCompanySnapshot } from './useInvoices'
import PocketBase from 'pocketbase'
import config from '../../config'

// Init Roboto fonts
;(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs ?? (pdfFonts as any).vfs ?? pdfFonts

// ─── helpers ────────────────────────────────────────────────────────────────

const formatDate = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatCurrency = (n: number, currency: string) =>
  new Intl.NumberFormat('fr-CH', { style: 'currency', currency })
    .format(n)
    .replace(/\u202F/g, "'")  // narrow no-break space (thousands sep) → apostrophe
    .replace(/\u00A0/g, ' ')  // no-break space (before symbol) → regular space

const lineTotal = (l: { quantity: number; unit_price: number }) => l.quantity * l.unit_price

const logoContent = (logo: string | null | undefined): Content => {
  if (!logo) return { text: '' }
  if (/^data:image\/svg\+xml/i.test(logo)) {
    const svgString = atob(logo.split(',')[1])
    return { svg: svgString, width: 100, margin: [0, 0, 0, 0] }
  }
  if (/^data:image\/(jpeg|jpg|png)/i.test(logo)) {
    return { image: logo, width: 100, margin: [0, 0, 0, 0] }
  }
  return { text: '' }
}

// ─── data resolution ────────────────────────────────────────────────────────

async function resolveData(invoice: TInvoice): Promise<{
  client: TClientSnapshot
  company: TCompanySnapshot
}> {
  // If snapshot exists, use it directly
  if (invoice.client_snapshot && invoice.company_snapshot) {
    return { client: invoice.client_snapshot, company: invoice.company_snapshot }
  }

  // Draft fallback: load live data
  const pb = new PocketBase(config.apiBaseUrl)
  const [clientRaw, settingsRaw] = await Promise.all([
    pb.collection('clients').getOne<Record<string, any>>(invoice.client),
    pb.collection('company_settings').getFirstListItem<Record<string, any>>(''),
  ])

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
      address: clientRaw.address || '',
      email: clientRaw.email || '',
      phone: clientRaw.phone || '',
      contact_person: clientRaw.contact_person || '',
    },
    company: {
      name: settingsRaw.company_name || '',
      address: settingsRaw.address || '',
      phone: settingsRaw.phone || '',
      email: settingsRaw.email || '',
      bank_account: settingsRaw.bank_account || '',
      tva_number: settingsRaw.tva_number || '',
      logo_base64,
      currency: clientRaw.currency || settingsRaw.currency || 'CHF',
    },
  }
}

// ─── document definition ────────────────────────────────────────────────────

function buildDocDef(
  invoice: TInvoice,
  lines: TInvoiceLine[],
  client: TClientSnapshot,
  company: TCompanySnapshot,
): TDocumentDefinitions {
  const currency = company.currency || 'CHF'
  const fmt = (n: number) => formatCurrency(n, currency)
  const totalHT = lines.reduce((s, l) => s + lineTotal(l), 0)
  const totalTVA = invoice.tva_enabled && invoice.tva_rate ? totalHT * (invoice.tva_rate / 100) : 0
  const totalTTC = totalHT + totalTVA

  // ── header: logo + company ──
  const headerColumns: Content = {
    columns: [
      logoContent(company.logo_base64),
      {
        stack: [
          { text: company.name, style: 'companyName' },
          { text: company.address || '', style: 'small' },
          company.phone ? { text: company.phone, style: 'small' } : '',
          company.email ? { text: company.email, style: 'small' } : '',
          company.tva_number ? { text: company.tva_number, style: 'small' } : '',
        ],
        alignment: 'right',
      },
    ],
    margin: [0, 0, 0, 24],
  }

  // ── client block ──
  const clientLines = [client.name]
  if (client.contact_person) clientLines.push(client.contact_person)
  if (client.address) clientLines.push(client.address)
  if (client.email) clientLines.push(client.email)

  const clientBlock: Content = {
    stack: [
      { text: "À l'attention de", style: 'label' },
      { text: clientLines.join('\n'), style: 'body' },
    ],
    margin: [0, 0, 0, 20],
  }

  // ── invoice metadata ──
  const metaBlock: Content = {
    stack: [
      {
        text: `FACTURE${invoice.invoice_number ? ' N\u00b0\u00a0' + invoice.invoice_number : ''}`,
        style: 'invoiceTitle',
      },
      {
        columns: [
          { text: `Date\u00a0: ${formatDate(invoice.date)}`, style: 'body' },
          invoice.due_date
            ? { text: `Échéance\u00a0: ${formatDate(invoice.due_date)}`, style: 'body' }
            : { text: '' },
        ],
      },
    ],
    margin: [0, 0, 0, 20],
  }

  // ── lines table ──
  const tableBody: TableCell[][] = [
    [
      { text: 'Description', style: 'tableHeader' },
      { text: 'Qté', style: 'tableHeader', alignment: 'right' },
      { text: 'Prix unit.', style: 'tableHeader', alignment: 'right' },
      { text: 'Total', style: 'tableHeader', alignment: 'right' },
    ],
    ...lines.map(l => [
      { text: l.description, style: 'body' },
      { text: String(l.quantity), style: 'body', alignment: 'right' as const },
      { text: fmt(l.unit_price), style: 'body', alignment: 'right' as const },
      { text: fmt(lineTotal(l)), style: 'body', alignment: 'right' as const },
    ]),
  ]

  const linesTable: Content = {
    table: {
      headerRows: 1,
      widths: ['*', 'auto', 'auto', 'auto'],
      body: tableBody,
    },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 16],
  }

  // ── totals ──
  const totalsRows: TableCell[][] = [
    [
      { text: 'Total HT', alignment: 'right', style: 'body' },
      { text: fmt(totalHT), alignment: 'right', style: 'body' },
    ],
  ]
  if (invoice.tva_enabled && invoice.tva_rate) {
    totalsRows.push([
      { text: `TVA ${invoice.tva_rate}\u00a0%`, alignment: 'right', style: 'body' },
      { text: fmt(totalTVA), alignment: 'right', style: 'body' },
    ])
  }
  totalsRows.push([
    { text: 'Total TTC', alignment: 'right', bold: true },
    { text: fmt(totalTTC), alignment: 'right', bold: true },
  ])

  const totalsTable: Content = {
    table: { widths: ['*', 'auto'], body: totalsRows },
    layout: 'noBorders',
    margin: [0, 0, 0, 24],
  }

  // ── payment info ──
  const paymentStack: Content[] = []
  if (company.bank_account) {
    paymentStack.push({ text: `IBAN\u00a0: ${company.bank_account}`, style: 'body' })
  }
  if (invoice.due_date) {
    paymentStack.push({
      text: `Paiement à effectuer au plus tard le ${formatDate(invoice.due_date)}.`,
      style: 'small',
    })
  }

  // ── notes ──
  const notesBlock: Content = invoice.notes
    ? [
        {
          text: '\nNotes',
          style: 'label',
          margin: [0, 12, 0, 4] as [number, number, number, number],
        },
        { text: invoice.notes, style: 'body' },
      ]
    : []

  // ── footer company line ──
  const footerLine = [company.name, company.address, company.phone, company.email]
    .filter(Boolean)
    .join('  ·  ')

  return {
    pageSize: 'A4',
    pageMargins: [50, 50, 50, 70],
    content: [
      headerColumns,
      clientBlock,
      metaBlock,
      linesTable,
      totalsTable,
      ...paymentStack,
      notesBlock,
    ],
    footer: (_currentPage: number, _pageCount: number): Content => ({
      text: footerLine,
      alignment: 'center',
      style: 'footer',
      margin: [50, 0],
    }),
    styles: {
      companyName: { fontSize: 13, bold: true, color: '#111827' },
      invoiceTitle: { fontSize: 18, bold: true, color: '#111827', margin: [0, 0, 0, 6] },
      tableHeader: { bold: true, fillColor: '#f3f4f6', fontSize: 10 },
      label: { fontSize: 9, bold: true, color: '#6b7280', margin: [0, 0, 0, 2] },
      body: { fontSize: 10, color: '#111827' },
      small: { fontSize: 9, color: '#374151' },
      footer: { fontSize: 8, color: '#9ca3af' },
    },
    defaultStyle: { font: 'Roboto', fontSize: 10 },
  }
}

// ─── public API ─────────────────────────────────────────────────────────────

export async function downloadInvoicePdf(invoice: TInvoice, lines: TInvoiceLine[]) {
  const { client, company } = await resolveData(invoice)
  const docDef = buildDocDef(invoice, lines, client, company)
  const filename = `facture-${invoice.invoice_number || invoice.id}.pdf`
  pdfMake.createPdf(docDef).download(filename)
}
