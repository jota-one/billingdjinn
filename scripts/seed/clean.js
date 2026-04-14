/**
 * Deletes all business data (ledger, invoices, clients).
 * Does NOT touch users or roles.
 */
export async function clean(pb) {
  const collections = ['ledger', 'invoice_lines', 'invoices', 'clients']

  for (const col of collections) {
    const records = await pb.collection(col).getFullList({ fields: 'id', requestKey: null })
    if (records.length === 0) {
      console.log(`  [clean] ${col}: vide`)
      continue
    }
    // Batches of 20 parallel deletes
    for (let i = 0; i < records.length; i += 20) {
      await Promise.all(records.slice(i, i + 20).map(r => pb.collection(col).delete(r.id)))
    }
    console.log(`  [clean] ${col}: ${records.length} supprimés`)
  }
}
