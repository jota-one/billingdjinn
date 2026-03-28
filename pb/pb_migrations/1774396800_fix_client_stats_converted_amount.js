/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const clientStats = app.findCollectionByNameOrId("pbc_8881234580")
  clientStats.viewQuery = "SELECT c.id, c.name, COALESCE(SUM(CASE WHEN it.status = 'paid' AND SUBSTR(it.date, 1, 4) = strftime('%Y', 'now') THEN COALESCE(NULLIF(it.converted_amount, 0), it.total_ht) ELSE 0 END), 0) AS ca_annuel, COALESCE(SUM(CASE WHEN it.status = 'paid' THEN COALESCE(NULLIF(it.converted_amount, 0), it.total_ht) ELSE 0 END), 0) AS ca_cumule, MAX(CASE WHEN it.status != 'draft' THEN it.date ELSE NULL END) AS last_invoice_date FROM clients c LEFT JOIN invoice_totals it ON it.client = c.id GROUP BY c.id"
  return app.save(clientStats)
}, (app) => {
  const clientStats = app.findCollectionByNameOrId("pbc_8881234580")
  clientStats.viewQuery = "SELECT c.id, c.name, COALESCE(SUM(CASE WHEN it.status = 'paid' AND SUBSTR(it.date, 1, 4) = strftime('%Y', 'now') THEN COALESCE(it.converted_amount, it.total_ht) ELSE 0 END), 0) AS ca_annuel, COALESCE(SUM(CASE WHEN it.status = 'paid' THEN COALESCE(it.converted_amount, it.total_ht) ELSE 0 END), 0) AS ca_cumule, MAX(CASE WHEN it.status != 'draft' THEN it.date ELSE NULL END) AS last_invoice_date FROM clients c LEFT JOIN invoice_totals it ON it.client = c.id GROUP BY c.id"
  return app.save(clientStats)
})
