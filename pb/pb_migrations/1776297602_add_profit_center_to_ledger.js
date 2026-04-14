/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const profitCenters = app.findCollectionByNameOrId("profit_centers")
  const collection = app.findCollectionByNameOrId("pbc_5691234580")
  collection.fields.addAt(100, new Field({
    "cascadeDelete": false,
    "collectionId": profitCenters.id,
    "hidden": false,
    "id": "relation5691234510",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "profit_center_id",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))
  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_5691234580")
  collection.fields.removeById("relation5691234510")
  return app.save(collection)
})
