# Database Service Infrastructure

This directory contains the refactored, modular IndexedDB persistence engine. It follows a **Facade Pattern**, where a
central service orchestrates specialized components for connection management, transactions, repositories, and
maintenance.

The database adapter is created via `createDatabaseAdapter()` and then provided through the runtime DI container as
`useAdapters().databaseAdapter`.

## Architecture Overview

The database infrastructure is divided into several specialized modules:

- **`databaseAdapter.ts`**: The `createDatabaseAdapter()` factory (Facade). It provides a high-level API for the rest of
  the application (connect/disconnect, transactions, repositories, health/batch utilities).
- **`connectionManager.ts`**: Manages the low-level `IDBDatabase` connection, including opening/closing and version
  change events.
- **`transactionManager.ts`**: Provides a robust `transactionManager` to handle IndexedDB transactions with support for
  timeouts and progress tracking.
- **`repositories/`**: Implements the Repository pattern. Each entity (Accounts, Bookings, etc.) has its own repository
  implementation. These repositories are the single source of truth for database operations, used by both stores and
  composables.
- **`healthChecker.ts`**: Specialized service for database integrity checks and automated repair routines.
- **`batchOperations.ts`**: Adapters for high-performance bulk operations and atomic multi-store imports.
- **`migrator.ts`**: Handles schema versioning and store creation during database upgrades.

## Surface that only tests exercise

Part of this layer's API has no production caller. That is deliberate, and it is
written down here so it stops being re-derived as a finding on every audit pass
(the same reason `healthChecker.ts` carries the note at its own head):

| Symbol | Status |
|--------|--------|
| `transactionManager.executeMultiple` | Sequential counterpart to the `Promise.all`-over-one-`tx` shape `databaseAdapter` uses; safe for operations that depend on one another. Documented at the function. |
| `createBatchOperationBuilder` + `batchService.createBuilder` + `databaseAdapter.batch()` / `batchOperations()` | `executeAtomic` — the one part with a production caller — carries the whole backup import. The fluent builder over it does not. Documented at `BatchOperationBuilder`. |
| `accountRepository.findByIBAN` / `ibanExists` | Duplicate detection runs in-memory off the accounts store, which holds every account. |
| `bookingRepository.findByDate` / `findByBookingType` / `findByStock` | The app filters the already-loaded bookings store instead. |
| `countByAccount` (all three repositories) | Counts through the index rather than materializing rows — see `baseRepository.countBy`. |
| `repositoryFactory.clearCache` | Has a dedicated test; the connection is not swapped at runtime, so nothing in the app needs it. |
| `healthChecker.performHealthCheck` / `repairDatabase` | Diagnostic surface — see the note at the head of that file, including the warning that repair deletes without confirmation. |

A repository layer reasonably exposes a complete CRUD surface, so this is not a
deletion backlog. It is a cost to be aware of: these paths are maintained and
reviewed while only tests exercise them. Prefer extending an existing entry over
adding a new unreachable one.

## Key Concepts

### 1. Repository Pattern

Instead of direct store access, use typed repositories:

```typescript
import {useAdapters} from "@/adapters/context";

const {repositories} = useAdapters();
const accountsRepo = repositories.accounts;
const allAccounts = await accountsRepo.findAll();
```

### 2. Transaction Management

The transaction manager ensures that operations are atomic and safe. You can execute multiple operations within a single
transaction:

```typescript
import {useAdapters} from "@/adapters/context";
import {INDEXED_DB} from "@/constants";

const {databaseAdapter, repositories} = useAdapters();
const accountsRepo = repositories.accounts;
const bookingsRepo = repositories.bookings;

await databaseAdapter.transactionManager.execute(
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
import {useAdapters} from "@/adapters/context";

const {databaseAdapter} = useAdapters();
const report = await databaseAdapter.healthCheck();
if (report.issues.length > 0) {
  await databaseAdapter.repairDatabase();
}
```

## Directory Structure

### Directories

- `repositories/`

### Files

- `batchOperations.ts`: BatchOperationBuilder, createBatchOperationService
- `connectionManager.ts`: createDatabaseConnectionManager
- `databaseAdapter.ts`: createDatabaseAdapter, Service
- `healthChecker.ts`: createDatabaseHealthService
- `migrator.ts`: setupDatabase
- `transactionManager.ts`: createTransactionManager, TransactionManagerContract

