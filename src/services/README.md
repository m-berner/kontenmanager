# Services Layer

This directory contains the **Infrastructure and Orchestration** services of the application. The Services Layer is
responsible for interacting with external systems (IndexedDB, WebExtension APIs, External Web APIs) and coordinating the
flow of data between the [Domain Layer](../domains/README.md) and the [Composables Layer](../composables/README.md).

## Role and Responsibilities

The mission of the services layer is to:

- **Infrastructure Abstraction**: Provide a clean interface for complex technical APIs like IndexedDB or `fetch`.
- **Side-Effect Management**: Handle all asynchronous operations and external communications.
- **Orchestration**: Coordinate multi-step operations that involve both domain logic and infrastructure (e.g.,
  application initialization or backup/restore).
- **Data Integrity**: Enforce data persistence rules and handle database migrations.

## Key Services

### 🗄️ `database/` (`databaseService`)

The core persistence engine based on IndexedDB, implemented as a functional module.

- **Modular Architecture**: Service functionality is split into specialized modules for connection, transactions, and repositories.
- **Repository Pattern**: Specialized functions create repositories for CRUD operations.
- **Transaction Management**: Orchestrates atomic operations and ensures data consistency.
- **Health & Maintenance**: Functional implementation of health checks and automated repair routines.
- **Batch Processing**: Supports high-performance bulk data operations.

### 🚀 `app.ts` (`appService`)

A functional module handling the application lifecycle and initialization.

- Orchestrates the startup sequence (storage -> database -> store hydration).
- Manages the initial fetch of market data (exchanges, indexes, materials).

### 🌐 `fetch.ts` (`fetchService`)

Functional implementation for all external network requests.

- Scrapes market data from various financial portals.
- Implements retry logic and an internal cache to minimize network traffic.
- Parses HTML responses into structured domain data.

### 🖼️ `faviconService.ts` (`faviconService`)

Functional utility for generating and fetching favicon URLs.

- Supports multiple providers (Google S2, DuckDuckGo) with a built-in fallback chain.
- Ensures consistent UI representation for accounts and companies.

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

### ⚖️ `validation.ts` (`validationService`)

A functional bridge service that translates domain validation rules into a format compatible with Vuetify forms,
including internationalized error messages.

## Directory Structure

- `database/`: Contains database-specific modules, migration logic, and repository factories.
    - `connection/`: Connection lifecycle management.
    - `transaction/`: Transaction orchestration logic.
    - `repositories/`: Specialized repositories for each entity type.
    - `migrator.ts`: Database schema versioning and migration logic.
- `*.ts`: Individual service implementations.
- `*.test.ts`: Integration and unit tests for services.

## Development Principles

1. **No Business Rules**: Pure logic belongs in the `domain`. Services should only "do" things, not "decide" business
   outcomes.
2. **Asynchronicity**: Most service methods return `Promises`. Always handle errors using the centralized `AppError`
   structure.
3. **Functional Modules**: Services are implemented as exported functions or singleton objects from functional modules.
4. **Fail Gracefully**: Infrastructure operations (especially network requests) must handle failures without crashing
   the UI, providing meaningful feedback via the `alerts` system.

## Testing

- Prefer integration-style unit tests that mock network/DB boundaries.
- Stub IndexedDB and `browser.*` APIs in Vitest where needed.
- Assert that services translate technical failures into `AppError` instances with stable error codes.
