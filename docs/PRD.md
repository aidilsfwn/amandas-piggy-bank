# Amanda's Piggy Bank — Product Requirements Document

## Product summary

Amanda's Piggy Bank is a private, single-user web app for recording money received for Amanda, money transferred into SSPN, and annual SSPN dividends. It shows where Amanda's money is currently held and the total amount belonging to her.

The app is designed for one owner using an iPhone Safari most of the time, with occasional MacBook use. Data must sync across devices.

## Goals

- Record gifts received for Amanda.
- Record transfers from the owner's holding account into SSPN.
- Record SSPN dividends when PTPTN credits them annually.
- Derive total savings, amount still held by the owner, SSPN balance, contributions, and dividends.
- Make annual dividend entry simple and auditable.
- Work well on a small screen and remain usable offline for previously loaded data.

## MVP scope

- Single authenticated owner.
- One child/profile: Amanda.
- Transaction list with create, edit, delete, and date/amount/type/notes.
- Transaction types: `Gift Received`, `SSPN Transfer`, `SSPN Dividend`.
- Optional dividend year and rate fields.
- Dashboard with derived balances and a simple transaction history.
- Basic validation, confirmation for deletion, and sync status.
- Responsive mobile-first PWA install experience.

## Accounting rules

All amounts are Malaysian Ringgit (RM), stored as integer sen.

```text
Total belonging to Amanda = gifts received + SSPN dividends
Held by me = gifts received - SSPN transfers
SSPN balance = SSPN transfers + SSPN dividends
Total = Held by me + SSPN balance
```

An SSPN transfer changes location, not Amanda's total. A dividend increases Amanda's total and the SSPN balance.

## Non-goals

- Multiple users, shared family access, or roles.
- Multiple children in the MVP.
- Bank, SSPN, or PTPTN API integration.
- Automatic dividend prediction or daily/monthly dividend accrual.
- Investment advice, budgeting, or tax reporting.
- Native iOS/Android apps.
- Custom backend services, complex event sourcing, or financial-accounting features.

## Primary user flows

1. Owner opens the dashboard and sees current derived balances.
2. Owner adds a gift with amount and date.
3. Owner transfers some money to SSPN and records the transfer.
4. PTPTN credits the annual dividend; owner adds one `SSPN Dividend` transaction with the credited amount and optional year/rate.
5. Owner reviews the history and edits or removes an incorrect entry.

## Acceptance criteria

- A signed-in owner can add, edit, and delete all three transaction types.
- Amounts reject zero, negative, malformed, or more-than-two-decimal values.
- A transfer cannot make `Held by me` negative unless an explicit future adjustment feature is added; the MVP must show a clear validation message.
- Dashboard totals exactly match the accounting rules above and update immediately after mutation.
- Gift, transfer, and dividend subtotals are visible or recoverable from the dashboard.
- Dividend entry supports a credited date and optional calendar year/rate; no estimated accrual is shown.
- The same account sees the same data on iPhone Safari and MacBook after refresh/login.
- Unauthorized users cannot read or mutate the owner's rows.
- Delete requires confirmation and recalculates all derived values.
- The app remains legible and operable at 320px viewport width.
- A fresh deployment can be configured with free-tier services and no custom API server.

## Success indicators

- Adding the annual dividend takes less than one minute.
- The owner can reconcile `Total = Held by me + SSPN balance` at a glance.
- No balance is manually duplicated or stored as an editable value.
