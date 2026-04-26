/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4591234580")

  collection.fields.addAt(100, new Field({
    "hidden": false,
    "id": "date4591234520",
    "max": "",
    "min": "",
    "name": "emailed_at",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4591234580")
  collection.fields.removeById("date4591234520")
  return app.save(collection)
})
