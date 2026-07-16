# Stores Layer

**Pinia State Stores** manage the application’s reactive state. The Stores Layer serves
as a central repository for data and coordinates between the [Secondary Adapters Layer](../../driven/README.md)
for persistence,
and the [Components Layer](../components/README.md) for presentation.

## Role and Responsibilities

The mission of the stores layer is to:

- **Reactive State Management**: Provide a single source of truth for UI and domain data that components can react to.
- **Data Coordination**: Synchronize state across different parts of the application (e.g., updating balances when a
  booking is added).
- **Business Logic Integration**: Utilize functional [Domain Logic](../../../domain/README.md) to provide calculated
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

### Files

- `accounting.ts`: useAccountingStore
- `accounts.ts`: useAccountsStore
- `alerts.ts`: useAlertsStore
- `bookings.ts`: useBookingsStore
- `bookingTypes.ts`: useBookingTypesStore
- `deps.ts`: attachStoreDeps, getStoreDeps, getSettingsStoreDeps
- `portfolio.ts`: usePortfolioStore
- `recordsHub.ts`: useRecordsStore
- `runtime.ts`: useRuntimeStore
- `settings.ts`: useSettingsStore
- `stocks.ts`: useStocksStore

