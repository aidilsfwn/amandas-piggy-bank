# Amanda's Piggy Bank — Implementation Plan

## Phase 1 — Foundation

- Scaffold React + Vite + TypeScript.
- Add shadcn/ui, Tailwind, routing, Supabase client, and PWA support.
- Configure environment variables and a production build.

## Phase 2 — Persistence and security

- Create `profiles`, `children`, and `savings_transactions` tables.
- Add constraints, indexes, timestamps, and RLS policies.
- Add a seed/bootstrap path that creates Amanda for the first owner.
- Verify that a second authenticated user cannot access the rows.

## Phase 3 — Domain logic

- Implement typed transaction models and form schemas.
- Implement pure summary calculation in sen.
- Add unit tests for normal, zero-data, equal-transfer, over-transfer, and dividend cases.

## Phase 4 — UI

- Build auth, dashboard, transaction form, history, edit, delete confirmation, and error states.
- Add type-specific dividend year/rate fields.
- Add accessible labels, keyboard support, large tap targets, and responsive layout.

## Phase 5 — PWA and export

- Add installable manifest, icons, shell caching, and online/offline indicators.
- Add CSV export if time permits; it is useful but not required for MVP acceptance.

## Phase 6 — Verification and release

- Run typecheck, lint, unit/component tests, and production build.
- Manually test on iPhone Safari and MacBook.
- Configure static hosting, Supabase redirect URLs, custom domain/subdomain, and backups/export.

## Definition of done

The acceptance criteria in `PRD.md` pass, formulas have automated tests, RLS is verified with two users, the app builds as a static deployment, and the owner can add an annual dividend and see all balances reconcile.
