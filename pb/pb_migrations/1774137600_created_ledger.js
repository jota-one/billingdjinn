/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "id": "pbc_5691234580",
    "name": "ledger",
    "type": "base",
    "system": false,
    "fields": [
      {
        "hidden": false,
        "id": "date5691234500",
        "name": "date",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "text5691234501",
        "max": 0,
        "min": 0,
        "name": "description",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
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
      },
      {
        "hidden": false,
        "id": "number5691234503",
        "max": null,
        "min": null,
        "name": "amount",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "bool5691234504",
        "name": "is_checked",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_4591234580",
        "hidden": false,
        "id": "relation5691234505",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "invoice",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "autodate5691234506",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate5691234507",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "indexes": [],
    "listRule": "@request.auth.roles.slug ?= 'admin'",
    "viewRule": "@request.auth.roles.slug ?= 'admin'",
    "createRule": "@request.auth.roles.slug ?= 'admin'",
    "updateRule": "@request.auth.roles.slug ?= 'admin'",
    "deleteRule": "@request.auth.roles.slug ?= 'admin'"
  })
  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_5691234580")
  return app.delete(collection)
})
