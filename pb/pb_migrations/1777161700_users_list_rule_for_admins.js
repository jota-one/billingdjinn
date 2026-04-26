/// <reference path="../pb_data/types.d.ts" />

// Autorise les utilisateurs avec le rôle 'admin' à lister tous les utilisateurs.
// PocketBase évalue @request.auth.roles.slug ?= "admin" comme :
// "au moins un des rôles de l'utilisateur authentifié a un slug = admin".

migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")
  collection.listRule = '@request.auth.roles.slug ?= "admin"'
  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")
  collection.listRule = null
  return app.save(collection)
})
