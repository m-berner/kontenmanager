# Stores Layer

**Pinia State Stores** manage the application’s reactive state. The Stores Layer serves
as a central repository for data and coordinates between the [Services Layer](/services/README.md) for persistence, and
the [Components Layer](/components/README.md) for presentation.

## Role and Responsibilities

The mission of the stores layer pays in to:

- **Reactive State Management**: Provide a single source of truth for UI and domain data that components can react to.
- **Data Coordination**: Synchronize state across different parts of the application (e.g., updating balances when a
  booking is added).
- **Business Logic Integration**: Utilize [Domain Logic](/domains/README.md) to provide calculated properties (getters)
  for the UI.
- **Persistence Sync**: Coordinate with `DatabaseService` and browser storage to ensure data survives sessions.

## Key Stores

### 📦 `records.ts` (`useRecordsStore`)

The orchestrator for all domain-specific data stores.

- Acts as a central hub for `accounts`, `bookings`, `bookingTypes`, and `stocks`.
- Manages the bulk initialization and cleanup of the entire data set.

#### Cross-store dependency policy

- **Leaf Stores**: Individual domain stores (e.g., `accounts`, `bookings`, `bookingTypes`, `stocks`, `settings`,
  `runtime`, `alerts`).
- **Orchestration**: `records.ts` is the primary orchestrator for mass operations (init, clean).
- **Dependencies**: Leaf stores should minimize direct imports of other leaf stores. When a store requires data or logic
  from another store, it is permitted if it avoids circular dependencies. Prefer using `records` for cross-entity
  coordination when possible.

#### Single hydration entrypoint

- `records.init(...)` is the central place where domain record stores (accounts, bookings, etc.) are hydrated from
  persistence.
- It also coordinates with `settings.init(...)` to ensure the application state is consistent.

### 🏦 Domain Data Stores

- **`accounts.ts`**: Manages the list of bank accounts and their metadata.
- **`stocks.ts`**: Manages stock holdings, including real-time market data and portfolio calculations.
- **`bookings.ts`**: Manages financial transactions, providing complex aggregations for sums, taxes and fees.
- **`bookingTypes.ts`**: Manages categories for bookings (e.g., Buy, Sell, Dividend).

### ⚙️ `settings.ts` (`useSettingsStore`)

Manages persistent user preferences.

- Handles UI themes (skins), pagination limits, and active account selection.
- Automatically synchronizes changes with the browser persistent storage.

### ⚡ `runtime.ts` (`useRuntimeStore`)

Manages volatile, non-persistent UI state.

- Tracks navigation (current view), dialog visibility (teleport system), and global loading states.
- Handles temporary data like current exchange rates and info counters.

### 🔔 `alerts.ts` (`useAlertStore`)

Manages the application’s notification system.

- Provides a queue-based system for success, error, warning and info messages.
- Implements asynchronous confirmation dialogs (promises).

## Directory Structure

- `*.ts`: Individual store implementations using the Pinia “setup” syntax.
- `*.test.ts`: Unit tests for store logic and state transitions.

## Development Principles

1. **State Isolation**: Keep unrelated state in separate stores to minimize re-renders and improve modularity.
2. **Setup Syntax**: All stores use the Pinia setup function syntax for better composition and TypeScript support.
3. **Getters for Logic**: Use `computed` properties for derived state (e.g., total balance). Complex calculations should
   be delegated to the `DomainLogic`.
4. **Action Consistency**: Actions should handle state transitions and coordinate with services. Ensure asynchronous
   actions handle errors gracefully.
5. **Validation**: Data entering the stores from the UI should ideally be validated via the `ValidationService` before
   reaching the persistence layer.

6. **Minimize leaf-to-leaf imports**: Avoid tight coupling between leaf stores. Use `useRecordsStore()` for high-level
   orchestration or ensure that cross-imports do not create circularities.
7. **Hydration entrypoint**: Domain record data should be hydrated through `records.init(...)`.

### Example usage

```ts
import { useRecordsStore } from "@/stores/records";
import type { RecordsDbData } from "@/types";

const records = useRecordsStore();

// Hydration (single entrypoint)
async function boot(storesDB: RecordsDbData, messages: Record<string, string>) {
  await records.init(storesDB, messages, /* removeAccounts */ true);
}

// Coordinated cleanup
records.clean(true); // also clears accounts
records.clean(false); // keeps accounts
```

## Testing

- Unit test getters and critical actions in isolation using Pinia’s `setActivePinia(createPinia())`.
- For cross-store interactions, prefer testing via the `useRecordsStore` orchestrator.
- When persistence is involved, stub `databaseService` calls and assert that stores send normalized data to services.
