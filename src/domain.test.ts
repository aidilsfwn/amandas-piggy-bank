import { describe, expect, it } from 'vitest'
import { calculateSummary, parseAmountToSen, validateTransaction, type SavingsTransaction } from './domain'

const tx = (type: SavingsTransaction['type'], amountSen: number): SavingsTransaction => ({ id: crypto.randomUUID(), type, amountSen, transactionDate: '2025-01-01', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' })

describe('savings accounting', () => {
  it('calculates the normal reconciliation', () => { const result = calculateSummary([tx('gift_received', 10000), tx('sspn_transfer', 4000), tx('sspn_dividend', 200)]); expect(result).toEqual({ giftsReceivedSen: 10000, sspnTransfersSen: 4000, sspnDividendsSen: 200, totalBelongingSen: 10200, heldByMeSen: 6000, sspnBalanceSen: 4200 }) })
  it('handles zero data', () => { expect(calculateSummary([]).totalBelongingSen).toBe(0) })
  it('reconciles equal transfer and gifts', () => { const result = calculateSummary([tx('gift_received', 5000), tx('sspn_transfer', 5000)]); expect(result.heldByMeSen).toBe(0); expect(result.totalBelongingSen).toBe(result.sspnBalanceSen) })
  it('includes dividends in total and SSPN only', () => { const result = calculateSummary([tx('gift_received', 10000), tx('sspn_dividend', 405)]); expect(result.heldByMeSen).toBe(10000); expect(result.sspnBalanceSen).toBe(405); expect(result.totalBelongingSen).toBe(10405) })
  it('rejects a transfer greater than held money', () => { const result = calculateSummary([tx('gift_received', 1000)]); expect(validateTransaction({ type: 'sspn_transfer', amount: '10.01', date: '2025-01-01', dividendYear: '', dividendRate: '', note: '' }, result)).toMatch(/more than/) })
})

describe('money validation', () => {
  it('parses only positive amounts up to two decimals', () => { expect(parseAmountToSen('1,234.5')).toBe(123450); expect(parseAmountToSen('0')).toBeNull(); expect(parseAmountToSen('2.345')).toBeNull(); expect(parseAmountToSen('-4')).toBeNull() })
})
