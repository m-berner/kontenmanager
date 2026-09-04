# Tests

Automated tests live under `tests/`:

- `tests/unit`: unit tests executed by Vitest (runs in `happy-dom`).
- `tests/e2e`: Playwright E2E tests executed in Firefox.

## Commands

- `npm run test:unit`: run unit tests (Vitest).
- `npm run test:typescript`: typecheck (vue-tsc).
- `npm run lint`: lint `src/` (ESLint).
- `npm run test:e2e`: build (`build:dev`), then run the full Playwright suite (one config, all specs).
- `npm run test:e2e:headed` / `npm run test:e2e:ui`: run the suite headed / in Playwright UI mode against the
  existing build (no rebuild).

To run a single spec, filter by path against the existing build, e.g.
`npx playwright test tests/e2e/happy-path.spec.ts`.

## Unit Tests (`tests/unit`)

Unit tests are located in `tests/unit/**.test.ts` and follow the hexagonal architecture of `src/`:

```
tests/unit/
├── adapters/
│   ├── ui/
│   │   ├── components/dialogs/   – Vue dialog component tests
│   │   ├── composables/          – composable tests
│   │   ├── entrypoints/          – entrypoint helper tests (e.g. singleTabGuard)
│   │   └── stores/               – Pinia store tests
│   └── driven/
│       ├── database/             – database adapter tests (batch, repositories)
│       └── fetch/                – fetch/provider adapter tests (HTTP cache, provider utils)
├── app/
│   └── usecases/                 – use case tests
├── domain/                       – pure domain logic tests
│   ├── constants/
│   ├── importExport/
│   ├── mapping/
│   ├── utils/
│   └── validation/
├── support/                      – shared test helpers
├── architecture.test.ts
└── backupImportRefresh.test.ts
```

### Test Helpers

Helpers used by unit tests live in `tests/unit/support` and are imported via the `@test/*` alias:

- `@test/pinia`
- `@test/usecases`

`@test/*` is intentionally **test-only**. ESLint disallows importing `@test/*` from `src/**`.

## E2E Tests (`tests/e2e`)

E2E tests are in `tests/e2e/*.spec.ts` and run with Playwright in Firefox.

### What We Test

This repository is a Firefox WebExtension. Playwright runs the built UI pages (served via a small static HTTP server)
and injects a minimal `browser.*` stub into the page context so the app can run like a normal web page.

- `background-smoke.spec.ts`: background script registers listeners and initializes storage defaults.
- `happy-path.spec.ts`: import a backup and view Company content; add a company by ISIN.
- `dialog-actions.spec.ts`: HeaderBar dialog actions against an imported fixture — add/update/delete account,
  switch account via the TitleBar select, add/update/delete booking type, add/update/delete booking, search
  bookings, update/delete stock, show dividend (empty state), export database, show accounting, fade-in-stock
  (empty state), manual quote refresh, the depot-sum chip, the `Ctrl+Alt+R` storage-reset shortcut, Help/Privacy
  footer navigation, and opening the settings (options) page.
- `options-page.spec.ts`: the standalone Options page — theme selection, market data provider selection, and
  the Markets/Indexes tabs (add/remove a stock exchange, toggle an index checkbox).

This gives reliable, fast regression coverage for:

- UI happy path flows in `entrypoints/app.html`
- background wiring logic in `entrypoints/background.html`

It is not a full "installed extension" test (no `moz-extension://` origin, no real permissions), but it catches
most UI and wiring regressions in a deterministic way.

### Test Harness (`tests/e2e/support/harness.ts`)

Shared setup used by every spec file, imported via relative path (`./support/harness`):

- `startStaticServer(rootDir)`: serves a built extension folder over plain HTTP.
- `stubBrowser()`: minimal `browser.*` stub (storage, downloads, tabs, i18n, …), passed to `page.addInitScript`.
- `bootWithFixtureImported(page, repoRoot, baseUrl)`: boots the app, imports `fixtures/backup.modern.min.json`,
  sets the imported account active with `sService: "none"` (no real network calls), and leaves the app on the
  Home view with alert overlays dismissed. Used by every `dialog-actions.spec.ts` test.
- `closeAllAlerts(page)` / `waitForDialogsClosed(page)`: dismiss Vuetify alert overlays / wait for dialogs to close.
- `readStore(page, storeName)`: reads all rows of an IndexedDB object store directly, to assert on persisted state
  without depending on UI rendering.

### Fixtures

- `tests/e2e/fixtures/backup.modern.min.json`: minimal modern backup (one account, one booking type "BUY", one
  stock AAPL, one booking) imported by `bootWithFixtureImported` and used across all `dialog-actions.spec.ts`
  tests, and directly by `happy-path.spec.ts`.

### Debugging Tips

- Run headed: `npm run test:e2e:headed`
- Run UI mode: `npm run test:e2e:ui`
- On failure, Playwright keeps trace/video/screenshot artifacts (see `test-results/`).
- Each test boots its own Firefox instance and static HTTP server. `playwright.config.js` sets
  `fullyParallel: true` / unlimited workers for the default headless run, but serializes to
  `fullyParallel: false` / `workers: 1` when `--headed` is passed (see below). If app boot ever misses
  the header-visibility timeout, first check that the test called `blockExternalRequests` before
  `page.goto` (see below) — that, not worker count, was the cause every previous time.
- Leftover `firefox.exe` processes from earlier interrupted/killed runs can starve a later run of CPU/memory and
  cause the same kind of timeout on an otherwise-passing test. If a test that normally passes suddenly times out
  on app boot, check for and kill orphaned `firefox.exe` processes before assuming it's a real regression.
- `npm run test:e2e:headed` runs real, visible Firefox windows, which fight each other for OS
  foreground focus if run in parallel — background windows get input/rendering throttled by
  Windows, so synthetic clicks silently never land. `playwright.config.js` detects `--headed` and
  forces `workers: 1` / `fullyParallel: false` plus `retries: 1` (a single serialized window can
  still occasionally lack real OS focus, e.g. if the terminal/IDE holds it instead). Headless runs
  (`test:e2e`, CI) stay at `retries: 0` with full parallelism.

### App boot must never touch the real network

`blockExternalRequests(page, baseUrl)` (`support/harness.ts`) aborts every request not served by the local
static server, and **must be called before `page.goto`** in any test that boots the app.

This is not just about speed. App boot's Phase 3 (`fetchExchangesData` / `fetchIndexData` /
`fetchMaterialData`) hits real external sites unconditionally — none of the three consults `sService` (the
stock-quote provider setting; `fetchIndexData`/`fetchMaterialData` have their own, `sMarketDataService`, which
defaults to finanzen.net and has no `"none"` option either), so setting `sService` to `"none"` does not suppress
them, and tests only set it *after* boot anyway. `AppIndex.vue`
renders the header bars behind `v-if="isInitialized"`, which flips only once `initializeApp` has awaited that
phase. Without the block, time-to-header is real network latency and every `header.v-app-bar` wait is
effectively an internet-connectivity test.

`happy-path.spec.ts` used to live in its own `playwright.happy-path.config.js` with `workers: 1` because of
this: it failed only when run after the main suite, which was misattributed to browser-launch contention. It
was the network dependency. With the block in place the separate config was unnecessary and has been removed —
all specs now run under `playwright.config.js`.

## Directory Structure

### Directories

- `e2e/`
- `unit/`

