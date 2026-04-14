import dayjs from 'dayjs'
import { scoreCandidate } from './ledger'
import { detectCategory } from '../utils/matchPattern'
import type { TLedgerEntry, TLedgerCandidateEntry } from '../composables/useLedger'
import type { TBankEntry } from '../types/bank-entry'
import type { TCategory } from '../types/category'

export type ReconciliationAction = 'link' | 'create' | 'ignore'

export interface TReconciliationRow {
  bankEntry: TBankEntry
  candidates: TLedgerCandidateEntry[]
  action: ReconciliationAction
  linkedEntryId: string | null
  editedDescription: string
  editedCategoryId: string
  editedDate: string
  editedAmount: number
}

const SCORE_THRESHOLD = 0.1
const MAX_CANDIDATES = 5
const DATE_WINDOW_DAYS = 15

/**
 * Builds a reconciliation table from bank entries and ledger entries.
 * Uses a greedy matching algorithm: highest-scored pairs are assigned first.
 */
export function buildReconciliation(
  bankEntries: TBankEntry[],
  plannedEntries: TLedgerEntry[],
  categories: TCategory[],
): TReconciliationRow[] {
  interface Pair {
    bankIdx: number
    entryIdx: number
    score: number
  }
  const pairs: Pair[] = []

  for (let bi = 0; bi < bankEntries.length; bi++) {
    const bank = bankEntries[bi]
    const bankDate = bank.date
    const from = dayjs(bankDate).subtract(DATE_WINDOW_DAYS, 'day').format('YYYY-MM-DD')
    const to = dayjs(bankDate).add(DATE_WINDOW_DAYS, 'day').format('YYYY-MM-DD')

    for (let ei = 0; ei < plannedEntries.length; ei++) {
      const entry = plannedEntries[ei]
      if (Math.sign(bank.amount) !== Math.sign(entry.amount)) {
        continue
      }
      if (entry.date < from || entry.date > to) {
        continue
      }
      const score = scoreCandidate(entry, bankDate, bank.amount, DATE_WINDOW_DAYS)
      if (score > SCORE_THRESHOLD) {
        pairs.push({ bankIdx: bi, entryIdx: ei, score })
      }
    }
  }

  pairs.sort((a, b) => b.score - a.score)

  const assignedBankIdxs = new Set<number>()
  const assignedEntryIdxs = new Set<number>()
  const matchMap = new Map<number, number>()

  for (const pair of pairs) {
    if (assignedBankIdxs.has(pair.bankIdx) || assignedEntryIdxs.has(pair.entryIdx)) {
      continue
    }
    matchMap.set(pair.bankIdx, pair.entryIdx)
    assignedBankIdxs.add(pair.bankIdx)
    assignedEntryIdxs.add(pair.entryIdx)
  }

  return bankEntries.map((bank, bi) => {
    const bankDate = bank.date
    const from = dayjs(bankDate).subtract(DATE_WINDOW_DAYS, 'day').format('YYYY-MM-DD')
    const to = dayjs(bankDate).add(DATE_WINDOW_DAYS, 'day').format('YYYY-MM-DD')

    const candidates: TLedgerCandidateEntry[] = plannedEntries
      .filter(e => Math.sign(bank.amount) === Math.sign(e.amount) && e.date >= from && e.date <= to)
      .map(e => ({ ...e, score: scoreCandidate(e, bankDate, bank.amount, DATE_WINDOW_DAYS) }))
      .filter(e => e.score > SCORE_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_CANDIDATES)

    const matchedEntryIdx = matchMap.get(bi) ?? null
    const linkedEntryId = matchedEntryIdx !== null ? plannedEntries[matchedEntryIdx].id : null
    const suggestedCategoryId = detectCategory(bank.description, categories)

    const matchedEntry = matchedEntryIdx !== null ? plannedEntries[matchedEntryIdx] : null
    const action: ReconciliationAction = matchedEntry
      ? matchedEntry.is_checked
        ? 'ignore'
        : 'link'
      : 'create'

    return {
      bankEntry: bank,
      candidates,
      action,
      linkedEntryId,
      editedDescription: matchedEntry?.description ?? bank.description,
      editedCategoryId: matchedEntry?.category_id ?? suggestedCategoryId ?? '',
      editedDate: bank.date,
      editedAmount: bank.amount,
    } satisfies TReconciliationRow
  })
}
