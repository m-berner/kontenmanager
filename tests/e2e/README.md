# E2E (`tests/e2e/`)

Playwright end-to-end tests, run against a built extension served over plain HTTP with a stubbed `browser.*` API
(Firefox only). See `tests/README.md`'s "E2E Tests" section for the full picture — what's tested and why, the test
harness, fixtures, debugging tips, and the "app boot must never touch the real network" rule. This file covers only
what's specific to this folder.

## Spec Files

- `background-smoke.spec.ts`: background script registers listeners and initializes storage defaults.
- `happy-path.spec.ts`: import a backup and view Company content; add a company by ISIN.
- `dialog-actions.spec.ts`: HeaderBar dialog actions against an imported fixture (add/update/delete account,
  switch account, add/update/delete booking type, add/update/delete booking, search bookings, update/delete
  stock, show dividend, export database, show accounting, fade-in-stock, manual quote refresh, depot-sum chip,
  the `Ctrl+Alt+R` storage-reset shortcut, Help/Privacy footer navigation, opening the options page). By far the
  largest spec file — most new coverage belongs here unless it needs its own fixture or boot sequence.
- `options-page.spec.ts`: the standalone Options page — theme selection, market data provider selection, and the
  Markets/Indexes tabs.

## Subfolders

- `support/`: shared test harness — see `support/README.md`.
- `fixtures/`: static backup JSON imported at the start of most specs (`backup.modern.min.json`, one account, one
  booking type "BUY", one stock AAPL, one booking). No README of its own — it's a single data file, and its shape
  and consumers are already documented in `tests/README.md` and in `support/README.md`'s
  `bootWithFixtureImported` entry.

## Directory Structure

### Directories

- `fixtures/`
- `support/`

### Files

- `background-smoke.spec.ts`
- `dialog-actions.spec.ts`
- `happy-path.spec.ts`
- `options-page.spec.ts`
