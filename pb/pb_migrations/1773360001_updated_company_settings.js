/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1881234580")

  // add field
  collection.fields.addAt(99, new Field({
    "hidden": false,
    "id": "number4291234513",
    "max": null,
    "min": null,
    "name": "payment_terms",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1881234580")

  collection.fields.removeById("number4291234513")

  return app.save(collection)
})
