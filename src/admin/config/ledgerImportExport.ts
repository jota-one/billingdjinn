import type { FieldConfig } from '../types/import-export'
import { parseDecimal } from '../types/import-export'
import dayjs from 'dayjs'

export const LEDGER_FIELDS_CONFIG: FieldConfig[] = [
  { key: 'id', label: 'ID', exportable: true, importable: true },
  {
    key: 'date',
    label: 'Date',
    exportable: true,
    importable: true,
    formatter: {
      export: (v: string) => (v ? dayjs(v).format('DD.MM.YYYY') : ''),
      import: (v: string) => {
        if (!v) return null
        const m = v.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
        if (m) return `${m[3]}-${m[2]}-${m[1]}`
        if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.substring(0, 10)
        return null
      },
    },
  },
  { key: 'description', label: 'Description', exportable: true, importable: true },
  { key: 'category', label: 'Catégorie', exportable: true, importable: true },
  {
    key: 'amount',
    label: 'Montant',
    exportable: true,
    importable: true,
    formatter: {
      import: (v: string) => (v !== '' ? parseDecimal(v) : null),
    },
  },
  {
    key: 'is_checked',
    label: 'Vérifié',
    exportable: true,
    importable: true,
    formatter: {
      export: (v: boolean) => (v ? '1' : '0'),
      import: (v: string) => v === '1' || v.toLowerCase() === 'true',
    },
  },
]

export const getExportableFields = () => LEDGER_FIELDS_CONFIG.filter(f => f.exportable)
export const getImportableFields = () => LEDGER_FIELDS_CONFIG.filter(f => f.importable)
export const getFieldConfig = (key: string) => LEDGER_FIELDS_CONFIG.find(f => f.key === key)
