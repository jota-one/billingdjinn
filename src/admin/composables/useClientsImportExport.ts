import useImportExport from './useImportExport'
import {
  getExportableFields,
  getImportableFields,
  getFieldConfig,
} from '@/admin/config/clientsImportExport'

export default function useClientsImportExport() {
  return useImportExport('clients', getExportableFields, getImportableFields, getFieldConfig)
}
