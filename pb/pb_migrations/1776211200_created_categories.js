/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "id": "pbc_2221234580",
    "name": "categories",
    "type": "base",
    "system": false,
    "fields": [
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text2221234500",
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
        "hidden": false,
        "id": "json2221234501",
        "maxSize": 0,
        "name": "patterns",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX idx_categories_name ON categories (name)"
    ],
    "listRule": "@request.auth.roles.slug ?= 'admin'",
    "viewRule": "@request.auth.roles.slug ?= 'admin'",
    "createRule": "@request.auth.roles.slug ?= 'admin'",
    "updateRule": "@request.auth.roles.slug ?= 'admin'",
    "deleteRule": "@request.auth.roles.slug ?= 'admin'"
  })
  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2221234580")
  return app.delete(collection)
})
