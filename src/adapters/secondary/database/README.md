# Database Service Infrastructure

This directory contains the refactored, modular IndexedDB persistence engine. It follows a **Facade Pattern**, where a
central service orchestrates specialized components for connection management, transactions, repositories, and
maintenance.

The database service is created via `createDatabaseService()` and then provided through the runtime DI container as
`useServices().databaseService`.

## Architecture Overview

The database infrastructure is divided into several specialized modules:

- **`service.ts`**: The `createDatabaseService()` factory (Facade). It provides a high-level API for the rest of the
  application (connect/disconnect, transactions, repositories, health/batch utilities).
- **`connection/`**: Manages the low-level `IDBDatabase` connection, including opening/closing and version change
  events.
- **`transaction/`**: Provides a robust `transactionManager` to handle IndexedDB transactions with support for timeouts
  and progress tracking.
- **`repositories/`**: Implements the Repository pattern. Each entity (Accounts, Bookings, etc.) has its own repository
  implementation. These repositories are the single source of truth for database operations,
  used by both stores and composables.
- **`health/`**: Specialized service for database integrity checks and automated repair routines.
- **`batch/`**: Services for high-performance bulk operations and atomic multi-store imports.
- **`migrator.ts`**: Handles schema versioning and store creation during database upgrades.

## Key Concepts

### 1. Repository Pattern

Instead of direct store access, use typed repositories:

```typescript
import {useServices} from "@/adapters/secondary/context";

const {repositories} = useServices();
const accountsRepo = repositories.accounts;
const allAccounts = await accountsRepo.findAll();
```

### 2. Transaction Management

The `TransactionManager` ensures that operations are atomic and safe. You can execute multiple operations within a
single transaction:

```typescript
import {useServices} from "@/adapters/secondary/context";
import {INDEXED_DB} from "@/constants";

const {databaseService, repositories} = useServices();
const accountsRepo = repositories.accounts;
const bookingsRepo = repositories.bookings;

await databaseService.transactionManager.execute(
  [INDEXED_DB.STORE.ACCOUNTS.NAME, INDEXED_DB.STORE.BOOKINGS.NAME],
  "readwrite",
  async (tx) => {
    const accountId = await accountsRepo.save(newAccount, {tx});
    await bookingsRepo.save({...booking, cAccountNumberID: accountId}, {tx});
  }
);
```

### 3. Health and Maintenance

The system can detect and repair common database issues:

```typescript
import {useServices} from "@/adapters/secondary/context";

const {databaseService} = useServices();
const report = await databaseService.healthCheck();
if (report.issues.length > 0) {
  await databaseService.repairDatabase();
}
```

## Directory Structure

- `connection/`: Connection lifecycle management.
- `transaction/`: Transaction orchestration logic.
- `repositories/`: Entity-specific CRUD logic.
    - `base.ts`: The generic base class for all repositories.
    - `factory.ts`: Creates and caches repository instances.
- `health/`: Data integrity and repair services.
- `batch/`: Bulk operation and import services.
- `migrator.ts`: Schema definitions and migration logic.
- `service.ts`: The primary entry point (Facade).

## Development Guidelines

1. **Use Repositories**: Avoid manual `IDBRequest` handling. Always use the repository functions and objects.
2. **Transaction Safety**: Always pass the `tx` object when performing multiple related operations to ensure atomicity.
3. **Schema Changes**: All schema modifications (new stores or indices) must be implemented in `migrator.ts`.
4. **Error Handling**: Use the centralized `AppError` system for database-related failures.

## Testing Notes

- Create an isolated instance via `createDatabaseService()` and inject it through `createServices({databaseService})`
  (or pass it as an explicit dependency to the unit under test).
