-- The MVP is one private ledger for one owner. Child/profile entities add no value here.
alter table public.savings_transactions drop constraint if exists savings_transactions_child_id_fkey;
alter table public.savings_transactions drop column if exists child_id;
drop policy if exists "owners add own transactions" on public.savings_transactions;
create policy "owners add own transactions" on public.savings_transactions for insert with check (user_id = auth.uid());
drop table if exists public.children;
drop table if exists public.profiles;
