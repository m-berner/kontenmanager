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

### `mapping/`

Business rules for data conversion and transformation:

- `formMapper.ts`: Functions for mapping UI form data into database models (e.g., `mapBookingFormToDb`), ensuring that data is correctly structured before reaching the persistence layer.

## Key Components

### `logic.ts` (`DomainLogic`)

A functional module encapsulating complex calculations and orchestration that don't belong in a single store:

- Financial aggregations (sums, taxes, fees).
- FIFO (First-In-First-Out) portfolio calculations.
- Multi-store initialization logic.
- `STOCK_STORE_MEMORY`: Default in-memory fields for stock calculations. Merged into stock items during initialization
  to keep computed fields present and typed.
- Example (see also `DomainLogic.initializeRecords`):
  ```ts
  import * as DomainLogic from "@/domains/logic";
  // Ensure runtime-only fields exist on every stock
  const enriched = { ...stockFromDB, ...DomainLogic.STOCK_STORE_MEMORY };
  ```

### `errors.ts` (`AppError`)

Defines a factory function and interface for a standardized error structure used throughout the application,
facilitating consistent error handling and localized user feedback. Includes a type guard `isAppError`.

### `validation/`

Centralized validation engine used by both the UI (for immediate feedback) and the Database layer (for data integrity).
All logic is implemented as pure, exported functions:

- `codes.ts`: Stable, language-agnostic `VALIDATION_CODES`.
- `rules.ts`: Atomic validation logic (e.g., IBAN/ISIN checksums, required fields).
- `validators.ts`: High-level validators for domain entities (Accounts, Bookings, Stocks).

### `utils/`

Domain-specific utilities, including pure functions for complex data manipulation:

- `url.ts`: Pure functions for parsing and normalizing URLs (e.g., extracting subdomains, protocols, and hostnames).
- `utils.ts` (`DomainUtils`): General-purpose business utilities, such as date normalization and logging wrappers,
  implemented as a functional module.

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
