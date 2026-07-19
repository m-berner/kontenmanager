# Tests

Automated tests live under `tests/`:

- `tests/unit`: unit tests executed by Vitest (runs in `happy-dom`).
- `tests/e2e`: Playwright E2E tests executed in Firefox.

## Commands

- `npm run test:logic`: run unit tests (Vitest).
- `npm run test:typescript`: typecheck (vue-tsc).
- `npm run lint`: lint `src/` (ESLint).
- `npm run test:e2e`: build (`build:dev`), run the main parallel Playwright suite, then run `happy-path.spec.ts`
  by itself (see below for why).
- `npm run test:e2e:happy-path`: build, then run only `happy-path.spec.ts`, in isolation.

## Unit Tests (`tests/unit`)

Unit tests are located in `tests/unit/**.test.ts` and follow the hexagonal architecture of `src/`:

```
tests/unit/
├── adapters/
│   ├── ui/
│   │   ├── components/dialogs/   – Vue dialog component tests
│   │   ├── composables/          – composable tests
│   │   └── stores/               – Pinia store tests
│   └── driven/
│       └── database/             – database adapter tests (batch, repositories)
├── app/
│   └── usecases/                 – use case tests
├── domain/                       – pure domain logic tests
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
- Each test boots its own Firefox instance and static HTTP server (`playwright.config.js` sets
  `fullyParallel: true`). Under heavy parallel load in resource-constrained environments, app boot's async
  connectivity check can occasionally miss the header-visibility timeout in `bootWithFixtureImported`
  (`support/harness.ts`) — a re-run or a lower `--workers` count resolves it; it is not a product regression.
- Leftover `firefox.exe` processes from earlier interrupted/killed runs can starve a later run of CPU/memory and
  cause the same kind of timeout on an otherwise-passing test. If a test that normally passes suddenly times out
  on app boot, check for and kill orphaned `firefox.exe` processes before assuming it's a real regression.

### Why `happy-path.spec.ts` runs in its own config

`happy-path.spec.ts` hits the same async-connectivity-check timing sensitivity described above harder than the
other specs (it waits on `header.v-app-bar` becoming visible within a fixed 30s, with no retry). Rather than
loosen that timeout for everyone or cap `fullyParallel` globally, `playwright.config.js` excludes this file via
`testIgnore` and `playwright.happy-path.config.js` runs it alone with `workers: 1`. `npm run test:e2e` runs both
configs in sequence, so full coverage is still one command; `npm run test:e2e:happy-path` targets just this file
when you only need to iterate on it.

## Directory Structure

### Directories

- `e2e/`
- `unit/`

