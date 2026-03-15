import type { FieldConfig } from '../types/import-export'

export const INVOICES_FIELDS_CONFIG: FieldConfig[] = [
  // ── invoice header ──────────────────────────────────────────────────────────
  {
    key: 'invoice_number',
    label: 'N° de facture',
    exportable: true,
    importable: true,
    unique: true,
  },
  {
    key: 'date',
    label: 'Date',
    exportable: true,
    importable: true,
  },
  {
    key: 'due_date',
    label: "Date d'échéance",
    exportable: true,
    importable: true,
  },
  {
    key: 'status',
    label: 'Statut',
    exportable: true,
    importable: true,
    // values: draft | sent | paid (ou brouillon | envoyée | payée)
  },
  {
    key: 'tva_enabled',
    label: 'TVA activée',
    exportable: true,
    importable: true,
    // values: oui | non
  },
  {
    key: 'tva_rate',
    label: 'Taux TVA (%)',
    exportable: true,
    importable: true,
    formatter: {
      import: v => (v !== '' ? parseFloat(v) : null),
    },
  },
  {
    key: 'notes',
    label: 'Notes',
    exportable: true,
    importable: true,
  },
  // ── client reference ────────────────────────────────────────────────────────
  {
    key: 'client_email',
    label: 'Email client',
    exportable: true,
    importable: true,
    // Used to resolve the client relation on import
  },
  {
    key: 'client_name',
    label: 'Nom client',
    exportable: true,
    importable: false, // informational only on import
  },
  {
    key: 'currency',
    label: 'Devise',
    exportable: true,
    importable: false, // derived from client.currency at import time
  },
  // ── invoice line ────────────────────────────────────────────────────────────
  {
    key: 'description',
    label: 'Description',
    exportable: true,
    importable: true,
  },
  {
    key: 'quantity',
    label: 'Quantité',
    exportable: true,
    importable: true,
    formatter: {
      import: v => (v !== '' ? parseFloat(v) : 1),
    },
  },
  {
    key: 'unit_price',
    label: 'Prix unitaire',
    exportable: true,
    importable: true,
    formatter: {
      import: v => (v !== '' ? parseFloat(v) : 0),
    },
  },
]

export const INVOICE_CSV_COLUMNS = INVOICES_FIELDS_CONFIG.filter(f => f.exportable).map(
  f => f.key,
) as readonly string[]

export const getExportableFields = () => INVOICES_FIELDS_CONFIG.filter(f => f.exportable)
export const getImportableFields = () => INVOICES_FIELDS_CONFIG.filter(f => f.importable)
export const getFieldConfig = (key: string) => INVOICES_FIELDS_CONFIG.find(f => f.key === key)
export const getUniqueFields = () => INVOICES_FIELDS_CONFIG.filter(f => f.unique)
