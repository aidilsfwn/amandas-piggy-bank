import { createClient } from '@supabase/supabase-js'
import type { SavingsTransaction, TransactionType } from './domain'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
export const supabase = url && key ? createClient(url, key) : null

type Row = { id: string; user_id: string; type: TransactionType; amount_sen: number; transaction_date: string; dividend_year: number | null; dividend_rate_bps: number | null; note: string | null; created_at: string; updated_at: string }
export const toTransaction = (row: Row): SavingsTransaction => ({ id: row.id, type: row.type, amountSen: row.amount_sen, transactionDate: row.transaction_date, dividendYear: row.dividend_year ?? undefined, dividendRateBps: row.dividend_rate_bps ?? undefined, note: row.note ?? undefined, createdAt: row.created_at, updatedAt: row.updated_at })

export async function fetchRemoteTransactions() {
  if (!supabase) return []
  const { data, error, count } = await supabase.from('savings_transactions').select('id,user_id,type,amount_sen,transaction_date,dividend_year,dividend_rate_bps,note,created_at,updated_at', { count: 'exact' }).order('transaction_date', { ascending: false }).order('created_at', { ascending: false }).range(0, 999)
  if (error) throw error
  if (count !== null && data.length !== count) throw new Error(`Transaction sync returned ${data.length} of ${count} visible rows.`)
  return (data as Row[]).map(toTransaction)
}

export async function saveRemoteTransaction(userId: string, transaction: SavingsTransaction) {
  if (!supabase) return
  const { data, error } = await supabase.from('savings_transactions').upsert({ id: transaction.id, user_id: userId, type: transaction.type, amount_sen: transaction.amountSen, transaction_date: transaction.transactionDate, dividend_year: transaction.dividendYear ?? null, dividend_rate_bps: transaction.dividendRateBps ?? null, note: transaction.note ?? null, updated_at: transaction.updatedAt }).select('id,user_id,type,amount_sen,transaction_date,dividend_year,dividend_rate_bps,note,created_at,updated_at').single()
  if (error) throw error
  if (!data) throw new Error('Supabase accepted the write but returned no saved transaction.')
}

export async function deleteRemoteTransaction(userId: string, id: string) { if (!supabase) return; const { error } = await supabase.from('savings_transactions').delete().eq('id', id).eq('user_id', userId); if (error) throw error }
