/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
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

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_6661234580")
  return app.delete(collection)
})
