/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_5691234580")
  collection.fields.addAt(100, new Field({
    "hidden": false,
    "id": "number5691234508",
    "max": null,
    "min": null,
    "name": "fiscal_year",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))
  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_5691234580")
  collection.fields.removeById("number5691234508")
  return app.save(collection)
})
