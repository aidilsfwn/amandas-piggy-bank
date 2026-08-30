# Amanda's Piggy Bank — Design System ("Soft Ledger")

A warm, pastel, mobile-first design system for a savings ledger app, inspired by playful kids'-banking references (Bank Raya Uang Saku, pastel piggy-bank goal trackers) while staying legible and trustworthy enough for real money tracking.

## Color Palette

| Token | Value | Usage |
|---|---|---|
| `bg-base` | `#F7F5FB` | App background (soft lavender-white, not pure white) |
| `bg-surface` | `#FFFFFF` | Cards, panels |
| `border-default` | `#ECE7F6` | 1px borders / dividers, very light |
| `accent-primary` | `#8B6FE8` | Primary actions, hero balance card, nav highlights (soft purple) |
| `accent-pink` | `#F5A8C4` | Gift transactions, playful highlights |
| `accent-mint` | `#7FD9B9` | Positive/completed states, SSPN dividend |
| `accent-blue` | `#6FB3E8` | SSPN transfer, informational |
| `text-primary` | `#2E2B3D` | Main text (soft near-black, not pure black) |
| `text-secondary` | `#8B879B` | Muted/secondary text |
| `alert` | `#E8746F` | Errors, over-transfer validation warnings |

**Rule:** Pastel palette throughout — no dark/industrial surfaces. Each transaction type gets its own soft accent color (pink = gift, blue = SSPN transfer, mint = SSPN dividend) used consistently as icon backgrounds and small tags, never as full-screen backgrounds.

## Typography

- Font family: a rounded, friendly sans-serif (e.g. Quicksand, Nunito, or Baloo 2 for headings; a plain rounded sans like Inter or DM Sans for body/numbers to keep amounts legible)
- Weights: Regular (400), Semibold (600), Bold (700) for hero numbers
- Fixed scale (px): `12 / 14 / 16 / 20 / 28 / 40`
- Money amounts: bold weight, tabular-nums, no dot-matrix/instrument styling — this is a warm ledger, not a dashboard readout

## Spacing

4px base unit: `4 / 8 / 12 / 16 / 24 / 32 / 48`. Generous padding inside cards (16–24px) — the reference apps read as "soft and roomy," not dense.

## Components

- Corner radius: large and consistent — 16–24px on cards, 12px on buttons/pills. Rounded is *correct* here, unlike a utility dashboard.
- Soft drop shadows are fine on cards (unlike ADV Log) — subtle, diffuse, low-opacity (e.g. `0 4px 16px rgba(139,111,232,0.08)`), never harsh
- Hero balance card: large, top of dashboard, `accent-primary` background or a soft gradient (`accent-primary` → a lighter purple), big bold total balance number, small subtitle underneath
- Transaction list: each row has a small rounded icon-in-circle (colored by type: pink/blue/mint per the palette), transaction label, date, amount (green for credit, muted/red for debit)
- Buttons: solid `accent-primary` fill, fully rounded (pill-shaped) for primary actions; soft-tinted background (e.g. `accent-primary` at 10% opacity) for secondary actions — no outlined/ghost style, it reads too utilitarian for this app
- Empty states: friendly, centered, with a simple piggy-bank illustration/icon and warm copy (this is one context where centered + illustrated is right, unlike a utility app)

## Illustration & Iconography

- A simple piggy-bank motif (line-art or soft-filled icon) as a recurring visual anchor — app icon, empty states, maybe a small mascot accent near the balance card
- Icons: rounded, filled or duotone style (not thin outline) to match the soft/friendly tone — Lucide's "filled" variants or Phosphor Icons "duotone" work well
- Avoid photographic imagery or complex character illustration (the Uang Saku reference uses a full mascot character — nice for a big marketing splash, but overkill/inconsistent effort for in-app UI; keep it to a simple icon-level piggy motif instead)

## Motion

Keep it warm and bouncy rather than sharp/instant — this is the opposite feel from ADV Log's snappy industrial motion.

- Adding a transaction: the amount briefly "pops" (scale 1 → 1.08 → 1) with a light spring, and the hero balance number animates counting up/down to the new total
- Balance card: gentle spring-based entrance on load (slight scale + fade), ~300–400ms
- Buttons: `whileTap={{ scale: 0.95 }}` with a spring, slightly bouncier than a flat utility app
- Optional delight moment: small confetti or coin-drop micro-animation when a savings milestone is hit (e.g. crossing a round-number balance) — use sparingly, not on every transaction

```jsx
// Example: animated balance counter with a soft spring
import { motion, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";

function BalanceNumber({ value }) {
  const spring = useSpring(0, { stiffness: 80, damping: 15 });
  const display = useTransform(spring, (v) =>
    Math.round(v).toLocaleString()
  );

  useEffect(() => { spring.set(value); }, [value]);

  return <motion.span className="tabular-nums font-bold">{display}</motion.span>;
}
```

```jsx
// Example: transaction row entrance
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.25, ease: "easeOut" }}
>
  {/* transaction row content */}
</motion.div>
```

## Avoid List

- Dark/industrial surfaces or instrument-panel styling (that's ADV Log's language, not this app's)
- Sharp corners, hard borders-only cards (soft shadows are welcome here)
- Thin outline icons that read cold/technical
- Cluttered dashboards — the references stay to 1–2 focal elements per screen (hero balance, then a clean list) rather than many small stat cards competing for attention
- Overly saturated/neon colors — keep the palette pastel and soft throughout
