# Domain Layer

This directory contains the core business logic, rules, and data structures of the application. In a Firefox
WebExtension, the **Domain Layer** serves as the "brain" of the extension, remaining independent of browser-specific
APIs (like `browser.storage` or `browser.tabs`), the UI framework (Vue/Vuetify), and persistence mechanisms (IndexedDB).

## Core Principles

- **Framework Independence**: Logic here should not depend on Vue or Pinia.
- **Mostly Side Effect Free**: Most functions are pure. A few utilities intentionally wrap browser primitives (see
  `utils/`).
- **Single Source of Truth**: All business rules (validations, calculations, data transformations) are defined here.

Type note: the project keeps `@/domain/types` as a stable import path, but the underlying type definitions are split into
layer-focused modules under `src/domain/types/` (domain/adapter/backup/ui) and re-exported by `src/domain/types.d.ts`.

## Directory Structure

### Directories

- `constants/`
- `importExport/`
- `mapping/`
- `types/`
- `utils/`
- `validation/`

### Files

- `constants.ts`
- `errors.ts`: ERROR_DEFINITIONS, ErrorCodes, Messages, appError, isAppError, ...
- `logic.ts`: aggregateBookingsPerType, calculateInvestByStockId, calculatePortfolioByStockId, calculateSumAllFees, calculateSumAllTaxes, ...
- `types.d.ts`

