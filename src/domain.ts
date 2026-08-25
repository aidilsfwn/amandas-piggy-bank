export type TransactionType = 'gift_received' | 'sspn_transfer' | 'sspn_dividend'

export type SavingsTransaction = {
  id: string
  type: TransactionType
  amountSen: number
  transactionDate: string
  dividendYear?: number
  dividendRateBps?: number
  note?: string
  createdAt: string
  updatedAt: string
}

export type SavingsSummary = {
  giftsReceivedSen: number
  sspnTransfersSen: number
  sspnDividendsSen: number
  totalBelongingSen: number
  heldByMeSen: number
  sspnBalanceSen: number
}

export const transactionLabels: Record<TransactionType, string> = { gift_received: 'Gift received', sspn_transfer: 'SSPN transfer', sspn_dividend: 'SSPN dividend' }

export const calculateSummary = (transactions: SavingsTransaction[]): SavingsSummary => {
  const giftsReceivedSen = transactions.filter((t) => t.type === 'gift_received').reduce((sum, t) => sum + t.amountSen, 0)
  const sspnTransfersSen = transactions.filter((t) => t.type === 'sspn_transfer').reduce((sum, t) => sum + t.amountSen, 0)
  const sspnDividendsSen = transactions.filter((t) => t.type === 'sspn_dividend').reduce((sum, t) => sum + t.amountSen, 0)
  return { giftsReceivedSen, sspnTransfersSen, sspnDividendsSen, totalBelongingSen: giftsReceivedSen + sspnDividendsSen, heldByMeSen: giftsReceivedSen - sspnTransfersSen, sspnBalanceSen: sspnTransfersSen + sspnDividendsSen }
}

export const parseAmountToSen = (value: string): number | null => {
  const normalized = value.trim().replace(/,/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null
  const [ringgit, cents = ''] = normalized.split('.')
  const sen = Number(ringgit) * 100 + Number(cents.padEnd(2, '0'))
  return Number.isSafeInteger(sen) && sen > 0 ? sen : null
}

export const formatRM = (sen: number) => new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(sen / 100)

export const validateTransaction = (input: { type: TransactionType; amount: string; date: string; dividendYear: string; dividendRate: string; note: string }, summary: SavingsSummary, currentTransferSen = 0): string | null => {
  const amountSen = parseAmountToSen(input.amount)
  if (!amountSen) return 'Enter an amount greater than RM0.00, with up to two decimal places.'
  if (!input.date) return 'Choose a transaction date.'
  if (input.type === 'sspn_transfer' && summary.heldByMeSen - amountSen + currentTransferSen < 0) return `This transfer is more than the amount held by you (${formatRM(summary.heldByMeSen + currentTransferSen)}).`
  if (input.type !== 'sspn_dividend' && (input.dividendYear || input.dividendRate)) return 'Dividend year and rate are only used for dividends.'
  if (input.dividendYear && (!/^\d{4}$/.test(input.dividendYear) || Number(input.dividendYear) < 2000 || Number(input.dividendYear) > 2200)) return 'Enter a valid dividend year.'
  if (input.dividendRate && (!/^\d+(\.\d{1,2})?$/.test(input.dividendRate) || Number(input.dividendRate) > 100)) return 'Enter a dividend rate from 0% to 100%.'
  if (input.note.length > 240) return 'Notes must be 240 characters or fewer.'
  return null
}

export const sortTransactions = (transactions: SavingsTransaction[]) => [...transactions].sort((a, b) => `${b.transactionDate}${b.createdAt}`.localeCompare(`${a.transactionDate}${a.createdAt}`))
