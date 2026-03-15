export type FieldFormatter = {
  export?: (value: any, row?: Record<string, any>) => string | Promise<string>
  import?: (value: string, row?: Record<string, any>) => any
}

export type FieldConfig = {
  key: string
  label: string
  exportable: boolean
  importable: boolean
  unique?: boolean
  formatter?: FieldFormatter
  derive?: (row: Record<string, any>) => any
}

export type ImportResult = {
  processed: number
  created: number
  updated: number
  unchanged: number
  success: number
  errors: Array<{ line: number; name: string; error: string }>
}
