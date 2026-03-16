/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1881234580")

  const record = new Record(collection)
  record.set("company_name", "Mon Entreprise")
  app.save(record)

}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1881234580")
  const records = app.findRecordsByFilter(collection.id, "id != ''")
  records.forEach(record => app.delete(record))
})
