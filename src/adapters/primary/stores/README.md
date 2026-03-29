# Stores Layer

**Pinia State Stores** manage the application’s reactive state. The Stores Layer serves
as a central repository for data and coordinates between the [Secondary Adapters Layer](adapters/secondary/README.md)
for persistence,
and the [Components Layer](adapters/primary/components/README.md) for presentation.

## Role and Responsibilities

The mission of the stores layer is to:

- **Reactive State Management**: Provide a single source of truth for UI and domain data that components can react to.
- **Data Coordination**: Synchronize state across different parts of the application (e.g., updating balances when a
  booking is added).
- **Business Logic Integration**: Utilize functional [Domain Logic](domain/README.md) to provide calculated
  properties (getters) for the UI.
- **Persistence Sync**: Coordinate with DI-provided services (database + storage) to ensure data survives sessions.

## Key Stores

### 📦 `recordsHub.ts` (`useRecordsStore`)

The central hub that wires together all domain data stores and aggregation stores.

- Orchestrates `accounts`, `bookings`, `bookingTypes`, and `stocks` for mass operations (init, clean).
- Exposes the `accounting` and `portfolio` aggregation stores as named properties.
- Provides the `isDepot` computed property (whether the active account is a depot).

#### Cross-store dependency policy

- **Leaf Stores**: Individual domain stores (`accounts`, `bookings`, `bookingTypes`, `stocks`, `settings`,
  `runtime`, `alerts`).
- **Aggregation Stores**: Derived-state stores (`accounting`, `portfolio`) that combine multiple leaf stores into
  computed aggregates. They have no persistent state of their own.
- **Hub**: `recordsHub.ts` is the primary orchestrator for mass operations (init, clean) and the single import point
  for consumers that need multiple store domains.
- **Dependencies**: Leaf stores should minimize direct imports of other leaf stores. When a store requires data or logic
  from another store, it is permitted if it avoids circular dependencies. Prefer using `recordsHub` for cross-entity
  coordination when possible.

#### Single hydration entrypoint

- `records.init(...)` is the central place where domain record stores (accounts, bookings, etc.) are hydrated from
  persistence.
- It also coordinates with `settings.init(...)` to ensure the application state is consistent.

### 🏦 Domain Data Stores

- **`accounts.ts`**: Manages the list of bank accounts and their metadata.
- **`stocks.ts`**: Manages stock holdings and raw market data. Portfolio calculations are delegated to `portfolio.ts`.
- **`bookings.ts`**: Manages financial transactions providing complex aggregations for sums, for taxes, and for fees.
- **`bookingTypes.ts`**: Manages categories for bookings (e.g., Buy, Sell, Dividend).

### 🧮 Aggregation Stores

Pure derived-state stores with no persistent state. They compose leaf stores into higher-level computed properties.

- **`accounting.ts`** (`useAccountingStore`): Combines `bookings` and `bookingTypes` to derive per-type booking sums
  (`sumBookingsPerType`, `sumBookingsPerTypeAndYear`).
- **`portfolio.ts`** (`usePortfolioStore`): Combines `stocks`, `bookings`, and `settings` to derive active/passive
  stock lists with computed portfolio values, investment totals, and depot sum (`active`, `passive`, `sumDepot`).
  Network side effects (online price fetching) are handled separately in the `useOnlineStockData` composable.

### ⚙️ `settings.ts` (`useSettingsStore`)

Manages persistent user preferences.

- Handles UI themes (skins), pagination limits, and active account selection.
- Automatically synchronizes changes with the browser persistent storage.

### ⚡ `runtime.ts` (`useRuntimeStore`)

Manages volatile, non-persistent UI state.

- Tracks navigation (current view), dialog visibility (teleport system), and global loading states.
- Handles temporary data like current exchange rates and info counters.

### 🔔 `alerts.ts` (`useAlertsStore`)

Manages the application’s notification system.

- Provides a queue-based system for success, error, warning, and info messages.
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
5. **Validation**: Data entering the stores from the UI should ideally be validated via the `validationAdapter` before
   reaching the persistence layer.

6. **Minimize leaf-to-leaf imports**: Avoid tight coupling between leaf stores. Use `useRecordsStore()` for high-level
   orchestration or ensure that cross-imports do not create circularity.
7. **Hydration entrypoint**: Domain record data should be hydrated through `records.init(...)`.
8. **No Service Imports**: Stores receive services via dependency injection (wired in
   `src/adapters/primary/plugins/pinia.ts` and
   `src/adapters/primary/stores/deps.ts`). Do not import concrete service modules from stores.
9. **Aggregation stores are read-only**: `accounting.ts` and `portfolio.ts` expose only `computed` properties — they
   must never hold mutable state or trigger persistence side effects.

### Example usage

```ts
import { useRecordsStore } from "@/adapters/primary/stores/recordsHub";
import type { RecordsDbData } from "@/domain/types";

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

- Unit test getters and critical actions in isolation using Pinia (see also `setActiveTestPinia()` in
  `tests/unit/support/pinia.ts` via the `@test/*` alias).
- For cross-store interactions, prefer testing via the `useRecordsStore` orchestrator.
- When persistence is involved, provide stubbed store deps and assert that stores send normalized data to services.
