/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1881234580")

  // add field
  collection.fields.addAt(99, new Field({
    "hidden": false,
    "id": "bool4291234511",
    "name": "tva_enabled",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(99, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text4291234512",
    "max": 0,
    "min": 0,
    "name": "tva_number",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1881234580")

  collection.fields.removeById("bool4291234511")
  collection.fields.removeById("text4291234512")

  return app.save(collection)
})
