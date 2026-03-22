# Services Layer

This directory contains the **Infrastructure and Orchestration** services of the application. The Services Layer is
responsible for interacting with external systems (IndexedDB, WebExtension APIs, External Web APIs) and coordinating the
flow of data between the [Domain Layer](../domains/README.md) and the application/UI layers.

Services are created per-extension-context:

- app/options: `src/adapters/secondary/services/container.ts` (full DI surface)
- background: `src/adapters/secondary/services/containerBackground.ts` (minimal surface to keep the background bundle small)

Services are exposed to runtime UI code via Vue DI (`provideServices` / `useServices` in
`src/adapters/secondary/services/context.ts`).

## Role and Responsibilities

The mission of the services layer is to:

- **Infrastructure Abstraction**: Provide a clean interface for complex technical APIs like IndexedDB or `fetch`.
- **Side effect Management**: Handle all asynchronous operations and external communications.
- **Orchestration**: Coordinate multistep operations that involve both domain logic and infrastructure (e.g.,
  application initialization or backup/restore).
- **Data Integrity**: Enforce data persistence rules and handle database migrations.

## Key Services

### 🗄️ `database/` (`databaseService`)

The core persistence engine based on IndexedDB, implemented as a functional module.

- **Modular Architecture**: Service functionality is split into specialized modules for connection, transactions, and
  repositories.
- **Repository Pattern**: Specialized functions create repositories for CRUD operations.
- **Transaction Management**: Orchestrates atomic operations and ensures data consistency.
- **Health & Maintenance**: Functional implementation of health checks and automated repair routines.
- **Batch Processing**: Supports high-performance bulk data operations.

Notes:

- Runtime code should not import a database singleton. Use DI (`useServices().databaseService`).
- Repositories are cached on the DI surface as `useServices().repositories` for consistent access.

### 🚀 `app.ts` (`appService`)

A functional module handling the application lifecycle and initialization.

- Orchestrates the startup sequence (storage → database → store hydration).
- Manages the initial fetch of market data (exchanges, indexes, materials).

### 🌐 `fetch.ts` (`fetchService`)

Thin orchestrator for all external network requests. Provider-specific scraping logic lives in `fetch/providers/`.

- **Providers** (`fetch/providers/`): One file per data source (`ard`, `acheck`, `fnet`, `goyax`, `tgate`, `wstreet`).
  Each exports a single fetcher function that scrapes and normalizes quote data (rate, min, max, currency) for that
  portal.
- **HTTP utilities** (`fetch/http.ts`): `fetchWithRetry` (timeout + exponential backoff), `fetchWithCache`,
  `fetchTextWithCacheFollowRedirect`, `parseHTML`.
- **Cache** (`fetch/cache.ts`): In-memory TTL cache shared across all providers.
- **Shared helpers** (`fetch/shared.ts`): Constants (`DEFAULT_VALUE`, `DEFAULT_CURRENCY`) and pure helpers (
  `detectCurrency`, `parseCurrency`, `calculateMidQuote`, `createDefaultStockData`) used across providers.

### 🖼️ `faviconService.ts` (`faviconService`)

Functional utility for generating and fetching favicon URLs.

- Supports multiple providers (Google S2, DuckDuckGo) with a built-in fallback chain.
- Ensures consistent UI representation for accounts and companies.

### 🧩 `browserService.ts` (`browserService`)

Thin wrapper around the WebExtension APIs (`tabs`, `downloads`, `notifications`, `i18n`, etc.) used by UI and services.

### ⚙️ `taskService.ts` (`taskService`)

Functional utility for managing asynchronous operations.

- **Retry Logic**: Implements robust retry-with-backoff for operations that may fail transiently.
- **Connection Guards**: Provides standardized checks for database connectivity.

### 🔔 `alert.ts` (`alertService`)

Centralized functional alert orchestration.

- Normalizes unknown errors into user-facing strings.
- Applies consistent defaults (duration, confirm options).
- Adds rate limiting for duplicate messages.
- Logs structured technical context while delegating rendering to the alerts store.

### 📂 `importExport.ts` (`importExportService`)

Functional bridge for data portability.

- Handles File I/O for JSON backups.
- Orchestrates the validation and transformation of imported data using functional domain helpers.

`importExportService` is created via `createImportExportService()` and provided via the DI container (it is not a
global singleton).

### ⚖️ `validation.ts` (`validationService`)

A functional bridge service that translates domain validation rules into a format compatible with Vuetify forms,
including internationalized error messages.

### 💾 `storageAdapter.ts` (`storageAdapter`)

Service wrapper around `browser.storage.local` that provides a typed API, default installation, and consistent error
handling.

## Directory Structure

- `database/`: Contains database-specific modules, migration logic, and repository factories.
    - `connection/`: Connection lifecycle management.
    - `transaction/`: Transaction orchestration logic.
    - `repositories/`: Specialized repositories for each entity type.
    - `migrator.ts`: Database schema versioning and migration logic.
- `fetch/`: Network I/O layer.
    - `providers/`: One file per data source (`ard`, `acheck`, `fnet`, `goyax`, `tgate`, `wstreet`).
    - `http.ts`: HTTP utilities (`fetchWithRetry`, `fetchWithCache`, `fetchTextWithCacheFollowRedirect`, `parseHTML`).
    - `cache.ts`: In-memory TTL cache shared across all providers.
    - `shared.ts`: Shared constants and pure helpers used across providers.
- `*.ts`: Individual service implementations.
- `*.test.ts`: Integration and unit tests for services.

## Development Principles

1. **No Business Rules**: Pure logic belongs in the `domain`. Services should only "do" things, not "decide" business
   outcomes.
2. **Asynchronicity**: Most service methods return `Promises`. Always handle errors using the centralized `AppError`
   structure.
3. **Factories + Modules**: Services are implemented as factories (preferred when stateful) or stateless functional
   modules and then wired through the DI container.
4. **Fail Gracefully**: Infrastructure operations (especially network requests) must handle failures without crashing
   the UI, providing meaningful feedback via the `alerts` system.

## Testing

- Prefer integration-style unit tests that mock network/DB boundaries.
- Stub IndexedDB and `browser.*` APIs in Vitest where needed.
- Assert that services translate technical failures into `AppError` instances with stable error codes.
