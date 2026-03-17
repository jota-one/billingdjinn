/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const companySettings = app.findCollectionByNameOrId("pbc_1881234580")
  companySettings.fields.addAt(100, new Field({
    "hidden": false,
    "id": "json1881234590",
    "maxSize": 0,
    "name": "labels",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))
  app.save(companySettings)

  const clients = app.findCollectionByNameOrId("pbc_3491234580")
  clients.fields.addAt(100, new Field({
    "hidden": false,
    "id": "json3491234590",
    "maxSize": 0,
    "name": "labels",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))
  return app.save(clients)
}, (app) => {
  const companySettings = app.findCollectionByNameOrId("pbc_1881234580")
  companySettings.fields.removeById("json1881234590")
  app.save(companySettings)

  const clients = app.findCollectionByNameOrId("pbc_3491234580")
  clients.fields.removeById("json3491234590")
  return app.save(clients)
})
