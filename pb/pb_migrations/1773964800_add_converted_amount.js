/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // 1. Add converted_amount to invoices
  const invoices = app.findCollectionByNameOrId("pbc_4591234580")
  invoices.fields.addAt(100, new Field({
    "hidden": false,
    "id": "number4591234513",
    "max": null,
    "min": null,
    "name": "converted_amount",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))
  app.save(invoices)

  // 2. Update invoice_totals view to expose converted_amount
  const invoiceTotals = app.findCollectionByNameOrId("pbc_7771234580")
  invoiceTotals.viewQuery = "SELECT i.id, i.invoice_number, i.date, i.due_date, i.status, i.client, i.tva_enabled, i.tva_rate, i.created, i.updated, i.converted_amount, (COALESCE(SUM(il.quantity * il.unit_price), 0)) AS total_ht, (CASE WHEN i.tva_enabled THEN ROUND(COALESCE(SUM(il.quantity * il.unit_price), 0) * COALESCE(i.tva_rate, 0) / 100, 2) ELSE 0 END) AS total_tva, (CASE WHEN i.tva_enabled THEN ROUND(COALESCE(SUM(il.quantity * il.unit_price), 0) * (1 + COALESCE(i.tva_rate, 0) / 100), 2) ELSE COALESCE(SUM(il.quantity * il.unit_price), 0) END) AS total_ttc FROM invoices i LEFT JOIN invoice_lines il ON il.invoice = i.id GROUP BY i.id"
  invoiceTotals.fields.addAt(100, new Field({
    "hidden": false,
    "id": "number7771234514",
    "max": null,
    "min": null,
    "name": "converted_amount",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))
  app.save(invoiceTotals)

  // 3. Update client_stats view to use COALESCE(converted_amount, total_ht)
  const clientStats = app.findCollectionByNameOrId("pbc_8881234580")
  clientStats.viewQuery = "SELECT c.id, c.name, COALESCE(SUM(CASE WHEN it.status = 'paid' AND SUBSTR(it.date, 1, 4) = strftime('%Y', 'now') THEN COALESCE(it.converted_amount, it.total_ht) ELSE 0 END), 0) AS ca_annuel, COALESCE(SUM(CASE WHEN it.status = 'paid' THEN COALESCE(it.converted_amount, it.total_ht) ELSE 0 END), 0) AS ca_cumule, MAX(CASE WHEN it.status != 'draft' THEN it.date ELSE NULL END) AS last_invoice_date FROM clients c LEFT JOIN invoice_totals it ON it.client = c.id GROUP BY c.id"
  return app.save(clientStats)
}, (app) => {
  // Revert client_stats
  const clientStats = app.findCollectionByNameOrId("pbc_8881234580")
  clientStats.viewQuery = "SELECT c.id, c.name, COALESCE(SUM(CASE WHEN it.status = 'paid' AND SUBSTR(it.date, 1, 4) = strftime('%Y', 'now') THEN it.total_ht ELSE 0 END), 0) AS ca_annuel, COALESCE(SUM(CASE WHEN it.status = 'paid' THEN it.total_ht ELSE 0 END), 0) AS ca_cumule, MAX(CASE WHEN it.status != 'draft' THEN it.date ELSE NULL END) AS last_invoice_date FROM clients c LEFT JOIN invoice_totals it ON it.client = c.id GROUP BY c.id"
  app.save(clientStats)

  // Revert invoice_totals
  const invoiceTotals = app.findCollectionByNameOrId("pbc_7771234580")
  invoiceTotals.viewQuery = "SELECT i.id, i.invoice_number, i.date, i.due_date, i.status, i.client, i.tva_enabled, i.tva_rate, i.created, i.updated, (COALESCE(SUM(il.quantity * il.unit_price), 0)) AS total_ht, (CASE WHEN i.tva_enabled THEN ROUND(COALESCE(SUM(il.quantity * il.unit_price), 0) * COALESCE(i.tva_rate, 0) / 100, 2) ELSE 0 END) AS total_tva, (CASE WHEN i.tva_enabled THEN ROUND(COALESCE(SUM(il.quantity * il.unit_price), 0) * (1 + COALESCE(i.tva_rate, 0) / 100), 2) ELSE COALESCE(SUM(il.quantity * il.unit_price), 0) END) AS total_ttc FROM invoices i LEFT JOIN invoice_lines il ON il.invoice = i.id GROUP BY i.id"
  invoiceTotals.fields.removeById("number7771234514")
  app.save(invoiceTotals)

  // Revert invoices
  const invoices = app.findCollectionByNameOrId("pbc_4591234580")
  invoices.fields.removeById("number4591234513")
  return app.save(invoices)
})
