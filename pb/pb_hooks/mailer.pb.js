// ─── Manual send route ──────────────────────────────────────────────────────

routerAdd(
  'POST',
  '/api/send-invoice/{id}',
  e => {
    const auth = e.requestInfo().auth

    // Verify admin role
    const roleIds = auth.getStringSlice('roles')
    let isAdmin = false
    for (const roleId of roleIds) {
      try {
        const role = e.app.findRecordById('roles', roleId)
        if (role.getString('slug') === 'admin') {
          isAdmin = true
          break
        }
      } catch (_) {}
    }

    if (!isAdmin) {
      return e.json(403, { message: 'Réservé aux administrateurs' })
    }

    const invoiceId = e.request.pathValue('id')

    try {
      sendInvoiceByEmail(e.app, invoiceId)
      return e.json(200, { ok: true })
    } catch (err) {
      return e.json(500, { message: String(err) })
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    function resolveLabels(companyLabels, clientLabels) {
      const DEFAULT_LABELS = {
        invoice_title: 'Facture',
        draft: 'BROUILLON',
        date: 'Date',
        due_date: 'Échéance',
        iban: 'IBAN',
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
      function clean(labels) {
        if (!labels || typeof labels !== 'object') return {}
        return Object.fromEntries(
          Object.entries(labels).filter(([, v]) => v !== '' && v !== null && v !== undefined),
        )
      }
      return Object.assign({}, DEFAULT_LABELS, clean(companyLabels), clean(clientLabels))
    }

    function base64ToBytes(b64) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
      const lookup = {}
      for (let i = 0; i < chars.length; i++) lookup[chars[i]] = i
      const s = b64.replace(/[^A-Za-z0-9+/]/g, '')
      const bytes = []
      for (let i = 0; i < s.length; i += 4) {
        const a = lookup[s[i]] || 0, b = lookup[s[i+1]] || 0
        const c = lookup[s[i+2]] || 0, d = lookup[s[i+3]] || 0
        bytes.push((a << 2) | (b >> 4))
        if (s[i+2] !== '=') bytes.push(((b & 0xf) << 4) | (c >> 2))
        if (s[i+3] !== '=') bytes.push(((c & 0x3) << 6) | d)
      }
      return bytes
    }

    function sendInvoiceByEmail(app, invoiceId) {
      const invoice = app.findRecordById('invoices', invoiceId)

      // JSON fields may come back as raw string from goja — parse if needed
      function parseJson(val) {
        if (!val) return null
        if (typeof val === 'string') {
          try { return JSON.parse(val) } catch (_) { return null }
        }
        return val
      }

      const clientSnapshot = parseJson(invoice.getString('client_snapshot'))
      const companySnapshot = parseJson(invoice.getString('company_snapshot'))

      if (!clientSnapshot || !companySnapshot) {
        throw new Error(
          "La facture n'a pas de snapshots — elle doit être au statut 'envoyée' ou 'payée'",
        )
      }

      // Fallback to live client record if snapshot is missing email
      let clientEmail = clientSnapshot.email
      if (!clientEmail) {
        try {
          const liveClient = app.findRecordById('clients', invoice.getString('client'))
          clientEmail = liveClient.getString('email')
        } catch (_) {}
      }
      if (!clientEmail) {
        throw new Error("Le client n'a pas d'adresse email")
      }

      // Invoice lines
      const lines = app.findRecordsByFilter(
        'invoice_lines',
        `invoice = "${invoiceId}"`,
        'sort_order,created',
        1000,
        0,
      )
      const linesData = lines.map(l => ({
        description: l.getString('description'),
        quantity: l.getFloat('quantity'),
        unit_price: l.getFloat('unit_price'),
      }))

      // Labels from settings and client
      const settings = app.findFirstRecordByFilter('company_settings', 'id != ""')
      const client = app.findRecordById('clients', invoice.getString('client'))
      const labels = resolveLabels(settings.get('labels'), client.get('labels'))

      // Enrich snapshot with live settings for fields that may have been added after locking
      // (copy first — the parsed Go object is not directly mutable)
      const enrichedSnapshot = Object.assign({}, companySnapshot)
      if (!enrichedSnapshot.bank_account) {
        enrichedSnapshot.bank_account = settings.getString('bank_account') || ''
      }
      if (!enrichedSnapshot.invoice_template) {
        enrichedSnapshot.invoice_template = settings.getString('invoice_template') || 'default'
      }
      const template = enrichedSnapshot.invoice_template

      // Invoice data payload
      const invoiceData = {
        id: invoice.id,
        client: invoice.getString('client'),
        invoice_number: invoice.getString('invoice_number'),
        date: invoice.getString('date').substring(0, 10),
        due_date: (invoice.getString('due_date') || '').substring(0, 10),
        status: invoice.getString('status'),
        tva_enabled: invoice.getBool('tva_enabled'),
        tva_rate: invoice.getFloat('tva_rate') || undefined,
        notes: invoice.getString('notes'),
        client_snapshot: clientSnapshot,
        company_snapshot: enrichedSnapshot,
      }

      // Call Astro for PDF generation
      const astroUrl = $os.getenv('ASTRO_INTERNAL_URL') || 'http://127.0.0.1:4321'
      const pdfSecret = $os.getenv('ASTRO_PDF_SECRET') || ''

      const res = $http.send({
        method: 'POST',
        url: astroUrl + '/pdf',
        body: JSON.stringify({
          invoice: invoiceData,
          lines: linesData,
          client: clientSnapshot,
          company: enrichedSnapshot,
          companyLabels: settings.get('labels'),
          clientLabels: client.get('labels'),
          template,
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-pdf-secret': pdfSecret,
        },
        timeout: 30,
      })

      if (res.statusCode !== 200) {
        throw new Error('Échec de la génération du PDF — statut HTTP ' + res.statusCode)
      }

      const pdfBase64 = res.json.pdf
      if (!pdfBase64) {
        throw new Error('Réponse PDF vide depuis le serveur Astro')
      }

      const invoiceNumber = invoice.getString('invoice_number')
      const filename = `facture-${invoiceNumber || invoiceId}.pdf`
      const pdfFile = $filesystem.fileFromBytes(base64ToBytes(pdfBase64), filename)

      const companyName = enrichedSnapshot.name || ''
      const fromEmail = enrichedSnapshot.email || settings.getString('email') || ''

      // Test override: redirect all emails to a safe address in dev/staging
      const testEmail = $os.getenv('SEND_TO_TEST_EMAIL')
      const recipient = testEmail
        ? { address: testEmail, name: 'TEST — ' + (clientSnapshot.name || clientEmail) }
        : { address: clientEmail, name: clientSnapshot.name || '' }
      const subject = testEmail
        ? `[TEST] Facture ${invoiceNumber} — ${companyName}`
        : `Facture ${invoiceNumber} — ${companyName}`

      app.newMailClient().send({
        from: { address: fromEmail, name: companyName },
        to: [recipient],
        subject,
        html: [
          '<p>Bonjour,</p>',
          `<p>Veuillez trouver ci-joint la facture n° <strong>${invoiceNumber}</strong>.</p>`,
          '<p>Cordialement,<br>' + companyName + '</p>',
        ].join(''),
        attachments: {
          [filename]: pdfFile.reader.open(),
        },
      })

      // Record send date
      invoice.set('emailed_at', new Date().toISOString())
      app.save(invoice)
    }
  },
  $apis.requireAuth(),
)

// ─── CRON — recurring invoices (placeholder, à implémenter) ─────────────────
// cronAdd('send-recurring-invoices', '0 8 * * *', (e) => {
//   // Chercher les factures récurrentes à envoyer
//   // sendInvoiceByEmail(e.app, invoice.getId())  ← mettre les helpers inline aussi
// })
