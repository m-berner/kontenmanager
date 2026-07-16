# Secondary Adapters Layer (`src/adapters/driven/`)

This directory contains the **infrastructure adapters** of the application. The secondary adapters layer is
responsible for interacting with external systems (IndexedDB, WebExtension APIs, external web APIs) and coordinating the
flow of data between the [Domain Layer](../../domain/README.md) and the application/UI layers.

Adapters are created per-extension-context:

- app/options: `src/adapters/container.ts` (full DI surface)
- background: `src/adapters/containerBackground.ts` (minimal surface to keep the background bundle small)

Adapters are exposed to runtime UI code via Vue DI (`provideAdapters` / `useAdapters` in
`src/adapters/context.ts`).

## Role and Responsibilities

The mission of the secondary adapters layer is to:

- **Infrastructure Abstraction**: Provide a clean interface for complex technical APIs like IndexedDB or `fetch`.
- **Side Effect Management**: Handle all asynchronous operations and external communications.
- **Orchestration**: Coordinate multistep operations that involve both domain logic and infrastructure (e.g.,
  application initialization or backup/restore).
- **Data Integrity**: Enforce data persistence rules and handle database migrations.

## Key Adapters

### 🗄️ `database/` (`databaseAdapter`)

The core persistence engine based on IndexedDB, implemented as a functional module.

- **Modular Architecture**: Adapter functionality is split into specialized modules for connection, transactions, and
  repositories.
- **Repository Pattern**: Specialized functions create repositories for CRUD operations.
- **Transaction Management**: Orchestrates atomic operations and ensures data consistency.
- **Health & Maintenance**: Functional implementation of health checks and automated repair routines.
- **Batch Processing**: Supports high-performance bulk data operations.

Notes:

- Runtime code should not import a database singleton. Use DI (`useAdapters().databaseAdapter`).
- Repositories are cached on the DI surface as `useAdapters().repositories` for consistent access.

### 🚀 `appAdapter.ts` (`appAdapter`)

A functional module handling the application lifecycle and initialization.

- Orchestrates the startup sequence (storage → database → store hydration).
- Manages the initial fetch of market data (exchanges, indexes, materials).

### 🌐 `fetchAdapter.ts` (`fetchAdapter`)

Thin orchestrator for all external network requests. Provider-specific scraping logic lives in `fetch/providers/`.

- **Providers** (`fetch/providers/`): One file per data source (`ard`, `acheck`, `fnet`, `goyax`, `tgate`, `wstreet`).
  Each exports a single fetcher function that scrapes and normalizes quote data (rate, min, max, currency) for that
  portal.
- **HTTP utilities** (`fetch/httpClient.ts`): `fetchWithRetry` (timeout + exponential backoff), `fetchWithCache`,
  `fetchTextWithCacheFollowRedirect`, `parseHTML`.
- **Cache** (`fetch/httpCache.ts`): In-memory TTL cache shared across all providers.
- **Shared helpers** (`fetch/providerUtils.ts`): Constants (`DEFAULT_VALUE`, `DEFAULT_CURRENCY`) and pure helpers (
  `detectCurrency`, `parseCurrency`, `calculateMidQuote`, `createDefaultStockData`) used across providers.

### 🖼️ `faviconAdapter.ts` (`faviconAdapter`)

Functional utility for generating and fetching favicon URLs.

- Supports multiple providers (Google S2, DuckDuckGo) with a built-in fallback chain.
- Ensures consistent UI representation for accounts and companies.

### 🧩 `browserAdapter.ts` (`browserAdapter`)

Thin wrapper around the WebExtension APIs (`tabs`, `downloads`, `notifications`, `i18n`, etc.) used by UI and adapters.

### ⚙️ `taskAdapter.ts` (`taskAdapter`)

Functional utility for managing asynchronous operations.

- **Retry Logic**: Implements robust retry-with-backoff for operations that may fail transiently.
- **Connection Guards**: Provides standardized checks for database connectivity.

### 🔔 `alertAdapter.ts` (`alertAdapter`)

Centralized functional alert orchestration.

- Normalizes unknown errors into user-facing strings.
- Applies consistent defaults (duration, confirm options).
- Adds rate limiting for duplicate messages.
- Logs structured technical context while delegating rendering to the alerts store.

### 📂 `importExportAdapter.ts` (`importExportAdapter`)

Functional bridge for data portability.

- Handles File I/O for JSON backups.
- Orchestrates the validation and transformation of imported data using functional domain helpers.

`importExportAdapter` is created via `createImportExportAdapter()` and provided via the DI container (it is not a
global singleton).

### ⚖️ `validationAdapter.ts` (`validationAdapter`)

A functional bridge adapter that translates domain validation rules into a format compatible with Vuetify forms,
including internationalized error messages.

### 💾 `storageAdapter.ts` (`storageAdapter`)

Adapter wrapper around `browser.storage.local` that provides a typed API, default installation, and consistent error
handling.

## Directory Structure

### Directories

- `database/`
- `fetch/`

### Files

- `alertAdapter.ts`: AlertAdapter, AlertSink, createAlertAdapter
- `appAdapter.ts`: AppAdapter, AppAdapterDeps, AppStores, createAppAdapter
- `browserAdapter.ts`: BrowserAdapter, createBrowserAdapter
- `faviconAdapter.ts`: FaviconAdapter, createFaviconAdapter
- `fetchAdapter.ts`: FetchAdapter, createFetchAdapter, clearCache, fetchWithRetry, getCache, ...
- `importExportAdapter.ts`: validateBackupData, validateDataIntegrityStatus, validateLegacyDataIntegrityStatus, stringifyDatabase, verifyExportIntegrity, ...
- `storageAdapter.ts`: storageAdapter
- `taskAdapter.ts`: ensureConnected, createTaskAdapter, TaskAdapter
- `types.ts`
- `validationAdapter.ts`: createRule, cleanString, oneOfTwo, required, stringLength, ...

