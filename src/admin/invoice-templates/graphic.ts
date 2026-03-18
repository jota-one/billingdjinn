import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces'
import type {
  TInvoice,
  TInvoiceLine,
  TClientSnapshot,
  TCompanySnapshot,
} from '../composables/useInvoices'
import { label } from '../utils/invoice-labels'
import type { TInvoiceLabels } from '../types/invoice-labels'

// ─── helpers ────────────────────────────────────────────────────────────────

export const formatDate = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export const formatCurrency = (n: number, currency: string) =>
  new Intl.NumberFormat('fr-CH', { style: 'currency', currency })
    .format(n)
    .replace(/\u202F/g, "'")
    .replace(/\u00A0/g, ' ')

const lineTotal = (l: { quantity: number; unit_price: number }) => l.quantity * l.unit_price

const logoContent = (logo: string | null | undefined): Content => {
  if (!logo) return { text: '' }
  if (/^data:image\/svg\+xml/i.test(logo)) {
    const svgString = atob(logo.split(',')[1])
    return { svg: svgString, width: 90, margin: [0, 0, 0, 4] }
  }
  if (/^data:image\/(jpeg|jpg|png)/i.test(logo)) {
    return { image: logo, width: 90, margin: [0, 0, 0, 4] }
  }
  return { text: '' }
}

// ─── design tokens ───────────────────────────────────────────────────────────

const ACCENT = '#0C0052'
const ACCENT_LIGHT = '#EEF1F7'
const MUTED = '#6b7280'
const INK = '#111827'

// ─── template ────────────────────────────────────────────────────────────────

export default function buildDocDef(
  invoice: TInvoice,
  lines: TInvoiceLine[],
  client: TClientSnapshot,
  company: TCompanySnapshot,
  labels: Required<TInvoiceLabels>,
): TDocumentDefinitions {
  const currency = company.currency || 'CHF'
  const fmt = (n: number) => formatCurrency(n, currency)
  const totalHT = lines.reduce((s, l) => s + lineTotal(l), 0)
  const totalTVA = invoice.tva_enabled && invoice.tva_rate ? totalHT * (invoice.tva_rate / 100) : 0
  const totalTTC = totalHT + totalTVA

  // ── header: title left + logo/company right ──
  const header: Content = {
    columns: [
      {
        stack: [
          { text: 'FACTURE', style: 'invoiceTitle' },
          invoice.invoice_number
            ? { text: `N°\u00a0${invoice.invoice_number}`, style: 'invoiceNumber' }
            : { text: 'BROUILLON', style: 'invoiceNumber' },
        ],
      },
      {
        stack: [
          logoContent(company.logo_base64),
          { text: company.name, style: 'companyName' },
          { text: company.address || '', style: 'small' },
          { text: ' ', style: 'small' },
          company.tva_number ? { text: company.tva_number, style: 'small' } : '',
        ],
        alignment: 'right',
      },
    ],
    margin: [0, 0, 0, 16],
  }

  // ── separator ──
  const separator: Content = {
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 1, lineColor: ACCENT }],
    margin: [0, 0, 0, 20],
  }

  // ── client + meta side by side ──
  const clientLines = [client.name]
  if (client.contact_person) clientLines.push(client.contact_person)
  if (client.address) clientLines.push(client.address)

  const metaRows: Content[] = [
    {
      text: [
        { text: 'Date  ', style: 'metaLabel' },
        { text: formatDate(invoice.date), style: 'metaValue' },
      ],
      margin: [0, 0, 0, 3],
    },
  ]
  if (invoice.due_date) {
    metaRows.push({
      text: [
        { text: 'Échéance  ', style: 'metaLabel' },
        { text: formatDate(invoice.due_date), style: 'metaValue' },
      ],
      margin: [0, 0, 0, 3],
    })
  }

  const clientMeta: Content = {
    columns: [
      {
        stack: [
          { text: labels.section_attention, style: 'label' },
          { text: clientLines.join('\n'), style: 'body' },
        ],
      },
      {
        stack: metaRows,
        alignment: 'right',
      },
    ],
    margin: [0, 0, 0, 24],
  }

  // ── lines table + totals ──
  const tableBody: TableCell[][] = [
    [
      { text: labels.col_description, style: 'tableHeader' },
      { text: labels.col_qty, style: 'tableHeader', alignment: 'right', noWrap: true },
      { text: labels.col_unit_price, style: 'tableHeader', alignment: 'right', noWrap: true },
      { text: labels.col_total, style: 'tableHeader', alignment: 'right', noWrap: true },
    ],
    ...lines.map((l, i) => [
      { text: l.description, style: 'body', fillColor: i % 2 === 0 ? undefined : ACCENT_LIGHT },
      {
        text: String(l.quantity),
        style: 'body',
        alignment: 'right' as const,
        noWrap: true,
        fillColor: i % 2 === 0 ? undefined : ACCENT_LIGHT,
      },
      {
        text: fmt(l.unit_price),
        style: 'body',
        alignment: 'right' as const,
        noWrap: true,
        fillColor: i % 2 === 0 ? undefined : ACCENT_LIGHT,
      },
      {
        text: fmt(lineTotal(l)),
        style: 'body',
        alignment: 'right' as const,
        noWrap: true,
        fillColor: i % 2 === 0 ? undefined : ACCENT_LIGHT,
      },
    ]),
    // spacer
    [{ text: '', colSpan: 4 }, {}, {}, {}],
    // total HT
    [
      { text: labels.total_ht, colSpan: 3, alignment: 'right', style: 'body' },
      {},
      {},
      { text: fmt(totalHT), alignment: 'right', style: 'body', noWrap: true },
    ],
  ]

  if (invoice.tva_enabled && invoice.tva_rate) {
    tableBody.push([
      {
        text: label(labels.total_tva, { rate: String(invoice.tva_rate) }),
        colSpan: 3,
        alignment: 'right',
        style: 'body',
      },
      {},
      {},
      { text: fmt(totalTVA), alignment: 'right', style: 'body', noWrap: true },
    ])
  }

  tableBody.push([
    {
      text: labels.total_ttc,
      colSpan: 3,
      alignment: 'right',
      bold: true,
      color: '#ffffff',
      fillColor: ACCENT,
    },
    {},
    {},
    {
      text: fmt(totalTTC),
      alignment: 'right',
      bold: true,
      color: '#ffffff',
      fillColor: ACCENT,
      noWrap: true,
    },
  ])

  const linesTable: Content = {
    table: {
      headerRows: 1,
      widths: ['*', 'auto', 'auto', 'auto'],
      body: tableBody,
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingTop: () => 7,
      paddingBottom: () => 7,
      paddingLeft: () => 8,
      paddingRight: () => 8,
    },
    margin: [0, 0, 0, 24],
  }

  // ── payment info ──
  const paymentStack: Content[] = []
  if (company.bank_account) {
    paymentStack.push({ text: `IBAN\u00a0: ${company.bank_account}`, style: 'body' })
  }
  if (invoice.due_date) {
    paymentStack.push({
      text: label(labels.payment_mention, {
        date: formatDate(invoice.due_date),
        n: String((invoice as any).payment_terms ?? ''),
      }),
      style: 'small',
    })
  }

  // ── notes ──
  const notesBlock: Content = invoice.notes
    ? [
        {
          text: '\n' + labels.section_notes,
          style: 'label',
          margin: [0, 12, 0, 4] as [number, number, number, number],
        },
        { text: invoice.notes, style: 'body' },
      ]
    : []

  // ── footer ──
  const footerLine = [company.name, company.address, company.phone, company.email]
    .filter(Boolean)
    .join('  ·  ')

  return {
    pageSize: 'A4',
    pageMargins: [56, 50, 50, 70],
    background: (): Content => ({
      canvas: [
        // carré
        {
          type: 'polyline',
          closePath: true,
          color: ACCENT_LIGHT,
          points: [
            { x: 44, y: 0 },
            { x: 194, y: 0 },
            { x: 194, y: 150 },
            { x: 44, y: 150 },
          ],
        },
        // triangle rectangle (moitié gauche du carré suivant, diagonal haut-droite → bas-gauche)
        {
          type: 'polyline',
          closePath: true,
          color: ACCENT_LIGHT,
          points: [
            { x: 44, y: 150 },
            { x: 194, y: 150 },
            { x: 44, y: 300 },
          ],
        },
      ],
    }),
    content: [header, separator, clientMeta, linesTable, ...paymentStack, notesBlock],
    footer: (_currentPage: number, _pageCount: number): Content => ({
      text: footerLine,
      alignment: 'center',
      style: 'footer',
      margin: [56, 0, 50, 0],
    }),
    styles: {
      invoiceTitle: { fontSize: 30, bold: true, color: ACCENT },
      invoiceNumber: { fontSize: 13, color: ACCENT, margin: [0, 2, 0, 0] },
      companyName: { fontSize: 11, bold: true, color: INK },
      tableHeader: { bold: true, fillColor: ACCENT, color: '#ffffff', fontSize: 10 },
      metaLabel: { fontSize: 9, bold: true, color: MUTED },
      metaValue: { fontSize: 10, color: INK },
      label: { fontSize: 9, bold: true, color: MUTED, margin: [0, 0, 0, 3] },
      body: { fontSize: 10, color: INK },
      small: { fontSize: 9, color: '#374151' },
      footer: { fontSize: 8, color: '#9ca3af' },
    },
    defaultStyle: { font: 'Roboto', fontSize: 10 },
  }
}
