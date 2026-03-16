/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "id": "pbc_7771234580",
    "name": "invoice_totals",
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
        "id": "text7771234500",
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
        "id": "text7771234501",
        "max": 0,
        "min": 0,
        "name": "invoice_number",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "date7771234503",
        "max": "",
        "min": "",
        "name": "date",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "date7771234504",
        "max": "",
        "min": "",
        "name": "due_date",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text7771234505",
        "max": 0,
        "min": 0,
        "name": "status",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_3491234580",
        "hidden": false,
        "id": "relation7771234506",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "client",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "bool7771234507",
        "name": "tva_enabled",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "number7771234508",
        "max": null,
        "min": null,
        "name": "tva_rate",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text7771234509",
        "max": 0,
        "min": 0,
        "name": "created",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text7771234510",
        "max": 0,
        "min": 0,
        "name": "updated",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "number7771234511",
        "max": null,
        "min": null,
        "name": "total_ht",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number7771234512",
        "max": null,
        "min": null,
        "name": "total_tva",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number7771234513",
        "max": null,
        "min": null,
        "name": "total_ttc",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      }
    ],
    "viewQuery": "SELECT i.id, i.invoice_number, i.date, i.due_date, i.status, i.client, i.tva_enabled, i.tva_rate, i.created, i.updated, (COALESCE(SUM(il.quantity * il.unit_price), 0)) AS total_ht, (CASE WHEN i.tva_enabled THEN ROUND(COALESCE(SUM(il.quantity * il.unit_price), 0) * COALESCE(i.tva_rate, 0) / 100, 2) ELSE 0 END) AS total_tva, (CASE WHEN i.tva_enabled THEN ROUND(COALESCE(SUM(il.quantity * il.unit_price), 0) * (1 + COALESCE(i.tva_rate, 0) / 100), 2) ELSE COALESCE(SUM(il.quantity * il.unit_price), 0) END) AS total_ttc FROM invoices i LEFT JOIN invoice_lines il ON il.invoice = i.id GROUP BY i.id"
  })

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_7771234580")
  return app.delete(collection)
})
