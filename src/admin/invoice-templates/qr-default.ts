import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces'
import type {
  TInvoiceBase,
  TInvoiceLine,
  TClientSnapshot,
  TCompanySnapshot,
} from '@/admin/composables/useInvoices'
import { label } from '@/admin/utils/invoice-labels'
import type { TInvoiceLabels } from '@/admin/types/invoice-labels'
import { formatDate, formatCurrency, formatAddressLines } from './default'
import { buildQrBillSvg } from '@/admin/utils/qr-bill'

const lineTotal = (l: { quantity: number; unit_price: number }) => l.quantity * l.unit_price

const logoContent = (logo: string | null | undefined): Content => {
  if (!logo) return { text: '' }
  if (/^data:image\/svg\+xml/i.test(logo)) {
    return { svg: atob(logo.split(',')[1]), width: 100, margin: [0, 0, 0, 0] }
  }
  if (/^data:image\/(jpeg|jpg|png)/i.test(logo)) {
    return { image: logo, width: 100, margin: [0, 0, 0, 0] }
  }
  return { text: '' }
}

export default function buildDocDef(
  invoice: TInvoiceBase,
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

  // ── header: logo + company ──
  const headerColumns: Content = {
    columns: [
      logoContent(company.logo_base64),
      {
        stack: [
          { text: company.name, style: 'companyName' },
          ...formatAddressLines(company).map(l => ({ text: l, style: 'small' })),
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
  clientLines.push(...formatAddressLines(client))
  if (client.email) clientLines.push(client.email)

  const clientBlock: Content = {
    stack: [
      { text: labels.section_attention, style: 'label' },
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
      { text: labels.col_description, style: 'tableHeader' },
      { text: labels.col_qty, style: 'tableHeader', alignment: 'right' },
      { text: labels.col_unit_price, style: 'tableHeader', alignment: 'right' },
      { text: labels.col_total, style: 'tableHeader', alignment: 'right' },
    ],
    ...lines.map(l => [
      { text: l.description, style: 'body' },
      { text: String(l.quantity), style: 'body', alignment: 'right' as const },
      { text: fmt(l.unit_price), style: 'body', alignment: 'right' as const },
      { text: fmt(lineTotal(l)), style: 'body', alignment: 'right' as const },
    ]),
  ]

  const linesTable: Content = {
    table: { headerRows: 1, widths: ['*', 'auto', 'auto', 'auto'], body: tableBody },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 16],
  }

  // ── totals ──
  const totalsRows: TableCell[][] = [
    [
      { text: labels.total_ht, alignment: 'right', style: 'body' },
      { text: fmt(totalHT), alignment: 'right', style: 'body' },
    ],
  ]
  if (invoice.tva_enabled && invoice.tva_rate) {
    totalsRows.push([
      {
        text: label(labels.total_tva, { rate: String(invoice.tva_rate) }),
        alignment: 'right',
        style: 'body',
      },
      { text: fmt(totalTVA), alignment: 'right', style: 'body' },
    ])
  }
  totalsRows.push([
    { text: labels.total_ttc, alignment: 'right', bold: true },
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

  // ── footer company line ──
  const footerLine = [company.name, ...formatAddressLines(company), company.phone, company.email]
    .filter(Boolean)
    .join('  ·  ')

  // ── QR slip ──
  const qrSvg = buildQrBillSvg(invoice, lines, client, company)
  const QR_H = 298
  const PAGE_H = 842
  const QR_Y = PAGE_H - QR_H
  const hasQr = qrSvg !== null
  const qrSlip: Content[] = qrSvg
    ? [
        { text: '', pageBreak: 'before' } as Content,
        {
          text: footerLine,
          style: 'footer',
          alignment: 'center',
          absolutePosition: { x: 56, y: QR_Y - 30 },
        } as Content,
        {
          canvas: [
            { type: 'line', x1: 0, y1: 0, x2: 595, y2: 0, lineWidth: 0.5, lineColor: '#000000' },
          ],
          absolutePosition: { x: 0, y: QR_Y },
        } as Content,
        {
          svg: qrSvg,
          width: 595,
          absolutePosition: { x: 0, y: QR_Y },
        } as Content,
      ]
    : []

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
      ...qrSlip,
    ],
    footer: (currentPage: number, pageCount: number): Content =>
      hasQr && currentPage === pageCount
        ? { text: '' }
        : { text: footerLine, alignment: 'center', style: 'footer', margin: [50, 0] },
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
