import PocketBase from 'pocketbase'
import useImportExport from './useImportExport'
import config from '@/config'
import {
  getExportableFields,
  getImportableFields,
  getFieldConfig,
} from '../config/ledgerImportExport'

export default function useLedgerImportExport() {
  const base = useImportExport('ledger', getExportableFields, getImportableFields, getFieldConfig)

  const importFromCSV = async (file: File) => {
    const result = await base.importFromCSV(file)
    if (result.created > 0 || result.updated > 0) {
      await syncNewCategoriesToSettings()
    }
    return result
  }

  return { ...base, importFromCSV }
}

async function syncNewCategoriesToSettings(): Promise<void> {
  const pb = new PocketBase(config.apiBaseUrl)
  const [entries, settings] = await Promise.all([
    pb.collection<{ category: string }>('ledger').getFullList({ fields: 'category' }),
    pb
      .collection<{ id: string; ledger_categories: string[] }>('company_settings')
      .getFirstListItem(''),
  ])

  const usedCategories = [...new Set(entries.map(e => e.category ?? '').filter(Boolean))]
  const existing: string[] = settings.ledger_categories ?? []
  const newOnes = usedCategories.filter(c => !existing.includes(c))

  if (newOnes.length === 0) return

  await pb.collection('company_settings').update(settings.id, {
    ledger_categories: JSON.stringify([...existing, ...newOnes]),
  })
}
