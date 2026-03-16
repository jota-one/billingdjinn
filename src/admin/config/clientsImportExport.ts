import type { FieldConfig } from '../types/import-export'
import { parseDecimal } from '../types/import-export'

export const CLIENTS_FIELDS_CONFIG: FieldConfig[] = [
  { key: 'id', label: 'ID', exportable: true, importable: true },
  { key: 'name', label: 'Nom', exportable: true, importable: true },
  { key: 'email', label: 'Email', exportable: true, importable: true },
  { key: 'address', label: 'Adresse', exportable: true, importable: true },
  { key: 'phone', label: 'Téléphone', exportable: true, importable: true },
  { key: 'contact_person', label: 'Personne de contact', exportable: true, importable: true },
  {
    key: 'hourly_rate',
    label: 'Taux horaire',
    exportable: true,
    importable: true,
    formatter: {
      import: v => (v !== '' ? parseDecimal(v) : null),
    },
  },
  {
    key: 'payment_terms',
    label: 'Délai de paiement (j.)',
    exportable: true,
    importable: true,
    formatter: {
      import: v => (v !== '' ? parseInt(v, 10) : null),
    },
  },
  { key: 'currency', label: 'Devise', exportable: true, importable: true },
]

export const getExportableFields = () => CLIENTS_FIELDS_CONFIG.filter(f => f.exportable)
export const getImportableFields = () => CLIENTS_FIELDS_CONFIG.filter(f => f.importable)
export const getFieldConfig = (key: string) => CLIENTS_FIELDS_CONFIG.find(f => f.key === key)
