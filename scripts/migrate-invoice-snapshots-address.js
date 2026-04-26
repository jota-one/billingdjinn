/**
 * One-shot script: migration des snapshots de factures.
 *
 * Convertit l'ancien champ `address` (chaîne combinée) des snapshots
 * client/company en champs structurés `street` / `zip` / `city` / `country`,
 * pour aligner avec le format issu des migrations 1777161600 et 1777161601.
 *
 * Mode dry-run par défaut (aucune écriture).
 * Utiliser --commit pour appliquer les changements.
 *
 * Usage:
 *   PB_URL=https://... PB_ADMIN_EMAIL=... PB_ADMIN_PASSWORD=... node scripts/migrate-invoice-snapshots-address.js
 *   PB_URL=https://... PB_ADMIN_EMAIL=... PB_ADMIN_PASSWORD=... node scripts/migrate-invoice-snapshots-address.js --commit
 */

import PocketBase from 'pocketbase'

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090'
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD
const isCommit = process.argv.includes('--commit')
const isDryRun = !isCommit

function parseAddress(raw) {
  if (!raw || typeof raw !== 'string') return null
  const lines = raw
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
  if (lines.length === 0) return null
  const lastLine = lines[lines.length - 1]
  const m = lastLine.match(/^(\d{4,5})\s+(.+)$/)
  if (m) {
    return { street: lines.slice(0, -1).join(', ') || '', zip: m[1], city: m[2], country: 'CH' }
  }
  return { street: lines.join(', '), zip: '', city: '', country: 'CH' }
}

/** Returns a patched copy of the snapshot, or null if nothing changed. */
function migrateSnapshot(snap, label) {
  if (!snap || typeof snap !== 'object') return null

  const patched = { ...snap }
  let changed = false

  if (patched.address && !patched.street) {
    const parsed = parseAddress(patched.address)
    if (parsed) {
      console.log(`    ${label}.address: "${patched.address}"`)
      console.log(`      → street="${parsed.street}", zip="${parsed.zip}", city="${parsed.city}"`)
      patched.street = parsed.street
      patched.zip = parsed.zip
      patched.city = parsed.city
      if (!patched.country) patched.country = parsed.country
      delete patched.address
      changed = true
    }
  }

  if (!patched.country) {
    patched.country = 'CH'
    changed = true
  }

  return changed ? patched : null
}

async function main() {
  console.log('=== Migration des snapshots de factures (address → structured) ===')
  console.log(`Mode: ${isDryRun ? 'DRY-RUN (aucune écriture)' : 'COMMIT (écritures activées)'}`)

  if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
    console.error('Variables manquantes: PB_ADMIN_EMAIL et/ou PB_ADMIN_PASSWORD')
    process.exit(1)
  }

  const pb = new PocketBase(PB_URL)

  try {
    console.log(`\nConnexion à ${PB_URL}...`)
    await pb.collection('_superusers').authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD)
    console.log('Authentifié.\n')

    const invoices = await pb.collection('invoices').getFullList({ sort: '-date' })
    console.log(`Factures trouvées: ${invoices.length}\n`)

    let updated = 0,
      skipped = 0,
      errors = 0

    for (const invoice of invoices) {
      const num = invoice.invoice_number || invoice.id
      const patches = {}

      const newClient = migrateSnapshot(invoice.client_snapshot, 'client_snapshot')
      if (newClient) patches.client_snapshot = newClient

      const newCompany = migrateSnapshot(invoice.company_snapshot, 'company_snapshot')
      if (newCompany) patches.company_snapshot = newCompany

      if (Object.keys(patches).length === 0) {
        skipped++
        continue
      }

      console.log(`  ${isDryRun ? '[DRY-RUN]' : '[OK]'} Facture ${num}`)

      if (!isDryRun) {
        try {
          await pb.collection('invoices').update(invoice.id, patches)
          updated++
        } catch (e) {
          console.error(`  [ERR] ${num}: ${e.message}`)
          errors++
        }
      } else {
        updated++
      }
    }

    console.log(
      `\nRésultat: ${updated} à mettre à jour, ${skipped} sans changement, ${errors} erreurs`,
    )

    if (isDryRun) {
      console.log('\nDry-run terminé. Relancer avec --commit pour appliquer.')
    } else {
      console.log('\n✅ Migration terminée.')
    }

    if (!isDryRun && errors > 0) process.exit(1)
  } catch (e) {
    console.error(`\nErreur fatale: ${e.message}`)
    process.exit(1)
  }
}

void main()
