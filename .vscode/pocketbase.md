# PocketBase Documentation Reference

This file serves as a quick reference guide for PocketBase-related knowledge and documentation links.

## Key Documentation Links

- [PocketBase Official Documentation](https://pocketbase.io/docs)
- [Collections Guide](https://pocketbase.io/docs/collections)
- [API Rules and Filters](https://pocketbase.io/docs/api-rules-and-filters)
- [Authentication](https://pocketbase.io/docs/authentication)
- [Files Upload and Handling](https://pocketbase.io/docs/files-handling)

## Working with Relations

**Documentation**: https://pocketbase.io/docs/working-with-relations/

### Key Concepts

1. **Standard Relations (Forward Relations)**
   - Relations are defined as fields in a collection that point to records in another collection
   - Can be single relation or multiple relations
   - Expand forward relations using: `expand: 'relationFieldName'`
   - Example: `expand.ConfigurationRight.*` to get all fields of the related record

2. **Back-Relations (Inverse Relations)**
   - Access records that have a relation pointing TO your current record
   - Notation: `collectionName_via_fieldName`
   - Example: `person_via_Sign` to access persons that have a Sign field pointing to this sign
   - Always returned as an array, even for single relations (unless the field has a UNIQUE constraint)
   - Useful for one-to-one relationships defined on the "many" side

### Common Patterns

```javascript
// Expanding a forward relation
const record = await pb.collection('sign').getFirstListItem(filter, {
  expand: 'Category,ConfigurationRight,ConfigurationLeft',
})

// Expanding a back-relation
const record = await pb.collection('sign').getFirstListItem(filter, {
  expand: 'Category,person_via_Sign',
})

// Accessing expanded data
const person = record.expand?.person_via_Sign?.[0] || null
```

### Back-Relation Caveats

- By default, back-relation reference is resolved as a dynamic multiple relation field, even when the original field is single
- Back-relation expand is limited to max 1000 records per relation field
- Use separate paginated requests for larger result sets

## Web APIs Reference

- [PocketBase Web API Records Reference](https://pocketbase.io/docs/api-records)

## Go Extension (if needed)

- [Extending PocketBase with Go](https://pocketbase.io/docs/use-as-framework)
- [Go Record Operations](https://pocketbase.io/docs/go-records)
- [Go Collections](https://pocketbase.io/docs/go-collections)
- [Go Event Hooks](https://pocketbase.io/docs/go-event-hooks)

## Project-Specific Notes

### API Base URL Configuration

- Configured in: `src/config/index.ts`
- Exposes `apiBaseUrl` from `import.meta.env.PUBLIC_PB_BASE_URI`
- Example value for local dev: `http://localhost:8090`

### File URLs Pattern

Public file URLs follow this pattern:

```
${config.apiBaseUrl}/api/files/<collection>/<id>/<filename>
```

Example:

```javascript
const fileUrl = `${config.apiBaseUrl}/api/files/hand_configurations/${id}/${filename}`
```

### Local PocketBase Server

- Run with: `pnpm db` (runs `./pb/pocketbase serve`)
- Data stored in: `pb/pb_data/`
- Migrations in: `pb/pb_migrations/`
- Public build output: `pb/pb_public/`

## Common Questions

**Q: How do I fetch related records?**
A: Use the `expand` parameter with the relation field name or back-relation notation.

**Q: How do I handle one-to-one relationships where the foreign key is on the "many" side?**
A: Use back-relations with the `collection_via_fieldName` notation.

**Q: Why is my back-relation returned as an array?**
A: PocketBase treats back-relations as arrays by default unless there's a UNIQUE constraint on the relation field.
