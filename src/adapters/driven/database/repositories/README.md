# Repositories (`src/adapters/driven/database/repositories/`)

This directory contains the concrete implementation of the data access layer. Repositories are responsible for interacting with the IndexedDB database to perform CRUD operations on domain entities.

They extend a `BaseRepository` which provides common functionality for all database tables.

## Responsibilities

- **Data Access**: Executing queries against IndexedDB.
- **Mapping**: Converting database records to domain objects and vice versa (via `BaseRepository` mapping logic).
- **Abstractions**: Providing a clean API for the rest of the application (usually accessed via the `RepositoryFactory`).

## Key Components

- `baseRepository.ts`: The abstract base class containing shared logic for IndexedDB interaction.
- `accountRepository.ts`: Specialized repository for managing account data.
- `bookingRepository.ts`: Specialized repository for managing financial transactions.
- `stockRepository.ts`: Specialized repository for managing stock and security data.
- `repositoryFactory.ts`: A central point for creating and accessing repository instances.

## Directory Structure

### Files

- `accountRepository.ts`: createAccountRepository, AccountRepository
- `baseRepository.ts`: createBaseRepository
- `bookingRepository.ts`: createBookingRepository, BookingRepository
- `bookingTypeRepository.ts`: createBookingTypeRepository, BookingTypeRepository
- `repositoryFactory.ts`: createRepositoryFactory, RepositoryFactoryContract, RepositoryFactory
- `stockRepository.ts`: createStockRepository, StockRepository

