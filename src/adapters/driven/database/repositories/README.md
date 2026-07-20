# Repositories (`src/adapters/driven/database/repositories/`)

This directory contains the concrete implementation of the data access layer. Repositories are responsible for interacting with the IndexedDB database to perform CRUD operations on domain entities.

Each repository is created via `createBaseRepository()`, spreading its returned CRUD operations into
the entity-specific repository object (functional composition, not class inheritance).

## Responsibilities

- **Data Access**: Executing queries against IndexedDB.
- **Mapping**: Converting database records to domain objects and vice versa (via `createBaseRepository` mapping logic).
- **Abstractions**: Providing a clean API for the rest of the application, accessed via `useAdapters().repositories`
  (built internally by `repositoryFactory.ts`).

## Key Components

- `baseRepository.ts`: Functional factory (`createBaseRepository`) containing shared logic for IndexedDB interaction.
- `accountRepository.ts`: Specialized repository for managing account data.
- `bookingRepository.ts`: Specialized repository for managing financial transactions.
- `bookingTypeRepository.ts`: Specialized repository for managing booking types.
- `stockRepository.ts`: Specialized repository for managing stock and security data.
- `repositoryFactory.ts`: A central point for creating and accessing repository instances.

## Directory Structure

### Files

- `accountRepository.ts`: createAccountRepository
- `baseRepository.ts`: createBaseRepository
- `bookingRepository.ts`: createBookingRepository
- `bookingTypeRepository.ts`: createBookingTypeRepository
- `repositoryFactory.ts`: createRepositoryFactory, RepositoryFactoryContract
- `stockRepository.ts`: createStockRepository

