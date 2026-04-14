import dayjs from 'dayjs'
import type { TLedgerEntry } from '@/admin/composables/useLedger'

export function scoreCandidate(
  entry: TLedgerEntry,
  refDate: string,
  refAmount: number,
  maxDaysDiff: number,
): number {
  const daysDiff = Math.abs(dayjs(entry.date).diff(dayjs(refDate), 'day'))
  const dateScore = Math.max(0, 1 - daysDiff / maxDaysDiff)
  const amountDiff = Math.abs(entry.amount - refAmount)
  const amountScore =
    refAmount !== 0 ? Math.max(0, 1 - amountDiff / (Math.abs(refAmount) * 1.5)) : 0
  return dateScore * 0.6 + amountScore * 0.4
}
