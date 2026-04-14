/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "name": "profit_centers",
    "type": "base",
    "system": false,
    "listRule": "@request.auth.roles.slug ?= 'admin'",
    "viewRule": "@request.auth.roles.slug ?= 'admin'",
    "createRule": "@request.auth.roles.slug ?= 'admin'",
    "updateRule": "@request.auth.roles.slug ?= 'admin'",
    "deleteRule": "@request.auth.roles.slug ?= 'admin'",
    "fields": [
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text7771234500",
        "max": 0,
        "min": 0,
        "name": "name",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text7771234501",
        "max": 0,
        "min": 0,
        "name": "color",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      }
    ],
    "indexes": ["CREATE UNIQUE INDEX idx_profit_centers_name ON profit_centers (name)"]
  })
  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("profit_centers")
  return app.delete(collection)
})
