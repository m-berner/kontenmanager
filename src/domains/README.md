# Domain Layer

This directory contains the core business logic, rules, and data structures of the application. In a Firefox
WebExtension, the **Domain Layer** serves as the "brain" of the extension, remaining independent of browser-specific
APIs (like `browser.storage` or `browser.tabs`), the UI framework (Vue/Vuetify), and persistence mechanisms (IndexedDB).

## Core Principles

- **Framework Independence**: Logic here should not depend on Vue or Pinia.
- **Side-Effect Free**: Most functions in this layer are pure, making them easy to test and reason about.
- **Single Source of Truth**: All business rules (validations, calculations, data transformations) are defined here.

## Directory Structure

### `configs/`

Domain-scoped constants used by the business logic. These values are framework-agnostic and immutable
to guarantee predictable behavior across the app. Current modules:

- `date.ts` — `DATE`
- `storage.ts` — `BROWSER_STORAGE`
- `currencies.ts` — `CURRENCIES`

### `importExport/`

Handles the complexity of data portability:

- `validator.ts`: Pure functions for deep validation of backup files, ensuring data integrity and foreign key
  consistency before import.
- `transformer.ts`: Logic for migrating legacy data formats to the current schema.

### `validation/`

Centralized validation engine used by both the UI (for immediate feedback) and the Database layer (for data integrity):

- `codes.ts`: Stable, language-agnostic `VALIDATION_CODES`.
- `rules.ts`: Atomic validation logic (e.g., IBAN/ISIN checksums, required fields).
- `validators.ts`: High-level validators for domain entities (Accounts, Bookings, Stocks).

## Key Components

### `logic.ts` (`DomainLogic`)

Encapsulates complex calculations and orchestration that don't belong in a single store:

- Financial aggregations (sums, taxes, fees).
- FIFO (First-In-First-Out) portfolio calculations.
- Multi-store initialization logic.
- `STOCK_STORE_MEMORY`: Default in-memory fields for stock calculations. Merged into stock items during initialization
  to keep computed fields present and typed.
    - Keys (excerpt): `mPortfolio`, `mInvest`, `mChange`, `mBuyValue`, `mEuroChange`, `mMin`, `mMax`,
      `mValue`, `mDividendYielda`, `mDividendYeara`, `mDividendYieldb`, `mDividendYearb`,
      `mRealDividend`, `mRealBuyValue`, `mDeleteable`.
    - Example (see also `DomainLogic.initializeRecords`):
      ```ts
      import { STOCK_STORE_MEMORY } from "@/domains/logic";
      // Ensure runtime-only fields exist on every stock
      const enriched = { ...stockFromDB, ...STOCK_STORE_MEMORY };
      ```

### `errors.ts` (`AppError`)

Defines the standardized error structure used throughout the application, facilitating consistent error handling and
localized user feedback.

### `utils.ts` (`DomainUtils`)

General-purpose business utilities, such as date normalization and logging wrappers, that are used across multiple
domain boundaries.

- Notable normalization: `normalizeBookingTypeName` trims and collapses whitespace to ensure
  duplicate detection is stable and case-insensitive across the app.

## Testing

- Domain functions are intended to be pure and easy to test with Vitest.
- Prefer covering edge cases (invalid dates, number formats, portfolio math).
- Error cases should throw `AppError` with stable codes from `ERROR_CODES`; assert on the code rather than message.

## Why a Domain Layer in a WebExtension?

WebExtensions often face unique challenges like background script persistence, limited lifecycle, and frequent schema
migrations. By isolating the domain logic:

1. **Testability**: We can run high-coverage unit tests for critical financial logic without mocking the entire
   WebExtension environment.
2. **Maintenance**: If the underlying storage changes (e.g., from `browser.storage` to `IndexedDB`), the core business
   rules remain untouched.
3. **Consistency**: The same validation rules used in the popup dialogs are applied when importing a 10MB backup file in
   the options page.
