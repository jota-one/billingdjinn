import type { FieldConfig } from '@/admin/types/import-export'
import { parseDecimal } from '@/admin/types/import-export'
import dayjs from 'dayjs'
import PocketBase from 'pocketbase'

/** Static config — keys and labels only, used for column listing. No PB dependency. */
const BASE_CONFIG = [
  { key: 'id', label: 'ID', exportable: true, importable: true },
  {
    key: 'date',
    label: 'Date',
    exportable: true,
    importable: true,
  },
  { key: 'description', label: 'Description', exportable: true, importable: true },
  { key: 'category_id', label: 'Catégorie', exportable: true, importable: true },
  { key: 'amount', label: 'Montant', exportable: true, importable: true },
  { key: 'is_checked', label: 'Vérifié', exportable: true, importable: true },
]

export const getExportableFields = () => BASE_CONFIG.filter(f => f.exportable)
export const getImportableFields = () => BASE_CONFIG.filter(f => f.importable)
export const getFieldConfig = (key: string) => BASE_CONFIG.find(f => f.key === key)

/**
 * Full config with formatters — requires a PocketBase instance for the category_id field.
 * Used in useLedgerImportExport for actual import/export operations.
 */
export function createLedgerFieldsConfig(pb: PocketBase): FieldConfig[] {
  return [
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
    {
      key: 'category_id',
      label: 'Catégorie',
      exportable: true,
      importable: true,
      formatter: {
        export: async (v: string) => {
          if (!v) return ''
          try {
            const cat = await pb.collection('categories').getOne(v, { requestKey: null })
            return (cat as any).name ?? ''
          } catch {
            return ''
          }
        },
        import: async (v: string) => {
          if (!v) return null
          try {
            const cat = await pb
              .collection('categories')
              .getFirstListItem(`name="${v}"`, { requestKey: null })
            return cat.id
          } catch {
            const cat = await pb
              .collection('categories')
              .create({ name: v, patterns: [] }, { requestKey: null })
            return cat.id
          }
        },
      },
    },
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
}
