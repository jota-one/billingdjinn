import { ref } from 'vue'
import config from '../../config'
import PocketBase from 'pocketbase'
import type { FieldConfig, ImportResult } from '../types/import-export'

type TGetFieldsConfig = () => FieldConfig[]
type TGetFieldConfig = (key: string) => FieldConfig | undefined

export default function useImportExport(
  collectionName: string,
  getExportableFields: TGetFieldsConfig,
  getImportableFields: TGetFieldsConfig,
  getFieldConfig: TGetFieldConfig,
) {
  const pb = new PocketBase(config.apiBaseUrl)
  const isExporting = ref(false)
  const isImporting = ref(false)

  const log = (level: 'info' | 'warn' | 'error', msg: string, payload?: Record<string, any>) => {
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    payload ? fn(`[${collectionName}] ${msg}`, payload) : fn(`[${collectionName}] ${msg}`)
  }

  // ─── export ────────────────────────────────────────────────────────────────

  const exportToCSV = async () => {
    isExporting.value = true
    try {
      const records = await pb.collection(collectionName).getFullList()
      const fields = getExportableFields()
      const headers = fields.map(f => f.key)
      const csvRows = [headers.join(',')]

      for (const record of records as any[]) {
        const row = await Promise.all(
          fields.map(async f => {
            const value = record[f.key]
            let cell: string
            if (f.formatter?.export) {
              cell = String((await f.formatter.export(value, record)) ?? '')
            } else if (typeof value === 'boolean') {
              cell = value ? '1' : '0'
            } else if (value === null || value === undefined) {
              cell = ''
            } else {
              cell = String(value)
            }
            return escapeCSV(cell)
          }),
        )
        csvRows.push(row.join(','))
      }

      downloadFile(csvRows.join('\n'), `${collectionName}-export.csv`, 'text/csv;charset=utf-8')
    } finally {
      isExporting.value = false
    }
  }

  // ─── import ────────────────────────────────────────────────────────────────

  const importFromCSV = async (file: File): Promise<ImportResult> => {
    isImporting.value = true
    const result: ImportResult = {
      processed: 0,
      created: 0,
      updated: 0,
      unchanged: 0,
      success: 0,
      errors: [],
    }
    log('info', 'début import', { filename: file.name })

    try {
      const rows = parseCSV(await file.text())
      if (rows.length < 2) throw new Error('Fichier CSV vide ou invalide')

      const headers = rows[0]

      for (let i = 1; i < rows.length; i++) {
        const values = rows[i]
        if (!values || values.every(v => v === '')) continue

        try {
          const record: any = {}

          for (const [idx, header] of headers.entries()) {
            const fieldConfig = getFieldConfig(header)
            if (!fieldConfig?.importable) continue
            const raw = values[idx] || ''
            record[header] = fieldConfig.formatter?.import
              ? await fieldConfig.formatter.import(raw, record)
              : unescapeCSV(raw)
          }

          // Apply derive callbacks for missing values
          for (const f of getImportableFields()) {
            if (
              f.derive &&
              (record[f.key] === undefined || record[f.key] === null || record[f.key] === '')
            ) {
              record[f.key] = f.derive(record)
            }
          }

          if (record.id) {
            try {
              const existing = await pb.collection(collectionName).getOne(record.id)
              const { hasChanges, diffs } = recordDiff(record, existing)
              if (hasChanges) {
                log('info', 'mise à jour', { id: record.id, diffs })
                await pb.collection(collectionName).update(record.id, record)
                result.updated++
              } else {
                result.unchanged++
              }
            } catch {
              delete record.id
              await checkUniqueConflicts(record, getImportableFields())
              await pb.collection(collectionName).create(record)
              result.created++
            }
          } else {
            await checkUniqueConflicts(record, getImportableFields())
            await pb.collection(collectionName).create(record)
            result.created++
          }
        } catch (error: any) {
          const pbErr = error?.data || error?.response?.data
          let msg = error?.message || 'Erreur inconnue'
          if (pbErr?.data) {
            const fieldErrors = Object.entries(pbErr.data)
              .map(([f, e]: [string, any]) => `${f}: ${e?.message || String(e)}`)
              .join('; ')
            if (fieldErrors) msg = fieldErrors
          } else if (pbErr?.message) {
            msg = pbErr.message
          }
          result.errors.push({
            line: i + 1,
            name: values[headers.indexOf('name')] || '?',
            error: msg,
          })
          log('warn', 'erreur ligne', { line: i + 1, error: msg })
        } finally {
          result.processed++
          result.success = result.created + result.updated + result.unchanged
        }
      }
    } finally {
      isImporting.value = false
    }

    log('info', 'fin import', result)
    return result
  }

  // ─── utilities ─────────────────────────────────────────────────────────────

  const escapeCSV = (v: string): string => {
    if (!v) return ''
    if (v.includes(',') || v.includes('"') || v.includes('\n')) return `"${v.replace(/"/g, '""')}"`
    return v
  }

  const unescapeCSV = (v: string): string => {
    if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1).replace(/""/g, '"')
    return v
  }

  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = []
    let row: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < text.length; i++) {
      const c = text[i],
        next = text[i + 1]
      if (c === '"') {
        if (inQuotes && next === '"') {
          current += '"'
          i++
        } else inQuotes = !inQuotes
        continue
      }
      if (!inQuotes && (c === '\n' || c === '\r')) {
        row.push(current)
        current = ''
        if (!(row.length === 1 && row[0] === '')) rows.push(row)
        row = []
        if (c === '\r' && next === '\n') i++
        continue
      }
      if (!inQuotes && c === ',') {
        row.push(current)
        current = ''
        continue
      }
      current += c
    }
    row.push(current)
    if (!(row.length === 1 && row[0] === '')) rows.push(row)
    return rows
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob(['\ufeff' + content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const recordDiff = (incoming: Record<string, any>, existing: Record<string, any>) => {
    const diffs: Array<{ key: string; incoming: any; existing: any }> = []
    for (const key of Object.keys(incoming).filter(k => k !== 'id')) {
      if (!isEqualValue(incoming[key], existing[key], key))
        diffs.push({ key, incoming: incoming[key], existing: existing[key] })
    }
    return { hasChanges: diffs.length > 0, diffs }
  }

  const checkUniqueConflicts = async (record: Record<string, any>, fields: FieldConfig[]) => {
    for (const f of fields.filter(f => f.unique && record[f.key])) {
      try {
        await pb.collection(collectionName).getFirstListItem(`${f.key}="${record[f.key]}"`)
        throw new Error(`${f.label} "${record[f.key]}" existe déjà`)
      } catch (e: any) {
        if (e?.status === 404) continue
        throw e
      }
    }
  }

  const isEqualValue = (a: any, b: any, key?: string): boolean => {
    const norm = (v: any) => {
      if (v === '') return null
      const fc = key ? getFieldConfig(key) : undefined
      if (Array.isArray(v)) return [...v].sort()
      if (fc?.formatter?.import) return fc.formatter.import(String(v ?? ''))
      return v ?? null
    }
    const na = norm(a),
      nb = norm(b)
    if (Array.isArray(na) && Array.isArray(nb)) {
      return na.length === nb.length && na.every((x, i) => x === nb[i])
    }
    return na === nb
  }

  return { isExporting, isImporting, exportToCSV, importFromCSV }
}
