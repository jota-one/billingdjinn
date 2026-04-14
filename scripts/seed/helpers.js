export const TODAY = new Date('2026-04-13T12:00:00Z')

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function weightedPick(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

export function roundCHF(n) {
  return Math.round(n * 100) / 100
}

export function toDateStr(d) {
  return d.toISOString().split('T')[0]
}

export function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return toDateStr(d)
}

export function daysAgo(dateStr) {
  return Math.floor((TODAY - new Date(dateStr + 'T12:00:00Z')) / (1000 * 60 * 60 * 24))
}

export const MONTH_NAMES_FR = [
  '',
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
]

export function monthPad(m) {
  return String(m).padStart(2, '0')
}
export function dayPad(d) {
  return String(d).padStart(2, '0')
}

export function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

export function spreadDates(year, month, count) {
  const dim = daysInMonth(year, month)
  return Array.from({ length: count }, (_, i) => {
    const base = Math.floor(((i + 0.5) / count) * dim) + 1
    const day = Math.max(1, Math.min(dim, base + randomInt(-1, 1)))
    return `${year}-${monthPad(month)}-${dayPad(day)}`
  })
}

export function invoiceNumber(year, counter) {
  return `${year}-${String(counter).padStart(3, '0')}`
}

export function buildClientSnapshot(client) {
  return {
    name: client.name ?? '',
    address: client.address ?? '',
    email: client.email ?? '',
    phone: client.phone ?? '',
    contact_person: client.contact_person ?? '',
  }
}

export function buildCompanySnapshot(settings) {
  return {
    name: settings.company_name ?? '',
    address: settings.address ?? '',
    phone: settings.phone ?? '',
    email: settings.email ?? '',
    bank_account: settings.bank_account ?? '',
    tva_number: settings.tva_number ?? '',
    currency: settings.currency ?? 'CHF',
    logo_base64: '',
  }
}

/** Convert a foreign-currency amount to CHF (approximate fixed rates) */
export function toCHF(amount, currency) {
  if (!currency || currency === 'CHF') return amount
  const rates = { EUR: 0.94, USD: 0.9, GBP: 1.12 }
  return roundCHF(amount * (rates[currency] ?? 1))
}

/** Returns [{year, month}] from monthsBack months ago up to today */
export function getMonths(monthsBack) {
  const months = []
  const cursor = new Date(TODAY)
  cursor.setMonth(cursor.getMonth() - monthsBack)
  cursor.setDate(1)
  while (cursor <= TODAY) {
    months.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return months
}

/** Determine invoice status based on invoice age vs payment terms */
export function resolveStatus(invoiceDateStr, paymentTerms = 30) {
  const age = daysAgo(invoiceDateStr)
  if (age < 10) return 'draft'
  if (age < paymentTerms) return Math.random() < 0.5 ? 'sent' : 'paid'
  if (age < paymentTerms + 20) return Math.random() < 0.1 ? 'sent' : 'paid'
  return 'paid'
}

/**
 * Whether to emit a charge entry for a given month.
 * charge.every: 'month' | 'quarter' | 'half-year' | 'year'
 * charge.month (for 'year'): which month
 */
export function shouldEmitCharge(charge, month) {
  switch (charge.every) {
    case 'month':
      return true
    case 'quarter':
      return [3, 6, 9, 12].includes(month)
    case 'half-year':
      return [5, 11].includes(month)
    case 'year':
      return charge.month === month
    default:
      return true
  }
}
