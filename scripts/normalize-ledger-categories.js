/**
 * One-shot script: normalise les catégories du Grand Livre.
 *
 * Mode dry-run par défaut (aucune écriture).
 * Utiliser --commit pour appliquer les changements.
 *
 * Usage:
 *   PB_URL=https://... PB_ADMIN_EMAIL=... PB_ADMIN_PASSWORD=... node scripts/normalize-ledger-categories.js
 *   PB_URL=https://... PB_ADMIN_EMAIL=... PB_ADMIN_PASSWORD=... node scripts/normalize-ledger-categories.js --commit
 */

import PocketBase from 'pocketbase'

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090'
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD
const isCommit = process.argv.includes('--commit')
const isDryRun = !isCommit

const CATEGORY_MAP = {
  salaires: 'Salaire',
  revenus: 'Revenu',
  taxes: 'Taxe',
  impôts: 'Impôt',
  Impôts: 'Impôt',
  frais: 'Frais',
  compensation: 'Frais',
  trajets: 'Frais',
  assurances: 'Assurance',
  mastercard: 'Mastercard',
  Service: 'Fiduciaire',
  fonds: 'Fonds propres',
  unique: 'Constitution',
  erreur: 'Erreur',
}

const CLEAN_CATEGORIES = [
  'AVS',
  'Assurance',
  'Constitution',
  'Erreur',
  'Fiduciaire',
  'Fonds propres',
  'Frais',
  'Impôt',
  'LAA',
  'LPP',
  'Mastercard',
  'Revenu',
  'Salaire',
  'TVA',
  'Taxe',
]

async function main() {
  console.log('=== Normalisation des catégories du Grand Livre ===')
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

    // ── Ledger entries ────────────────────────────────────────────────────────
    const entries = await pb.collection('ledger').getFullList({ fields: 'id,category,description' })
    console.log(`Écritures trouvées: ${entries.length}`)

    let updated = 0,
      skipped = 0,
      errors = 0

    for (const entry of entries) {
      const canonical = CATEGORY_MAP[entry.category]
      if (!canonical) {
        skipped++
        continue
      }

      console.log(
        `  ${isDryRun ? '[DRY-RUN]' : '[OK]'} "${entry.description}" : "${entry.category}" → "${canonical}"`,
      )

      if (!isDryRun) {
        try {
          await pb.collection('ledger').update(entry.id, { category: canonical })
          updated++
        } catch (e) {
          console.error(`  [ERR] ${entry.id}: ${e.message}`)
          errors++
        }
      } else {
        updated++
      }
    }

    console.log(
      `\nÉcritures à mettre à jour: ${updated}, inchangées: ${skipped}, erreurs: ${errors}`,
    )

    // ── company_settings ──────────────────────────────────────────────────────
    console.log('\n--- Mise à jour des catégories dans company_settings ---')
    console.log(`Nouvelles catégories: ${JSON.stringify(CLEAN_CATEGORIES)}`)

    if (!isDryRun) {
      const settings = await pb.collection('company_settings').getFirstListItem('')
      await pb
        .collection('company_settings')
        .update(settings.id, { ledger_categories: CLEAN_CATEGORIES })
      console.log('[OK] company_settings mis à jour.')
    } else {
      console.log('[DRY-RUN] company_settings non modifié.')
    }

    if (isDryRun) {
      console.log('\nDry-run terminé. Relancer avec --commit pour appliquer.')
    } else {
      console.log('\n✅ Normalisation terminée.')
    }

    if (!isDryRun && errors > 0) process.exit(1)
  } catch (e) {
    console.error(`Erreur fatale: ${e.message}`)
    process.exit(1)
  }
}

main()
