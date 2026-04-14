import PocketBase from 'pocketbase'
import useImportExport from './useImportExport'
import config from '@/config'
import { createLedgerFieldsConfig } from '../config/ledgerImportExport'

export default function useLedgerImportExport() {
  const pb = new PocketBase(config.apiBaseUrl)
  const fullConfig = createLedgerFieldsConfig(pb)

  return useImportExport(
    'ledger',
    () => fullConfig.filter(f => f.exportable),
    () => fullConfig.filter(f => f.importable),
    key => fullConfig.find(f => f.key === key),
  )
}
