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

const ACCENT = '#000000'
const ACCENT_LIGHT = '#EEF1F7'
const MUTED = '#6b7280'
const INK = '#111827'

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

  // ── header: title left + logo/company right ──
  const header: Content = {
    columns: [
      {
        stack: [
          { text: labels.invoice_title, style: 'invoiceTitle' },
          invoice.invoice_number
            ? { text: `N°\u00a0${invoice.invoice_number}`, style: 'invoiceNumber' }
            : { text: labels.draft, style: 'invoiceNumber' },
          { text: company.name, style: 'companyName' },
          ...formatAddressLines(company).map(l => ({ text: l, style: 'small' })),
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
  clientLines.push(...formatAddressLines(client))

  const metaRows: Content[] = [
    {
      text: [
        { text: labels.date + '  ', style: 'metaLabel' },
        { text: formatDate(invoice.date), style: 'metaValue' },
      ],
      margin: [0, 0, 0, 3],
    },
  ]
  if (invoice.due_date) {
    metaRows.push({
      text: [
        { text: labels.due_date + '  ', style: 'metaLabel' },
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
      { stack: metaRows, alignment: 'right' },
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
    [{ text: '', colSpan: 4 }, {}, {}, {}],
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
    table: { headerRows: 1, widths: ['*', 'auto', 'auto', 'auto'], body: tableBody },
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
    paymentStack.push({ text: `${labels.iban}\u00a0: ${company.bank_account}`, style: 'body' })
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
    pageMargins: [56, 110, 50, 70],
    background: (): Content => ({
      svg: `<svg fill="none" height="80" viewBox="0 0 82 120" xmlns="http://www.w3.org/2000/svg"><path d="m81.3128 0v38.6871l-81.3128 81.3129v-120z" fill="#000"/><path clip-rule="evenodd" d="m31.8578 41.2802c-1.8 0-3.1778-.5171-4.1333-1.5512-.9556-1.0342-1.4334-2.4955-1.4334-4.3839v-12.4099c0-1.8885.4778-3.3498 1.4334-4.384.9555-1.0341 2.3333-1.5512 4.1333-1.5512s3.1778.5171 4.1333 1.5512c.9556 1.0342 1.4333 2.4955 1.4333 4.384v12.4099c0 1.8884-.4777 3.3497-1.4333 4.3839-.9555 1.0341-2.3333 1.5512-4.1333 1.5512zm0-3.3722c1.2667 0 1.9-.7757 1.9-2.3269v-12.882c0-1.5512-.6333-2.3268-1.9-2.3268s-1.9.7756-1.9 2.3268v12.882c0 1.5512.6333 2.3269 1.9 2.3269zm-14.1578 3.1699c-.6667 0-1.7 0-1.7 0v-3.3723h1.2c.7333 0 1.2778-.1798 1.6333-.5395.3556-.3822.5334-.9555.5334-1.7199v-9.2068l3.6666-3.7095v12.8152c0 1.9334-.4444 3.3722-1.3333 4.3164-.8667.9443-2.2 1.4164-4 1.4164zm5.3333-21.9758v-1.7649h-3.6666v5.4744zm19.1537 1.6074h-3.8333v-3.3723h11.3333v3.3723h-3.8333v20.2335h-3.6667zm10.1437-3.3723h4.9667l3.8 23.6058h-3.6667l-.6667-4.6874v.0674h-4.1666l-.6667 4.62h-3.4zm4 15.7822-1.6333-11.668h-.0667l-1.6 11.668z" fill="#fff" fill-rule="evenodd"/></svg>`,
      absolutePosition: { x: 42, y: 0 },
    }),
    content: [header, separator, clientMeta, linesTable, ...paymentStack, notesBlock, ...qrSlip],
    footer: (currentPage: number, pageCount: number): Content =>
      hasQr && currentPage === pageCount
        ? { text: '' }
        : { text: footerLine, alignment: 'center', style: 'footer', margin: [56, 0, 50, 0] },
    styles: {
      invoiceTitle: { fontSize: 20, bold: true, color: ACCENT },
      invoiceNumber: { fontSize: 10, color: ACCENT, margin: [0, 2, 0, 0] },
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
