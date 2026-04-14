/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2221234580")
  collection.fields.addAt(100, new Field({
    "hidden": false,
    "id": "json2221234502",
    "maxSize": 0,
    "name": "allocation_keys",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))
  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2221234580")
  collection.fields.removeById("json2221234502")
  return app.save(collection)
})
