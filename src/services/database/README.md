# Database Service Infrastructure

This directory contains the refactored, modular IndexedDB persistence engine. It follows a **Facade Pattern**, where a
central service orchestrates specialized components for connection management, transactions, repositories, and
maintenance.

## Architecture Overview

The database infrastructure is divided into several specialized modules:

- **`service.ts`**: The main `Service` class (Facade). It provides a high-level API for the rest of the application.
- **`connection/`**: Manages the low-level `IDBDatabase` connection, including opening/closing and version change
  events.
- **`transaction/`**: Provides a robust `TransactionManager` to handle IndexedDB transactions with support for timeouts
  and progress tracking.
- **`repositories/`**: Implements the Repository pattern. Each entity (Accounts, Bookings, etc.) has its own repository
  class inheriting from a `BaseRepository`.
- **`health/`**: Specialized service for database integrity checks and automated repair routines.
- **`batch/`**: Services for high-performance bulk operations and atomic multi-store imports.
- **`migrator.ts`**: Handles schema versioning and store creation during database upgrades.

## Key Concepts

### 1. Repository Pattern

Instead of direct store access, use specialized repositories:

```typescript
const accountsRepo = databaseService.getRepository('accounts');
const allAccounts = await accountsRepo.findAll();
```

### 2. Transaction Management

The `TransactionManager` ensures that operations are atomic and safe. You can execute multiple operations within a
single transaction:

```typescript
await databaseService.transactionManager.execute(
  ['accounts', 'bookings'],
  'readwrite',
  async (tx) => {
    const accountId = await accountsRepo.save(newAccount, { tx });
    await bookingsRepo.save({ ...booking, cAccountNumberID: accountId }, { tx });
  }
);
```

### 3. Health and Maintenance

The system can detect and repair common database issues:

```typescript
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

1. **Use Repositories**: Avoid manual `IDBRequest` handling. Always use or extend the repository classes.
2. **Transaction Safety**: Always pass the `tx` object when performing multiple related operations to ensure atomicity.
3. **Schema Changes**: All schema modifications (new stores or indices) must be implemented in `migrator.ts`.
4. **Error Handling**: Use the centralized `AppError` system for database-related failures.
