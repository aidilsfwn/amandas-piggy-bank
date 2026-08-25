create extension if not exists "pgcrypto";

create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, display_name text not null default 'Owner', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.children (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, name text not null check (char_length(name) between 1 and 80), created_at timestamptz not null default now(), unique(user_id, name));
create type public.savings_transaction_type as enum ('gift_received', 'sspn_transfer', 'sspn_dividend');
create table public.savings_transactions (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, child_id uuid not null references public.children(id) on delete cascade, type public.savings_transaction_type not null, amount_sen integer not null check (amount_sen > 0), transaction_date date not null, dividend_year smallint, dividend_rate_bps integer check (dividend_rate_bps is null or dividend_rate_bps between 0 and 10000), note text check (note is null or char_length(note) <= 240), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check ((type = 'sspn_dividend') or (dividend_year is null and dividend_rate_bps is null)), check (dividend_year is null or dividend_year between 2000 and 2200));
create index savings_transactions_user_date_idx on public.savings_transactions(user_id, transaction_date desc, created_at desc);

alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.savings_transactions enable row level security;
create policy "owners manage own profile" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "owners manage own children" on public.children for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "owners read own transactions" on public.savings_transactions for select using (user_id = auth.uid());
create policy "owners add own transactions" on public.savings_transactions for insert with check (user_id = auth.uid() and exists (select 1 from public.children c where c.id = child_id and c.user_id = auth.uid()));
create policy "owners update own transactions" on public.savings_transactions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "owners delete own transactions" on public.savings_transactions for delete using (user_id = auth.uid());
