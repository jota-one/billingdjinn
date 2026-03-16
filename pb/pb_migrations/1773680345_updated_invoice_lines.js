/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4591234581")

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "number4591234604",
    "max": null,
    "min": 0,
    "name": "unit_price",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4591234581")

  // update field
  collection.fields.addAt(4, new Field({
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
  }))

  return app.save(collection)
})
