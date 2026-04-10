import type { BankAdapter, TBankEntry } from '../../types/bank-entry'

/** Returns the first direct child element with the given local name. */
function child(el: Element, localName: string): Element | null {
  for (const c of Array.from(el.children)) {
    if (c.localName === localName) return c
  }
  return null
}

function text(el: Element | null): string {
  return el?.textContent?.trim() ?? ''
}

/**
 * camt.053 (ISO 20022) XML adapter.
 *
 * Parses Bank-to-Customer Statement files exported by Raiffeisen and other
 * Swiss banks. Amounts are always positive in the XML; direction is given by
 * <CdtDbtInd>: CRDT = credit (+), DBIT = debit (−).
 */
const camt053: BankAdapter = {
  id: 'camt053',
  label: 'camt.053 (XML)',
  parse(xml: string): TBankEntry[] {
    const doc = new DOMParser().parseFromString(xml, 'application/xml')
    if (doc.querySelector('parsererror')) return []

    const entries: TBankEntry[] = []

    for (const ntry of Array.from(doc.getElementsByTagName('Ntry'))) {
      const amountRaw = parseFloat(text(child(ntry, 'Amt')))
      if (isNaN(amountRaw)) continue

      const direction = text(child(ntry, 'CdtDbtInd'))
      const amount = direction === 'DBIT' ? -amountRaw : amountRaw

      const bookgDt = child(ntry, 'BookgDt')
      const date = text(bookgDt ? child(bookgDt, 'Dt') : null)
      if (!date) continue

      const description = text(child(ntry, 'AddtlNtryInf')).replace(/\s*\n\s*/g, ' — ')

      if (amount === 0 && !description) continue

      entries.push({ date, description, amount })
    }

    return entries
  },
}

export default camt053
