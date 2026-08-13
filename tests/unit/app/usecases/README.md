# Usecases (`tests/unit/app/usecases/`)

Unit tests for `src/app/usecases/` — the application-layer workflows called by dialogs/views (see
`src/app/usecases/README.md` for the layer's principles, ports, and workflow documentation). One
test file per usecase module (`accounts.ts`, `bookings.ts`, `bookingTypes.ts`, `stocks.ts`), plus
`portAdapters.test.ts` for the Pinia-store-to-port adapter functions. `backup.test.ts` covers the
pure helper functions re-exported from `backup.ts` itself; the import/export usecases and their own
helpers have their own test files under `backup/` (mirroring `src/app/usecases/backup/`). `ports.ts`
has no dedicated test file — it's interfaces only, exercised indirectly through every other test here.

## Directory Structure

### Directories

- `backup/`
- `records/`

### Files

- `accounts.test.ts`
- `backup.test.ts`
- `bookingTypes.test.ts`
- `bookings.test.ts`
- `portAdapters.test.ts`
- `stocks.test.ts`
