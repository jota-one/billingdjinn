/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // ── 1. Supprimer la vue ledger_stats (référence à category) ──────────────
  const oldView = app.findCollectionByNameOrId("pbc_6661234580")
  app.delete(oldView)

  // ── 2. Supprimer le champ `category` (text) de ledger ────────────────────
  const ledger = app.findCollectionByNameOrId("pbc_5691234580")
  ledger.fields.removeById("text5691234502")
  app.save(ledger)

  const newView = new Collection({
    "id": "pbc_6661234580",
    "name": "ledger_stats",
    "type": "view",
    "system": false,
    "listRule": "@request.auth.roles.slug ?= 'admin'",
    "viewRule": "@request.auth.roles.slug ?= 'admin'",
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text6661234500",
        "max": 0,
        "min": 0,
        "name": "id",
        "pattern": "",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text6661234501",
        "max": 0,
        "min": 0,
        "name": "category",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "number6661234502",
        "max": null,
        "min": null,
        "name": "year",
        "onlyInt": true,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number6661234503",
        "max": null,
        "min": null,
        "name": "total_credit",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number6661234504",
        "max": null,
        "min": null,
        "name": "total_debit",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      }
    ],
    "viewQuery": "SELECT id, category, year, total_credit, total_debit FROM (SELECT COALESCE(NULLIF(l.fiscal_year, 0), CAST(strftime('%Y', l.date) AS INTEGER)) || '_' || COALESCE(c.name, '') AS id, COALESCE(c.name, '') AS category, CAST(COALESCE(NULLIF(l.fiscal_year, 0), CAST(strftime('%Y', l.date) AS INTEGER)) AS INTEGER) AS year, ROUND(SUM(CASE WHEN l.amount > 0 THEN l.amount ELSE 0 END), 2) AS total_credit, ROUND(SUM(CASE WHEN l.amount < 0 THEN ABS(l.amount) ELSE 0 END), 2) AS total_debit FROM ledger l LEFT JOIN categories c ON l.category_id = c.id GROUP BY COALESCE(NULLIF(l.fiscal_year, 0), CAST(strftime('%Y', l.date) AS INTEGER)), COALESCE(c.name, ''))"
  })
  return app.save(newView)
}, (app) => {
  // ── Restaurer la vue ledger_stats avec l'ancien SQL (text category) ───────
  const newView = app.findCollectionByNameOrId("pbc_6661234580")
  app.delete(newView)

  const oldView = new Collection({
    "id": "pbc_6661234580",
    "name": "ledger_stats",
    "type": "view",
    "system": false,
    "listRule": "@request.auth.roles.slug ?= 'admin'",
    "viewRule": "@request.auth.roles.slug ?= 'admin'",
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text6661234500",
        "max": 0,
        "min": 0,
        "name": "id",
        "pattern": "",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text6661234501",
        "max": 0,
        "min": 0,
        "name": "category",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "number6661234502",
        "max": null,
        "min": null,
        "name": "year",
        "onlyInt": true,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number6661234503",
        "max": null,
        "min": null,
        "name": "total_credit",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number6661234504",
        "max": null,
        "min": null,
        "name": "total_debit",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      }
    ],
    "viewQuery": "SELECT id, category, year, total_credit, total_debit FROM (SELECT COALESCE(NULLIF(fiscal_year, 0), CAST(strftime('%Y', date) AS INTEGER)) || '_' || COALESCE(category, '') AS id, COALESCE(category, '') AS category, CAST(COALESCE(NULLIF(fiscal_year, 0), CAST(strftime('%Y', date) AS INTEGER)) AS INTEGER) AS year, ROUND(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 2) AS total_credit, ROUND(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 2) AS total_debit FROM ledger GROUP BY COALESCE(NULLIF(fiscal_year, 0), CAST(strftime('%Y', date) AS INTEGER)), COALESCE(category, ''))"
  })

  // ── Restaurer le champ `category` (text) sur ledger ──────────────────────
  const ledger = app.findCollectionByNameOrId("pbc_5691234580")
  ledger.fields.addAt(2, new Field({
    "hidden": false,
    "id": "text5691234502",
    "max": 0,
    "min": 0,
    "name": "category",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))
  app.save(ledger)

  return app.save(oldView)
})
