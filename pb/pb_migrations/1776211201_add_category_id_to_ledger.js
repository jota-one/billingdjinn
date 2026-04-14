/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_5691234580")
  collection.fields.addAt(100, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2221234580",
    "hidden": false,
    "id": "relation5691234509",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "category_id",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))
  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_5691234580")
  collection.fields.removeById("relation5691234509")
  return app.save(collection)
})
