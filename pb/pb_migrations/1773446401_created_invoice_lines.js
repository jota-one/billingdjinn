/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.roles.slug ?= 'admin'",
    "deleteRule": "@request.auth.roles.slug ?= 'admin'",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text4591234600",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "cascadeDelete": true,
        "collectionId": "pbc_4591234580",
        "hidden": false,
        "id": "relation4591234601",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "invoice",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text4591234602",
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
        "id": "number4591234603",
        "max": null,
        "min": 0,
        "name": "quantity",
        "onlyInt": false,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number4591234604",
        "max": null,
        "min": 0,
        "name": "unit_price",
        "onlyInt": false,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number4591234605",
        "max": null,
        "min": null,
        "name": "sort_order",
        "onlyInt": true,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "autodate4591234606",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate4591234607",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_4591234581",
    "indexes": [],
    "listRule": "@request.auth.roles.slug ?= 'admin'",
    "name": "invoice_lines",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.roles.slug ?= 'admin'",
    "viewRule": "@request.auth.roles.slug ?= 'admin'"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4591234581");
  return app.delete(collection);
})
