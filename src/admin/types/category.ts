import type { TAllocationKey } from './allocation-key'

export interface TCategory {
  id: string
  name: string
  patterns: string[]
  allocation_keys?: TAllocationKey[]
  created: string
  updated: string
}
