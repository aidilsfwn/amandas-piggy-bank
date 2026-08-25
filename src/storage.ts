import type { SavingsTransaction } from './domain'

const TRANSACTIONS_KEY = 'amandas-piggy-bank:transactions'
const OWNER_KEY = 'amandas-piggy-bank:owner'
export const loadTransactions = (): SavingsTransaction[] => { try { return JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) ?? '[]') as SavingsTransaction[] } catch { return [] } }
export const saveTransactions = (transactions: SavingsTransaction[]) => localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions))
export const loadOwner = () => localStorage.getItem(OWNER_KEY)
export const saveOwner = (name: string) => localStorage.setItem(OWNER_KEY, name)
export const clearOwner = () => localStorage.removeItem(OWNER_KEY)
export const exportCsv = (transactions: SavingsTransaction[]) => { const header = 'Date,Type,Amount (RM),Dividend year,Dividend rate,Notes'; const rows = transactions.map((t) => [t.transactionDate, t.type, (t.amountSen / 100).toFixed(2), t.dividendYear ?? '', t.dividendRateBps ? (t.dividendRateBps / 100).toFixed(2) : '', t.note ?? ''].map((v) => `"${String(v).replaceAll('"', '""')}"`).join(',')); const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'amandas-piggy-bank.csv'; link.click(); URL.revokeObjectURL(url) }
