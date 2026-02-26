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

### 🗄️ `database/` (`DatabaseService`)

The core persistence engine based on IndexedDB, refactored into a modular architecture.

- **Facade Pattern**: The `Service` class acts as a single entry point for all database interactions.
- **Repository Pattern**: Specialized repositories handle CRUD operations for different entity types.
- **Transaction Management**: Orchestrates atomic operations and ensures data consistency.
- **Health & Maintenance**: Implements health checks and automated repair routines.
- **Batch Processing**: Supports high-performance bulk data operations.

### 🚀 `app.ts` (`AppService`)

Handles the application lifecycle and initialization.

- Orchestrates the startup sequence (storage -> database -> store hydration).
- Manages the initial fetch of market data (exchanges, indexes, materials).

### 🌐 `fetch.ts` (`FetchService`)

Responsible for all external network requests.

- Scrapes market data from various financial portals.
- Implements retry logic and an internal cache to minimize network traffic.
- Parses HTML responses into structured domain data.

### 📂 `importExport.ts` (`ImportExportService`)

Bridge for data portability.

- Handles File I/O for JSON backups.
- Orchestrates the validation and transformation of imported data using domain helpers.

### ⚖️ `validation.ts` (`ValidationService`)

A bridge service that translates domain validation rules into a format compatible with Vuetify forms, including
internationalized error messages.

## Directory Structure

- `database/`: Contains database-specific base classes, migration logic, and repositories.
    - `base.ts`: Low-level IndexedDB wrapper and base repository classes.
    - `migrator.ts`: Database schema versioning and migration logic.
    - `repositories/`: Specialized repository classes for each entity type.
- `*.ts`: Individual service implementations.
- `*.test.ts`: Integration and unit tests for services.

## Development Principles

1. **No Business Rules**: Pure logic belongs in the `domain`. Services should only "do" things, not "decide" business
   outcomes.
2. **Asynchronicity**: Most service methods return `Promises`. Always handle errors using the centralized `AppError`
   structure.
3. **Dependency Injection**: Services are typically instantiated as singletons or used via composables to ensure
   consistent state across the extension.
4. **Fail Gracefully**: Infrastructure operations (especially network requests) must handle failures without crashing
   the UI, providing meaningful feedback via the `alerts` system.

## Testing

- Prefer integration-style unit tests that mock network/DB boundaries.
- Stub IndexedDB and `browser.*` APIs in Vitest where needed.
- Assert that services translate technical failures into `AppError` instances with stable error codes.
