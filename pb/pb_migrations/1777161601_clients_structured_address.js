/// <reference path="../pb_data/types.d.ts" />

function parseAddress(raw) {
  if (!raw || typeof raw !== 'string') return null
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return null
  const lastLine = lines[lines.length - 1]
  const m = lastLine.match(/^(\d{4,5})\s+(.+)$/)
  if (m) {
    return { street: lines.slice(0, -1).join(', ') || '', zip: m[1], city: m[2], country: 'CH' }
  }
  return { street: lines.join(', '), zip: '', city: '', country: 'CH' }
}

migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3491234580")

  // 1. Ajouter les nouveaux champs
  collection.fields.addAt(3, new Field({
    "autogeneratePattern": "", "hidden": false, "id": "text3491234591",
    "max": 0, "min": 0, "name": "street", "pattern": "", "presentable": false,
    "primaryKey": false, "required": false, "system": false, "type": "text"
  }))
  collection.fields.addAt(4, new Field({
    "autogeneratePattern": "", "hidden": false, "id": "text3491234592",
    "max": 0, "min": 0, "name": "zip", "pattern": "", "presentable": false,
    "primaryKey": false, "required": false, "system": false, "type": "text"
  }))
  collection.fields.addAt(5, new Field({
    "autogeneratePattern": "", "hidden": false, "id": "text3491234593",
    "max": 0, "min": 0, "name": "city", "pattern": "", "presentable": false,
    "primaryKey": false, "required": false, "system": false, "type": "text"
  }))
  collection.fields.addAt(6, new Field({
    "autogeneratePattern": "", "hidden": false, "id": "text3491234594",
    "max": 0, "min": 0, "name": "country", "pattern": "", "presentable": false,
    "primaryKey": false, "required": false, "system": false, "type": "text"
  }))
  app.save(collection)

  // 2. Migrer les données depuis address → nouveaux champs
  try {
    const records = app.findAllRecords("clients")
    for (const record of records) {
      const parsed = parseAddress(record.getString("address"))
      if (parsed) {
        record.set("street", parsed.street)
        record.set("zip", parsed.zip)
        record.set("city", parsed.city)
        record.set("country", parsed.country)
        app.save(record)
      }
    }
  } catch (e) {
    // Non-fatal : adresse à saisir manuellement dans la fiche client si le parsing échoue
  }

  // 3. Supprimer l'ancien champ
  collection.fields.removeById("text3491234502")
  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3491234580")
  collection.fields.removeById("text3491234591")
  collection.fields.removeById("text3491234592")
  collection.fields.removeById("text3491234593")
  collection.fields.removeById("text3491234594")
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "", "hidden": false, "id": "text3491234502",
    "max": 0, "min": 0, "name": "address", "pattern": "", "presentable": false,
    "primaryKey": false, "required": false, "system": false, "type": "text"
  }))
  return app.save(collection)
})
