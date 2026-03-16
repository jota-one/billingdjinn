/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.roles.slug ?= 'admin'",
    "deleteRule": "@request.auth.roles.slug ?= 'admin'",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text4591234500",
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
        "cascadeDelete": false,
        "collectionId": "pbc_3491234580",
        "hidden": false,
        "id": "relation4591234501",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "client",
        "presentable": true,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text4591234502",
        "max": 0,
        "min": 0,
        "name": "invoice_number",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "date4591234503",
        "max": "",
        "min": "",
        "name": "date",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "date4591234504",
        "max": "",
        "min": "",
        "name": "due_date",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "select4591234505",
        "maxSelect": 1,
        "name": "status",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": ["draft", "sent", "paid"]
      },
      {
        "hidden": false,
        "id": "bool4591234506",
        "name": "tva_enabled",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "number4591234507",
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
        "id": "text4591234508",
        "max": 0,
        "min": 0,
        "name": "notes",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "autodate4591234509",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate4591234510",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_4591234580",
    "indexes": ["CREATE UNIQUE INDEX idx_invoice_number ON invoices (invoice_number)"],
    "listRule": "@request.auth.roles.slug ?= 'admin'",
    "name": "invoices",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.roles.slug ?= 'admin'",
    "viewRule": "@request.auth.roles.slug ?= 'admin'"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4591234580");
  return app.delete(collection);
})
