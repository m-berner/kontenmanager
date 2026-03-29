# Domain Layer

This directory contains the core business logic, rules, and data structures of the application. In a Firefox
WebExtension, the **Domain Layer** serves as the "brain" of the extension, remaining independent of browser-specific
APIs (like `browser.storage` or `browser.tabs`), the UI framework (Vue/Vuetify), and persistence mechanisms (IndexedDB).

## Core Principles

- **Framework Independence**: Logic here should not depend on Vue or Pinia.
- **Mostly Side Effect Free**: Most functions are pure. A few utilities intentionally wrap browser primitives (see
  `utils/`).
- **Single Source of Truth**: All business rules (validations, calculations, data transformations) are defined here.

Type note: the project keeps `@/types` as a stable import path, but the underlying type definitions are split into
layer-focused modules under `src/domain/types/` (domain/infra/backup) and re-exported by `src/domain/types.d.ts`.

## Directory Structure

### `errors.ts`

Central error definitions and helpers:

- `ERROR_DEFINITIONS`: The canonical list of stable error codes (`CODE`) and English fallback messages (`MSG`).
- `appError(code, category, ...)`: Creates a typed `AppError` and resolves a human-readable message (WebExtension i18n
  `messages.json` is used when available, otherwise `ERROR_DEFINITIONS`).

Use `ERROR_DEFINITIONS.*.CODE` when throwing typed application errors. Avoid inventing new `"#xyz"` codes inline.

### `importExport/`

Handles the complexity of data portability:

- `validator.ts`: Pure functions for deep validation of backup files, ensuring data integrity and foreign key
  consistency before import.
- `transformer.ts`: Logic for migrating legacy data formats to the current schema.

### `mapping/`

Business rules for data conversion and transformation:

- `formMapper.ts`: Functions for mapping UI form data into database models (e.g., `mapBookingFormToDb`), ensuring that
  data is correctly structured before reaching the persistence layer.

### `utils/`

Pure helpers (parsing/formatting) and a thin `log(...)` wrapper used across the extension for structured console logs.

## Key domains

### `logic.ts` (`DomainLogic`)

A functional module encapsulating complex calculations and orchestration that don't belong in a single store:

- Financial aggregations (sums, taxes, fees) with high-precision arithmetic (e.g., `calculateTotalSum`).
- FIFO (First-In-First-Out) portfolio calculations.
- Timezone-aware date handling (e.g., `getBookingYear` using UTC).
- Multi-store initialization logic (`initializeRecords`).
- `STOCK_STORE_MEMORY`: Default in-memory fields for stock calculations. Merged into stock items during initialization
  to keep computed fields present and typed.
- Example (see also `DomainLogic.initializeRecords`):
  ```ts
  import * as DomainLogic from "@/domain/logic";
  // Ensure runtime-only fields exist on every stock
  const enriched = { ...stockFromDB, ...DomainLogic.STOCK_STORE_MEMORY };
  ```

### `validation/`

Centralized validation engine used by both the UI (for immediate feedback) and the Database layer (for data integrity).
All logic is implemented as pure, exported functions:

- `codes.ts`: Stable, language-agnostic validation codes (see also `src/domain/constants.ts`).
- `rules.ts`: Atomic validation logic (e.g., IBAN, ISIN, and SWIFT/BIC checksums and format rules).
- `validators.ts`: High-level validators for domain entities (Accounts, Bookings, Stocks).

## Testing

- Domain functions are intended to be pure to test with Vitest.
- Prefer covering edge cases (invalid dates, number formats, portfolio math).
- Error cases should throw `AppError` with stable codes from `ERROR_DEFINITIONS`; assert on `err.code` rather than
  localized messages.

## Why a Domain Layer in a WebExtension?

WebExtensions often face unique challenges like background script persistence, limited lifecycle, and frequent schema
migrations. By isolating the domain logic:

1. **Testability**: We can run high-coverage unit tests for critical financial logic without mocking the entire
   WebExtension environment.
2. **Maintenance**: If the underlying storage changes (e.g., from `browser.storage` to `IndexedDB`), the core business
   rules remain untouched.
3. **Consistency**: The same validation rules used in the popup dialogs are applied when importing a 10MB backup file in
   the options page.
