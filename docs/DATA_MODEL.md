# Amanda's Piggy Bank — Data Model

## `profiles`

One row per authenticated owner.

| Column | Type | Rules |
|---|---|---|
| `id` | uuid | PK; references `auth.users.id` |
| `display_name` | text | default `Owner` |
| `created_at` | timestamptz | server default |
| `updated_at` | timestamptz | maintained on update |

## `children`

The MVP contains one Amanda row but keeps the child identity explicit for clean future expansion.

| Column | Type | Rules |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK to `auth.users.id`, not null |
| `name` | text | not null; MVP value `Amanda` |
| `created_at` | timestamptz | server default |

## `savings_transactions`

An appendable, user-owned ledger. Balances are derived; no balance columns are stored.

| Column | Type | Rules |
|---|---|---|
| `id` | uuid | PK; client-generated or server-generated |
| `user_id` | uuid | FK to `auth.users.id`, not null |
| `child_id` | uuid | FK to `children.id`, not null |
| `type` | text/enum | `gift_received`, `sspn_transfer`, `sspn_dividend` |
| `amount_sen` | integer | > 0 |
| `transaction_date` | date | not null |
| `dividend_year` | smallint | nullable; meaningful for dividends |
| `dividend_rate_bps` | integer | nullable; percentage in basis points, e.g. 405 = 4.05% |
| `note` | text | nullable, length-limited |
| `created_at` | timestamptz | server default |
| `updated_at` | timestamptz | maintained on update |

Add a check that dividend-only fields are used with `sspn_dividend`; the UI may also enforce that dividend year is optional and rate is optional.

## Derived domain object

```ts
type SavingsSummary = {
  giftsReceivedSen: number;
  sspnTransfersSen: number;
  sspnDividendsSen: number;
  totalBelongingSen: number;
  heldByMeSen: number;
  sspnBalanceSen: number;
};
```

Use integer arithmetic:

```ts
gifts = sum(type === 'gift_received')
transfers = sum(type === 'sspn_transfer')
dividends = sum(type === 'sspn_dividend')
total = gifts + dividends
heldByMe = gifts - transfers
sspnBalance = transfers + dividends
```

## Integrity and access

- RLS policies allow a user to select/insert/update/delete only rows where `user_id = auth.uid()`.
- A child row must belong to the same `user_id` as its transaction.
- Index `(user_id, transaction_date desc)`.
- Do not store `total`, `held_by_me`, or `sspn_balance` as mutable fields.
