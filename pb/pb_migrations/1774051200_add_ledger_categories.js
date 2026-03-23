/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const companySettings = app.findCollectionByNameOrId("pbc_1881234580")
  companySettings.fields.addAt(100, new Field({
    "hidden": false,
    "id": "json1881234592",
    "maxSize": 0,
    "name": "ledger_categories",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))
  return app.save(companySettings)
}, (app) => {
  const companySettings = app.findCollectionByNameOrId("pbc_1881234580")
  companySettings.fields.removeById("json1881234592")
  return app.save(companySettings)
})
