/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Add currency to company_settings
  const settings = app.findCollectionByNameOrId("pbc_1881234580")
  settings.fields.addAt(99, new Field({
    "hidden": false,
    "id": "text1881234582",
    "max": 3,
    "min": 3,
    "name": "currency",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))
  app.save(settings)

  // Add currency to clients
  const clients = app.findCollectionByNameOrId("pbc_3491234580")
  clients.fields.addAt(99, new Field({
    "hidden": false,
    "id": "text3491234590",
    "max": 3,
    "min": 3,
    "name": "currency",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))
  return app.save(clients)
}, (app) => {
  const settings = app.findCollectionByNameOrId("pbc_1881234580")
  settings.fields.removeById("text1881234582")
  app.save(settings)

  const clients = app.findCollectionByNameOrId("pbc_3491234580")
  clients.fields.removeById("text3491234590")
  return app.save(clients)
})
