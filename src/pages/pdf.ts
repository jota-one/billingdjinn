import type { APIRoute } from 'astro'
import type {
  TInvoiceBase,
  TInvoiceLine,
  TClientSnapshot,
  TCompanySnapshot,
} from '@/admin/composables/useInvoices'
import type { TInvoiceLabels } from '@/admin/types/invoice-labels'
import { resolveLabels } from '@/admin/utils/invoice-labels'

interface PdfRequestBody {
  invoice: TInvoiceBase
  lines: TInvoiceLine[]
  client: TClientSnapshot
  company: TCompanySnapshot
  companyLabels?: TInvoiceLabels | null
  clientLabels?: TInvoiceLabels | null
  template?: string
}

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  const secret = process.env.ASTRO_PDF_SECRET ?? import.meta.env.ASTRO_PDF_SECRET
  if (secret) {
    const header = request.headers.get('x-pdf-secret')
    if (header !== secret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  let body: PdfRequestBody
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { invoice, lines, client, company, companyLabels, clientLabels, template = 'default' } =
    body

  const labels = resolveLabels(companyLabels, clientLabels)

  const { createRequire } = await import('module')
  const require = createRequire(import.meta.url)

  const pdfmake = require('pdfmake')
  const rawFonts = require('pdfmake/build/vfs_fonts')
  const vfs: Record<string, string> = rawFonts.pdfMake?.vfs ?? rawFonts

  // Populate the VFS with font buffers and point font descriptors to VFS paths
  pdfmake.virtualfs.writeFileSync('Roboto-Regular.ttf', Buffer.from(vfs['Roboto-Regular.ttf'], 'base64'))
  pdfmake.virtualfs.writeFileSync('Roboto-Medium.ttf', Buffer.from(vfs['Roboto-Medium.ttf'], 'base64'))
  pdfmake.virtualfs.writeFileSync('Roboto-Italic.ttf', Buffer.from(vfs['Roboto-Italic.ttf'], 'base64'))
  pdfmake.virtualfs.writeFileSync('Roboto-MediumItalic.ttf', Buffer.from(vfs['Roboto-MediumItalic.ttf'], 'base64'))

  pdfmake.fonts = {
    Roboto: {
      normal: 'Roboto-Regular.ttf',
      bold: 'Roboto-Medium.ttf',
      italics: 'Roboto-Italic.ttf',
      bolditalics: 'Roboto-MediumItalic.ttf',
    },
  }

  const validTemplates = ['default', 'graphic', 'qr-default', 'qr-graphic'] as const
  type TemplateName = (typeof validTemplates)[number]
  const templateKey: TemplateName = validTemplates.includes(template as TemplateName)
    ? (template as TemplateName)
    : 'default'

  const templateImports: Record<TemplateName, () => Promise<{ default: Function }>> = {
    default: () => import('@/admin/invoice-templates/default'),
    graphic: () => import('@/admin/invoice-templates/graphic'),
    'qr-default': () => import('@/admin/invoice-templates/qr-default'),
    'qr-graphic': () => import('@/admin/invoice-templates/qr-graphic'),
  }

  const { default: buildDocDef } = await templateImports[templateKey]()
  const docDef = buildDocDef(invoice, lines, client, company, labels)

  const doc = pdfmake.createPdf(docDef)
  const pdfBase64: string = await doc.getBase64()

  return new Response(JSON.stringify({ pdf: pdfBase64 }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
