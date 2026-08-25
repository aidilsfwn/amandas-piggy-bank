import { createClient } from '@supabase/supabase-js'
import type { SavingsTransaction, TransactionType } from './domain'

const url = (import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.NEXT_PUBLIC_SUPABASE_URL ?? import.meta.env.SUPABASE_URL) as string | undefined
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.SUPABASE_PUBLISHABLE_KEY) as string | undefined
export const supabase = url && key ? createClient(url, key) : null

type Row = { id: string; user_id: string; child_id: string; type: TransactionType; amount_sen: number; transaction_date: string; dividend_year: number | null; dividend_rate_bps: number | null; note: string | null; created_at: string; updated_at: string }
export const toTransaction = (row: Row): SavingsTransaction => ({ id: row.id, type: row.type, amountSen: row.amount_sen, transactionDate: row.transaction_date, dividendYear: row.dividend_year ?? undefined, dividendRateBps: row.dividend_rate_bps ?? undefined, note: row.note ?? undefined, createdAt: row.created_at, updatedAt: row.updated_at })

export async function ensureChild(userId: string) {
  if (!supabase) return null
  const { data: existing } = await supabase.from('children').select('id').eq('user_id', userId).eq('name', 'Amanda').maybeSingle()
  if (existing) return existing.id as string
  const { data, error } = await supabase.from('children').insert({ user_id: userId, name: 'Amanda' }).select('id').single()
  if (error) throw error
  return data.id as string
}

export async function fetchRemoteTransactions(userId: string) {
  if (!supabase) return []
  const { data, error } = await supabase.from('savings_transactions').select('*').eq('user_id', userId).order('transaction_date', { ascending: false }).order('created_at', { ascending: false })
  if (error) throw error
  return (data as Row[]).map(toTransaction)
}

export async function saveRemoteTransaction(userId: string, transaction: SavingsTransaction) {
  if (!supabase) return
  const childId = await ensureChild(userId)
  if (!childId) throw new Error('Could not create Amanda profile.')
  const { error } = await supabase.from('savings_transactions').upsert({ id: transaction.id, user_id: userId, child_id: childId, type: transaction.type, amount_sen: transaction.amountSen, transaction_date: transaction.transactionDate, dividend_year: transaction.dividendYear ?? null, dividend_rate_bps: transaction.dividendRateBps ?? null, note: transaction.note ?? null, updated_at: transaction.updatedAt })
  if (error) throw error
}

export async function deleteRemoteTransaction(userId: string, id: string) { if (!supabase) return; const { error } = await supabase.from('savings_transactions').delete().eq('id', id).eq('user_id', userId); if (error) throw error }
