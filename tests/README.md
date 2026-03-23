# Tests

Automated tests live under `tests/`:

- `tests/unit`: unit tests executed by Vitest (runs in `happy-dom`).
- `tests/e2e`: Playwright E2E tests executed in Firefox.

## Commands

- `npm run test:logic`: run unit tests (Vitest).
- `npm run test:typescript`: typecheck (vue-tsc).
- `npm run lint`: lint `src/` (ESLint).
- `npm run test:e2e`: build (`build:dev`) and run Playwright E2E tests.

## Unit Tests (`tests/unit`)

Unit tests are located in `tests/unit/**.test.ts` and follow the hexagonal architecture of `src/`:

```
tests/unit/
├── adapters/
│   ├── primary/
│   │   ├── components/dialogs/   – Vue dialog component tests
│   │   ├── composables/          – composable tests
│   │   └── stores/               – Pinia store tests
│   └── secondary/
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

This gives reliable, fast regression coverage for:

- UI happy path flows in `entrypoints/app.html`
- background wiring logic in `entrypoints/background.html`

It is not a full "installed extension" test (no `moz-extension://` origin, no real permissions), but it catches
most UI and wiring regressions in a deterministic way.

### Fixtures

- `tests/e2e/fixtures/backup.modern.min.json`: minimal modern backup used by the happy path test.

### Debugging Tips

- Run headed: `npm run test:e2e:headed`
- Run UI mode: `npm run test:e2e:ui`
- On failure, Playwright keeps trace/video/screenshot artifacts (see `test-results/`).
