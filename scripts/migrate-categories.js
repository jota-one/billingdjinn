/**
 * One-shot script: migration des catégories du Grand Livre.
 *
 * - Lit company_settings.ledger_categories
 * - Crée les records dans la collection `categories`
 * - Patche chaque entrée `ledger` : remplace category (text) par category_id (relation)
 * - Vide ledger_categories dans company_settings
 *
 * Prérequis: migrations 1776211200 et 1776211201 déjà appliquées.
 *
 * Mode dry-run par défaut (aucune écriture).
 * Utiliser --commit pour appliquer les changements.
 *
 * Usage:
 *   PB_URL=https://... PB_ADMIN_EMAIL=... PB_ADMIN_PASSWORD=... node scripts/migrate-categories.js
 *   PB_URL=https://... PB_ADMIN_EMAIL=... PB_ADMIN_PASSWORD=... node scripts/migrate-categories.js --commit
 */

import PocketBase from 'pocketbase'

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090'
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD
const isCommit = process.argv.includes('--commit')
const isDryRun = !isCommit

/** Même logique que normalizeLedgerCategories côté frontend */
function normalizeLedgerCategories(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .map(item => {
      if (typeof item === 'string') return { name: item, patterns: [] }
      if (item && typeof item === 'object' && typeof item.name === 'string')
        return { name: item.name, patterns: Array.isArray(item.patterns) ? item.patterns : [] }
      return null
    })
    .filter(Boolean)
}

async function main() {
  console.log('=== Migration des catégories du Grand Livre ===')
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

    // ── Lecture de company_settings ───────────────────────────────────────────
    console.log('--- Lecture de company_settings.ledger_categories ---')
    const settings = await pb.collection('company_settings').getFirstListItem('')
    const rawCategories = normalizeLedgerCategories(settings.ledger_categories)
    console.log(`Catégories trouvées: ${rawCategories.length}`)
    rawCategories.forEach(c => console.log(`  - "${c.name}" (${c.patterns.length} patterns)`))

    if (rawCategories.length === 0) {
      console.error('\nAucune catégorie à migrer. Abandon.')
      process.exit(1)
    }

    // ── Création des records categories ──────────────────────────────────────
    console.log('\n--- Création des records dans la collection `categories` ---')

    /** Map name → id pour le patch ledger */
    const categoryIdByName = new Map()

    for (const cat of rawCategories) {
      console.log(`  ${isDryRun ? '[DRY-RUN]' : '[OK]'} Création: "${cat.name}"`)
      if (!isDryRun) {
        const record = await pb.collection('categories').create({
          name: cat.name,
          patterns: cat.patterns,
        })
        categoryIdByName.set(cat.name, record.id)
      } else {
        categoryIdByName.set(cat.name, `dry-run-id-${cat.name}`)
      }
    }

    // ── Patch des entrées ledger ──────────────────────────────────────────────
    console.log('\n--- Patch des entrées `ledger` ---')
    const entries = await pb.collection('ledger').getFullList({ fields: 'id,category,description' })
    console.log(`Écritures trouvées: ${entries.length}`)

    let updated = 0,
      skipped = 0,
      unknown = 0,
      errors = 0

    for (const entry of entries) {
      if (!entry.category) {
        skipped++
        continue
      }

      const categoryId = categoryIdByName.get(entry.category)
      if (!categoryId) {
        console.warn(
          `  [WARN] Catégorie inconnue: "${entry.category}" (id: ${entry.id}, desc: "${entry.description}")`,
        )
        unknown++
        continue
      }

      console.log(
        `  ${isDryRun ? '[DRY-RUN]' : '[OK]'} "${entry.description}": category "${entry.category}" → category_id "${categoryId}"`,
      )

      if (!isDryRun) {
        try {
          await pb.collection('ledger').update(entry.id, { category_id: categoryId })
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
      `\nÉcritures: ${updated} à mettre à jour, ${skipped} sans catégorie, ${unknown} catégorie inconnue, ${errors} erreurs`,
    )

    if (unknown > 0) {
      console.warn(
        '\n⚠️  Des entrées ont une catégorie inconnue (non présente dans ledger_categories).',
      )
      console.warn('   Ces entrées ne seront PAS migrées. Vérifiez et relancez si nécessaire.')
    }

    // ── Vidage de company_settings.ledger_categories ─────────────────────────
    console.log('\n--- Nettoyage de company_settings.ledger_categories ---')
    if (!isDryRun) {
      await pb.collection('company_settings').update(settings.id, { ledger_categories: [] })
      console.log('[OK] ledger_categories vidé dans company_settings.')
    } else {
      console.log('[DRY-RUN] company_settings non modifié.')
    }

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
