# Test Helpers (`tests/unit/support`)

This folder contains small helpers used by unit tests.

## Pinia Test Setup

[`pinia.ts`](./pinia.ts) provides `setActiveTestPinia()`:

- creates a fresh Pinia instance
- wires default store dependencies via `attachStoreDeps(...)`
- sets the Pinia instance as active for the test

Tests can override injected deps by calling `attachStoreDeps(pinia, overrides)` again after `setActiveTestPinia()`.

## Usecase Test Helpers

[`usecases.ts`](./usecases.ts) provides:

- small factories for `AccountDb` / `BookingDb` / `StockDb` / `BookingTypeDb`
- typed mocks for usecase ports (`RecordsPort`, `RepositoriesPort`, `RuntimePort`, etc.)

## Running Tests

From the repo root:

- `npm run test:logic` (Vitest)
- `npm run test:typescript` (vue-tsc, no emit)
