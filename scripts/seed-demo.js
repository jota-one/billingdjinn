/**
 * Demo data seeder for billingdjinn.
 *
 * Usage:
 *   node scripts/seed-demo.js --persona solo
 *   node scripts/seed-demo.js --persona small-biz
 *   node scripts/seed-demo.js --persona pme
 *   node scripts/seed-demo.js --persona pme --no-clean
 *
 * Env vars:
 *   PB_URL             (default: http://127.0.0.1:8092)
 *   PB_ADMIN_EMAIL
 *   PB_ADMIN_PASSWORD
 */

import PocketBase from 'pocketbase'
import { clean } from './seed/clean.js'
import { generatePersona } from './seed/generate.js'

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8092'
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD

const args = process.argv.slice(2)
const personaArg = args[args.indexOf('--persona') + 1]
const doClean = !args.includes('--no-clean')

const PERSONAS = {
  solo: () => import('./seed/personas/solo.js'),
  'small-biz': () => import('./seed/personas/small-biz.js'),
  pme: () => import('./seed/personas/pme.js'),
}

async function main() {
  if (!personaArg || !PERSONAS[personaArg]) {
    console.error(`Usage: node scripts/seed-demo.js --persona <${Object.keys(PERSONAS).join('|')}>`)
    process.exit(1)
  }

  if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
    console.error('Variables manquantes: PB_ADMIN_EMAIL et PB_ADMIN_PASSWORD')
    process.exit(1)
  }

  const pb = new PocketBase(PB_URL)

  try {
    console.log(`Connexion à ${PB_URL}...`)
    await pb.collection('_superusers').authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD)
    console.log('Authentifié.\n')

    if (doClean) {
      console.log('Nettoyage des données existantes...')
      await clean(pb)
      console.log()
    }

    console.log(`Seeding persona "${personaArg}"...`)
    const start = Date.now()

    const { config } = await PERSONAS[personaArg]()
    const stats = await generatePersona(pb, config)

    const elapsed = ((Date.now() - start) / 1000).toFixed(1)
    console.log(`\nTerminé en ${elapsed}s`)
    console.log(`  Clients:  ${stats.clients}`)
    console.log(`  Factures: ${stats.invoices}`)
    console.log(`  Lignes:   ${stats.lines}`)
    console.log(`  Ledger:   ${stats.ledger}`)
  } catch (e) {
    console.error(`\nErreur fatale: ${e.message}`)
    if (e.data) console.error(JSON.stringify(e.data, null, 2))
    process.exit(1)
  }
}

void main()
