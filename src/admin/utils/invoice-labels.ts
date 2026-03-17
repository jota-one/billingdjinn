import type { TInvoiceLabels } from '../types/invoice-labels'

export const DEFAULT_LABELS: Required<TInvoiceLabels> = {
  col_description: 'Description',
  col_qty: 'Qté',
  col_unit_price: 'Prix unit.',
  col_total: 'Total',
  section_attention: "À l'attention de",
  section_notes: 'Notes',
  total_ht: 'Total HT',
  total_tva: 'TVA {rate}\u00a0%',
  total_ttc: 'Total TTC',
  payment_mention: 'Paiement à effectuer au plus tard le {date}.',
}

function cleanLabels(labels?: TInvoiceLabels | null): TInvoiceLabels {
  if (!labels) return {}
  return Object.fromEntries(
    Object.entries(labels).filter(([, v]) => v !== '' && v != null),
  ) as TInvoiceLabels
}

export function resolveLabels(
  companyLabels?: TInvoiceLabels | null,
  clientLabels?: TInvoiceLabels | null,
): Required<TInvoiceLabels> {
  return {
    ...DEFAULT_LABELS,
    ...cleanLabels(companyLabels),
    ...cleanLabels(clientLabels),
  }
}

export function label(text: string, vars?: Record<string, string>): string {
  if (!vars) return text
  return Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, v), text)
}
