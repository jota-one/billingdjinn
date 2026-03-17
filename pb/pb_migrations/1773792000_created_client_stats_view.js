/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "id": "pbc_8881234580",
    "name": "client_stats",
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
        "id": "text8881234500",
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
        "id": "text8881234501",
        "max": 0,
        "min": 0,
        "name": "name",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "number8881234502",
        "max": null,
        "min": null,
        "name": "ca_annuel",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number8881234503",
        "max": null,
        "min": null,
        "name": "ca_cumule",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text8881234504",
        "max": 0,
        "min": 0,
        "name": "last_invoice_date",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      }
    ],
    "viewQuery": "SELECT c.id, c.name, COALESCE(SUM(CASE WHEN it.status = 'paid' AND SUBSTR(it.date, 1, 4) = strftime('%Y', 'now') THEN it.total_ht ELSE 0 END), 0) AS ca_annuel, COALESCE(SUM(CASE WHEN it.status = 'paid' THEN it.total_ht ELSE 0 END), 0) AS ca_cumule, MAX(CASE WHEN it.status != 'draft' THEN it.date ELSE NULL END) AS last_invoice_date FROM clients c LEFT JOIN invoice_totals it ON it.client = c.id GROUP BY c.id"
  })

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_8881234580")
  return app.delete(collection)
})
