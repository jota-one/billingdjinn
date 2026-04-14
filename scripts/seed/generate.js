import {
  randomInt,
  randomFrom,
  weightedPick,
  roundCHF,
  addDays,
  daysAgo,
  spreadDates,
  invoiceNumber,
  buildClientSnapshot,
  buildCompanySnapshot,
  toCHF,
  getMonths,
  resolveStatus,
  shouldEmitCharge,
  monthPad,
  dayPad,
} from './helpers.js'

/**
 * Seeds PocketBase with data for a given persona config.
 *
 * Config shape:
 * {
 *   monthsBack:        number,
 *   taxes:             boolean,        // emit impôts fédéral/cantonal/communal in Jan
 *   transitoires:      boolean,        // add fiscal_year on December paid invoices (PME)
 *   company:           object,         // company_settings fields (no ledger_categories)
 *   categories:        string[],       // category names to create in `categories` collection
 *   profitCenters:     [{ name, color }],  // optional — creates profit_centers records
 *   allocationKeys:    { categoryName: [{ name, pct }][] }, // optional — sets allocation_keys on categories
 *   clients:           array,          // client fields + optional { retainer: { description, amount } }
 *   invoicesPerMonth:  { min, max },
 *   linesPerInvoice:   { min, max },
 *   lineTemplates:     [{ description, qMin, qMax, pMin, pMax }],
 *   lineWeights:       number[],       // parallel to lineTemplates (optional)
 *   charges:           [{              // recurring ledger charges
 *     description:  string | (year, month) => string,
 *     category:     string,
 *     amountMin:    number,
 *     amountMax:    number,
 *     dayOfMonth:   number (optional),
 *     every:        'month' | 'quarter' | 'half-year' | 'year',
 *     month:        number (for every:'year'),
 *     count:        { min, max } (optional, default 1),
 *     profitCenterOverride: string (optional, center name for direct assignment),
 *   }],
 * }
 */
export async function generatePersona(pb, config) {
  const stats = { clients: 0, invoices: 0, lines: 0, ledger: 0 }

  // ── 1. Update company_settings (singleton) ──────────────────────────────────
  const settings = await pb
    .collection('company_settings')
    .getFirstListItem('', { requestKey: null })
  // Strip ledger_categories — categories now live in their own collection
  const { ledger_categories: _ignored, ...companyData } = config.company
  await pb.collection('company_settings').update(settings.id, companyData)
  const fullSettings = { ...settings, ...companyData }
  const companySnap = buildCompanySnapshot(fullSettings)

  // ── 1b. Create categories ────────────────────────────────────────────────────
  const rawCategories = config.categories ?? config.company.ledger_categories ?? []
  const categoryNames = rawCategories.map(c => (typeof c === 'string' ? c : c.name))
  const categoryIdByName = new Map()
  for (const name of categoryNames) {
    const record = await pb
      .collection('categories')
      .create({ name, patterns: [] }, { requestKey: null })
    categoryIdByName.set(name, record.id)
  }
  console.log(`  ${categoryNames.length} catégories créées`)

  // ── 1c. Create profit centers ────────────────────────────────────────────────
  const profitCenterIdByName = new Map()
  if (config.profitCenters?.length) {
    for (const pc of config.profitCenters) {
      const record = await pb
        .collection('profit_centers')
        .create({ name: pc.name, color: pc.color }, { requestKey: null })
      profitCenterIdByName.set(pc.name, record.id)
    }
    console.log(`  ${config.profitCenters.length} centres de profit créés`)
  }

  // ── 1d. Set allocation_keys on categories ────────────────────────────────────
  if (config.allocationKeys && profitCenterIdByName.size > 0) {
    for (const [catName, keys] of Object.entries(config.allocationKeys)) {
      const catId = categoryIdByName.get(catName)
      if (!catId) { continue }
      const allocation_keys = keys
        .map(k => ({ profit_center_id: profitCenterIdByName.get(k.name), percentage: k.pct }))
        .filter(k => k.profit_center_id)
      await pb.collection('categories').update(catId, { allocation_keys }, { requestKey: null })
    }
    console.log(`  Clés de répartition définies pour ${Object.keys(config.allocationKeys).length} catégories`)
  }

  // ── 2. Create clients ───────────────────────────────────────────────────────
  const createdClients = []
  for (const def of config.clients) {
    const { retainer, ...data } = def
    const c = await pb.collection('clients').create(data, { requestKey: null })
    createdClients.push({ ...c, retainer: retainer ?? null })
  }
  stats.clients = createdClients.length
  console.log(`  ${stats.clients} clients créés`)

  const retainerClients = createdClients.filter(c => c.retainer)
  const adHocClients = createdClients.filter(c => !c.retainer)
  const fallbackPool = adHocClients.length ? adHocClients : createdClients

  // ── 3. Month loop ───────────────────────────────────────────────────────────
  const months = getMonths(config.monthsBack)
  const counters = {} // { year: invoiceCounter }
  const revenue = {} // { year: totalHT paid }
  const expenses = {} // { year: totalExpenses }

  const track = (dict, year, amount) => {
    dict[year] = (dict[year] ?? 0) + amount
  }

  for (const { year, month } of months) {
    if (!counters[year]) counters[year] = 0

    // ── Tax entries (January of year Y → taxes for year Y-1) ────────────────
    if (month === 1 && config.taxes) {
      const prevRevenue = revenue[year - 1] ?? 0
      const prevExpenses = expenses[year - 1] ?? 0
      const profit = Math.max(0, prevRevenue - prevExpenses)
      const totalTax = roundCHF(profit * 0.1)

      if (totalTax > 0) {
        const taxEntries = [
          {
            date: `${year}-01-10`,
            category: 'Impôt',
            amount: -roundCHF(totalTax * 0.2),
            description: `Impôt fédéral direct ${year - 1}`,
            is_checked: true,
          },
          {
            date: `${year}-02-05`,
            category: 'Impôt',
            amount: -roundCHF(totalTax * 0.5),
            description: `Impôt cantonal FR ${year - 1}`,
            is_checked: true,
          },
          {
            date: `${year}-02-20`,
            category: 'Impôt',
            amount: -roundCHF(totalTax * 0.3),
            description: `Impôt communal ${year - 1}`,
            is_checked: true,
          },
        ]
        for (const e of taxEntries) {
          await pb.collection('ledger').create(
            { ...e, category_id: categoryIdByName.get(e.category) ?? null, category: undefined },
            { requestKey: null },
          )
          track(expenses, year, Math.abs(e.amount))
          stats.ledger++
        }
        console.log(`  Impôts ${year - 1} → ${totalTax.toLocaleString('fr-CH')} CHF`)
      }
    }

    // ── Invoices ─────────────────────────────────────────────────────────────
    const invoiceCount = randomInt(config.invoicesPerMonth.min, config.invoicesPerMonth.max)
    const dates = spreadDates(year, month, invoiceCount)

    const slots = [
      // Fixed retainer invoices first (1st of month)
      ...retainerClients.map(c => ({
        client: c,
        date: `${year}-${monthPad(month)}-01`,
        isRetainer: true,
      })),
      // Ad-hoc invoices
      ...Array.from({ length: Math.max(0, invoiceCount - retainerClients.length) }, (_, i) => ({
        client: randomFrom(fallbackPool),
        date: dates[i] ?? dates[0],
        isRetainer: false,
      })),
    ]

    for (const slot of slots) {
      counters[year]++
      const invoiceNum = invoiceNumber(year, counters[year])
      const paymentTerms = slot.client.payment_terms ?? fullSettings.payment_terms ?? 30
      const dueDate = addDays(slot.date, paymentTerms)
      const status = resolveStatus(slot.date, paymentTerms)
      const currency = slot.client.currency ?? fullSettings.currency ?? 'CHF'

      // ── Build lines ─────────────────────────────────────────────────────
      let lines
      if (slot.isRetainer) {
        lines = [
          {
            description: slot.client.retainer.description,
            quantity: 1,
            unit_price: slot.client.retainer.amount,
            sort_order: 0,
          },
        ]
      } else {
        const lineCount = randomInt(
          config.linesPerInvoice?.min ?? 1,
          config.linesPerInvoice?.max ?? 3,
        )
        lines = Array.from({ length: lineCount }, (_, i) => {
          const tpl = config.lineWeights
            ? weightedPick(config.lineTemplates, config.lineWeights)
            : randomFrom(config.lineTemplates)
          return {
            description:
              typeof tpl.description === 'function'
                ? tpl.description(year, month)
                : tpl.description,
            quantity: randomInt(tpl.qMin, tpl.qMax),
            unit_price: roundCHF(Math.random() * (tpl.pMax - tpl.pMin) + tpl.pMin),
            sort_order: i,
          }
        })
      }

      const tvaEnabled = fullSettings.tva_enabled ?? false
      const tvaRate = tvaEnabled ? (fullSettings.tva_rate ?? 8.1) : 0
      const totalHT = roundCHF(lines.reduce((s, l) => s + l.quantity * l.unit_price, 0))
      const totalTTC = roundCHF(totalHT * (1 + tvaRate / 100))

      const needsSnapshot = status !== 'draft'
      const invoiceData = {
        client: slot.client.id,
        invoice_number: invoiceNum,
        date: slot.date,
        due_date: dueDate,
        status,
        tva_enabled: tvaEnabled,
        tva_rate: tvaEnabled ? tvaRate : null,
        ...(needsSnapshot ? { client_snapshot: buildClientSnapshot(slot.client) } : {}),
        ...(needsSnapshot ? { company_snapshot: companySnap } : {}),
        // converted_amount: CHF equivalent for foreign-currency invoices
        ...(currency !== (fullSettings.currency ?? 'CHF')
          ? { converted_amount: toCHF(totalHT, currency) }
          : {}),
      }

      const invoice = await pb.collection('invoices').create(invoiceData, { requestKey: null })
      stats.invoices++

      for (const line of lines) {
        await pb
          .collection('invoice_lines')
          .create({ invoice: invoice.id, ...line }, { requestKey: null })
        stats.lines++
      }

      // ── Ledger entry for paid invoices ──────────────────────────────────
      if (status === 'paid') {
        track(revenue, year, totalHT)

        // For December invoices, payment naturally lands in January (transitoire)
        const paymentDate = addDays(slot.date, paymentTerms + randomInt(-3, 7))
        const paymentYear = new Date(paymentDate + 'T12:00:00Z').getFullYear()
        const isTransitoire = config.transitoires && month === 12 && paymentYear > year

        await pb.collection('ledger').create(
          {
            date: paymentDate,
            description: `Paiement ${invoiceNum} — ${slot.client.name}`,
            category_id: categoryIdByName.get('Revenu') ?? null,
            amount: totalTTC,
            is_checked: daysAgo(paymentDate) > 60,
            invoice: invoice.id,
            ...(isTransitoire ? { fiscal_year: year } : {}),
          },
          { requestKey: null },
        )
        stats.ledger++
      }
    }

    // ── Recurring charges ─────────────────────────────────────────────────────
    for (const charge of config.charges ?? []) {
      if (!shouldEmitCharge(charge, month)) continue

      const count = charge.count ? randomInt(charge.count.min, charge.count.max) : 1

      for (let ci = 0; ci < count; ci++) {
        const amount = -randomInt(charge.amountMin, charge.amountMax)
        const baseDay = charge.dayOfMonth ?? randomInt(3 + ci * 8, 10 + ci * 8)
        const day = Math.min(baseDay, 28)
        const date = `${year}-${monthPad(month)}-${dayPad(day)}`
        const desc =
          typeof charge.description === 'function'
            ? charge.description(year, month)
            : charge.description

        await pb.collection('ledger').create(
          {
            date,
            description: desc,
            category_id: categoryIdByName.get(charge.category) ?? null,
            amount,
            is_checked: daysAgo(date) > 60,
            ...(charge.profitCenterOverride
              ? { profit_center_id: profitCenterIdByName.get(charge.profitCenterOverride) ?? null }
              : {}),
          },
          { requestKey: null },
        )

        track(expenses, year, Math.abs(amount))
        stats.ledger++
      }
    }
  }

  return stats
}
