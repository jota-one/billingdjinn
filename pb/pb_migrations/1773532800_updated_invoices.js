/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4591234580")

  collection.fields.addAt(99, new Field({
    "hidden": false,
    "id": "json4591234511",
    "maxSize": 0,
    "name": "client_snapshot",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  collection.fields.addAt(99, new Field({
    "hidden": false,
    "id": "json4591234512",
    "maxSize": 0,
    "name": "company_snapshot",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4591234580")

  collection.fields.removeById("json4591234511")
  collection.fields.removeById("json4591234512")

  return app.save(collection)
})
