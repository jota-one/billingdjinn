import { SwissQRBill } from 'swissqrbill/svg'
import type {
  TInvoiceBase,
  TInvoiceLine,
  TClientSnapshot,
  TCompanySnapshot,
} from '@/admin/composables/useInvoices'

const MM_TO_PT = 72 / 25.4
const MM_TO_PX = 96 / 25.4 // swissqrbill utilise des coordonnées CSS pixels (96dpi) en interne

/**
 * swissqrbill déclare width/height en mm mais utilise des coordonnées CSS pixels (96dpi) en interne.
 * pdfmake interprète les unités SVG comme des pt (72dpi), ce qui cause un décalage d'échelle.
 *
 * Fix :
 *  - width/height convertis en pt (pour que pdfmake sache la taille physique)
 *  - viewBox exprimé en CSS pixels (pour couvrir tout le contenu interne de swissqrbill)
 *
 * Exemple pour 210×105mm :
 *   width="595.28" height="297.64" viewBox="0 0 793.70 396.85"
 */
function normalizeSvgForPdfmake(svg: string): string {
  return svg.replace(
    /(<svg[^>]*?)\s+width="(\d+(?:\.\d+)?)mm"\s+height="(\d+(?:\.\d+)?)mm"/,
    (_, prefix, w, h) => {
      const wPt = (parseFloat(w) * MM_TO_PT).toFixed(2)
      const hPt = (parseFloat(h) * MM_TO_PT).toFixed(2)
      const wPx = (parseFloat(w) * MM_TO_PX).toFixed(2)
      const hPx = (parseFloat(h) * MM_TO_PX).toFixed(2)
      return `${prefix} width="${wPt}" height="${hPt}" viewBox="0 0 ${wPx} ${hPx}"`
    },
  )
}

/**
 * Génère le SVG du bordereau QR suisse (paiement + reçu, 210mm × 105mm).
 * Type de référence : NON (IBAN classique, sans référence structurée).
 *
 * Retourne null si les données sont insuffisantes (IBAN manquant, adresse incomplète, etc.)
 * ou si swissqrbill rejette les données — la facture reste générée sans bordereau.
 */
export function buildQrBillSvg(
  invoice: TInvoiceBase,
  lines: TInvoiceLine[],
  client: TClientSnapshot,
  company: TCompanySnapshot,
): string | null {
  const iban = (company.bank_account || '').replace(/\s+/g, '')

  if (!iban || !company.name || !company.zip || !company.city) {
    return null
  }

  const totalHT = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0)
  const tvaRate = invoice.tva_enabled && invoice.tva_rate ? invoice.tva_rate / 100 : 0
  const totalTTC = Math.round(totalHT * (1 + tvaRate) * 100) / 100

  // Seules CHF et EUR sont autorisées par la norme QR suisse
  const currency: 'CHF' | 'EUR' = company.currency === 'EUR' ? 'EUR' : 'CHF'

  try {
    const qrBill = new SwissQRBill(
      {
        currency,
        amount: totalTTC,
        creditor: {
          account: iban,
          name: company.name,
          address: company.street || '',
          zip: company.zip,
          city: company.city,
          country: company.country || 'CH',
        },
        ...(client.name && client.zip && client.city
          ? {
              debtor: {
                name: client.name,
                address: client.street || '',
                zip: client.zip,
                city: client.city,
                country: client.country || 'CH',
              },
            }
          : {}),
        ...(invoice.invoice_number ? { message: `Facture ${invoice.invoice_number}` } : {}),
      },
      { language: 'FR' },
    )
    return normalizeSvgForPdfmake(qrBill.toString())
  } catch {
    return null
  }
}
