export interface TBankEntry {
  date: string // ISO YYYY-MM-DD
  description: string
  amount: number // signed: positive = credit, negative = debit
  reference?: string
}

export type BankAdapterId = 'camt053'

export interface BankAdapter {
  id: BankAdapterId
  label: string
  parse(csv: string): TBankEntry[]
}
