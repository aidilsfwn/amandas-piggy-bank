# Amanda's Piggy Bank — Technical Specification

## Stack

- React, Vite, and TypeScript.
- shadcn/ui primitives with Tailwind CSS.
- Supabase Auth, Postgres, and Row Level Security on the free tier.
- PWA manifest and service worker suitable for iPhone Safari and desktop Safari/Chrome.
- Deploy to a static hosting provider with a custom domain or subdomain.

## Architecture

The browser is the only application runtime. Supabase provides authentication and persistence; there is no custom backend in the MVP.

```text
React UI -> typed domain/validation layer -> Supabase client -> Postgres + RLS
```

Keep financial calculations in pure TypeScript functions so they can be unit tested independently of React or Supabase.

## Screens and components

- Auth screen: email magic link or password login.
- Dashboard: total, held by me, SSPN balance, contributions, dividends, and recent activity.
- Transaction form: type-specific fields and validation.
- Transaction history: newest first, formatted RM values, edit/delete actions.
- Empty/loading/error states.
- Settings: sign out, install/help, optional data export.

## Data and calculation rules

- Store money as integer `amount_sen`; never use floating-point values for persistence or arithmetic.
- Use ISO dates (`YYYY-MM-DD`) for transaction dates.
- Calculate summaries from the complete transaction set fetched for the owner.
- Sort history by transaction date descending, then creation time descending.
- Format amounts with `Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' })`.
- Show a clear sync/error state; do not silently discard failed writes.

## Security

- Supabase Auth identifies the owner.
- Every application row has `user_id = auth.uid()` enforced by RLS.
- The frontend must not contain service-role credentials.
- Use environment variables for Supabase URL and anon key.
- Validate again at the database boundary with constraints and/or a typed insert path.

## Offline/PWA behavior

- Cache the app shell and static assets.
- Previously loaded data may remain readable offline.
- MVP writes may require connectivity; show `Offline` and disable or queue writes explicitly rather than pretending they succeeded.
- If queued writes are implemented, use an idempotent client-generated UUID and visible retry state.

## Testing and quality gates

- Unit tests for all accounting formulas, validation, formatting, and edge cases.
- Component tests for form submission, deletion confirmation, and dashboard updates.
- RLS tests using an authenticated user and a different user.
- Production build must pass TypeScript checking and linting.
- Manual QA on 320px mobile width, iPhone Safari, and MacBook browser.

## Deployment

Use a static host connected to the repository, configure the SPA fallback, add Supabase environment variables, and map the owner's domain/subdomain. Keep the free-tier database small and provide a CSV export before any destructive migration.
