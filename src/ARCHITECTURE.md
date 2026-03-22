# KontenManager — Architecture & Developer Guide

KontenManager is a Firefox web extension (Manifest V3) for managing investment
portfolios. Users track accounts, stocks, and bookings (transactions), and the
extension fetches live market data from several financial data providers.

---

## Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [Directory Structure](#2-directory-structure)
3. [Architecture Layers](#3-architecture-layers)
4. [Extension Contexts](#4-extension-contexts)
5. [Startup Flow — App Context](#5-startup-flow--app-context)
6. [Startup Flow — Background Context](#6-startup-flow--background-context)
7. [Startup Flow — Options Context](#7-startup-flow--options-context)
8. [Dependency Injection](#8-dependency-injection)
9. [State Management](#9-state-management)
10. [Database](#10-database)
11. [Fetch Service & Online Data](#11-fetch-service--online-data)
12. [Browser Storage & Settings](#12-browser-storage--settings)
13. [Backup & Restore](#13-backup--restore)
14. [Alert System](#14-alert-system)
15. [Routing & Views](#15-routing--views)
16. [Key Architectural Patterns](#16-key-architectural-patterns)
17. [Adding a Feature — Checklist](#17-adding-a-feature--checklist)

---

## 1. Technology Stack

| Concern | Technology |
|---|---|
| Extension format | Firefox Manifest V3 |
| UI framework | Vue 3 (Composition API, `<script setup>`) |
| Component library | Vuetify 3 |
| State management | Pinia |
| Routing | Vue Router 4 (hash history) |
| Localisation | Vue I18n |
| Database | IndexedDB (via custom repository layer) |
| Build | Vite |
| Testing | Vitest (unit) · Playwright (E2E) |
| Language | TypeScript (strict) |

---

## 2. Directory Structure

```
src/
├── ARCHITECTURE.md             ← you are here
│
├── adapters/                   ← everything framework- or browser-specific
│   ├── container.ts            ← composition root for the app/options contexts
│   ├── containerBackground.ts  ← minimal composition root for the background context
│   │
│   ├── primary/                ← drives the application (UI layer)
│   │   ├── entrypoints/        ← bootstrap scripts (app.ts, background.ts, options.ts)
│   │   │                          and corresponding HTML shells
│   │   ├── views/              ← page-level Vue components (AppIndex, CompanyContent, …)
│   │   ├── components/         ← reusable Vue components and dialog components
│   │   ├── stores/             ← Pinia stores (settings, runtime, records, …)
│   │   ├── composables/        ← Vue composables (useOnlineStockData, useBackupDialogs, …)
│   │   ├── plugins/            ← Vue plugins (pinia, router, i18n, vuetify, components)
│   │   └── _locales/           ← i18n translation files (de, en)
│   │
│   └── secondary/              ← driven by the application (infrastructure layer)
│       ├── alert.ts            ← alert / feedback service
│       ├── app.ts              ← 3-phase app initialisation service
│       ├── browserService.ts   ← browser API wrapper (tabs, windows, downloads, …)
│       ├── context.ts          ← Vue provide/inject bridge for services
│       ├── faviconService.ts   ← favicon caching
│       ├── fetch.ts            ← market-data HTTP service (multi-provider + cache)
│       ├── importExport.ts     ← backup serialisation & validation
│       ├── storageAdapter.ts   ← browser.storage.local wrapper
│       ├── taskService.ts      ← task scheduling
│       ├── types.ts            ← re-exports of shared service types
│       ├── validation.ts       ← ISIN / IBAN / BIC validation
│       └── database/           ← IndexedDB: connection, repositories, migrations,
│                                  transactions, batch operations, health checks
│
├── app/                        ← application core (framework-agnostic)
│   └── usecases/               ← use-case functions (accounts, stocks, bookings, backup, …)
│       ├── ports.ts            ← port interfaces consumed by use cases
│       └── portAdapters.ts     ← adapts Pinia stores to port interfaces
│
└── domain/                     ← pure business rules (no framework, no browser)
    ├── constants/              ← INDEXED_DB, BROWSER_STORAGE, CACHE_POLICY, CURRENCIES, …
    ├── types/                  ← all TypeScript interfaces (AccountDb, StockItem, …)
    ├── errors/                 ← AppError class and error definitions
    ├── utils/                  ← pure utility functions (isoDate, toNumber, log, …)
    └── validation/             ← checksum validators (ISIN, IBAN, BIC)

tests/
├── unit/                       ← Vitest unit & integration tests
└── e2e/                        ← Playwright end-to-end tests
```

---

## 3. Architecture Layers

The project follows **hexagonal architecture** (ports & adapters). Dependencies
always point inward: `adapters → app → domain`. No layer may import from a
layer outside it.

```
┌─────────────────────────────────────────────────────┐
│                      adapters/                       │
│                                                     │
│   primary/           ──────►   secondary/           │
│   (UI, stores,                 (DB, HTTP, storage,  │
│    composables)                 browser APIs)        │
│         │                           │               │
│         └──────────┬────────────────┘               │
│                    ▼                                │
│              app/usecases/                          │
│            (orchestration,                          │
│             port interfaces)                        │
│                    │                                │
│                    ▼                                │
│                 domain/                             │
│           (types, constants,                        │
│            pure logic)                              │
└─────────────────────────────────────────────────────┘
```

The **architecture test** (`tests/unit/architecture.test.ts`) enforces these
rules at CI time:

- UI code (`primary/components`, `views`, `composables`, `plugins`) must not
  import concrete secondary services — only `context` (service locator) and
  `types`.
- Only `entrypoints/` and `secondary/` may import the DI container.
- Use cases must not import Vue, Pinia, or stores.

---

## 4. Extension Contexts

A Firefox extension runs in **three isolated JavaScript contexts**. Each has
its own entry point and its own composition root.

| Context | Entry point | HTML shell | Purpose |
|---|---|---|---|
| **App** | `entrypoints/app.ts` | `app.html` | Main popup / full-screen app tab |
| **Background** | `entrypoints/background.ts` | `background.html` | Service worker: lifecycle events + toolbar click |
| **Options** | `entrypoints/options.ts` | `options.html` | Extension settings page |

Contexts cannot share JavaScript objects; they communicate via
`browser.storage.local` and `browser.runtime`.

---

## 5. Startup Flow — App Context

```
entrypoints/app.ts
│
├─ createServices()          ← build the full service container
├─ createAppPinia(services)  ← create Pinia, wire store deps, configure alert sink
├─ createI18nPlugin(...)
├─ provideServices(app, services)   ← make services available to the Vue tree
├─ app.use(pinia, i18n, router, vuetify, components)
├─ startThemeSync(...)
└─ app.mount("#app")
        │
        └─ AppIndex.vue  onBeforeMount
               │
               └─ appService.initializeApp(stores, translations, signal)
                      │
                      ├─ Phase 1 — Storage
                      │     storageAdapter.getStorage()
                      │     settingsStore.init(storageData)
                      │
                      ├─ Phase 2 — Database
                      │     databaseService.connect()
                      │     databaseService.getAccountRecords(activeAccountId)
                      │     recordsStore.init(dbData, translations)
                      │
                      └─ Phase 3 — External data (non-critical, allSettled)
                            fetchService.fetchExchangesData()
                            fetchService.fetchIndexData()
                            fetchService.fetchMaterialData()
```

**Key points:**
- Phases run sequentially. Storage must succeed before the database is opened;
  the database must be ready before records are loaded.
- Phase 3 uses `Promise.allSettled`, so a failed network request does not
  prevent the app from rendering.
- An `AbortController` is created in `AppIndex` and cancelled in `onUnmounted`,
  so in-flight requests are aborted on navigation.
- A spinner is shown until `isInitialized` becomes `true`.

---

## 6. Startup Flow — Background Context

```
entrypoints/background.ts
│
├─ createBackgroundServices()   ← minimal container: browserService + storageAdapter only
│
├─ browserService.runtimeOnInstalled(onInstall)
│       └─ storageAdapter.installStorageLocal()
│               └─ writes all BROWSER_STORAGE defaults on first install / update
│
└─ browserService.actionOnClicked(onClick)
        └─ tabsQuery() to find existing app tabs
               ├─ none found  → tabsCreate()  (opens a new tab)
               └─ found       → windowsUpdate() + tabsUpdate()  (focus the first tab)
                                 + removeTab() for any duplicate tabs
```

The background bundle is deliberately kept small: only `browserService` and
`storageAdapter` are included to avoid pulling in the full service graph.

---

## 7. Startup Flow — Options Context

```
entrypoints/options.ts
│
├─ createServices()
├─ createAppPinia(services)
├─ provideServices(app, services)
├─ app.use(pinia, i18n, vuetify)
├─ useSettingsStore(pinia).load()   ← manual init (no appService bootstrap)
├─ startThemeSync(...)
└─ app.mount("#options")
        └─ OptionsIndex.vue
```

The options page skips the full three-phase bootstrap: no database connection,
no records loading. Only settings are initialised so the preference tabs can
read and persist values.

---

## 8. Dependency Injection

The project uses two complementary DI mechanisms:

### 8.1 Service container (composition root)

`src/adapters/container.ts` creates all secondary services and returns them as
a plain object:

```typescript
const services = createServices(overrides?)
// { browserService, databaseService, fetchService, alertService,
//   storageAdapter, repositories, appService, … }
```

`overrides` accepts test doubles for any service, enabling unit tests without
real IndexedDB or network calls.

`container.ts` is the **only** file allowed to import concrete service
implementations. Everything else receives services through the mechanisms
below.

### 8.2 Vue provide / inject (for components and composables)

```typescript
// entrypoint
provideServices(app, services)  // context.ts

// any component or composable
const { fetchService, alertService } = useServices()
```

`useServices()` calls Vue's `inject()` internally. Because it uses Vue's
injection system, it only works inside `setup()` or a composable called from
`setup()`.

### 8.3 Pinia symbol-based DI (for stores)

Stores cannot use `inject()` because they run outside Vue's component tree.
`src/adapters/primary/stores/deps.ts` provides a symbol-keyed side-channel:

```typescript
// wired once per Pinia instance (plugins/pinia.ts)
attachStoreDeps(pinia, { storageAdapter, alertService })

// retrieved inside any store definition
const { storageAdapter, alertService } = getStoreDeps()
```

This avoids circular imports between stores and services.

### 8.4 Alert sink (two-phase wiring)

`alertService` is created before Pinia (because Pinia needs it), but rendering
alerts requires `useAlertsStore`. The wiring is deferred:

```typescript
// plugins/pinia.ts, after createPinia()
services.alertService.configureAlertSink(() => useAlertsStore(pinia))
```

`alertService` calls the sink lazily the first time feedback is requested,
breaking the circular dependency.

---

## 9. State Management

### Store overview

| Store | Persistence | Purpose |
|---|---|---|
| `settings` | browser.storage.local | User preferences (theme, provider, active account, pagination) |
| `runtime` | memory only | Volatile UI state (current view, dialogs, exchange rates, page cache) |
| `records` | memory (loaded from DB) | Hub: owns and coordinates all entity sub-stores |
| `accounts` | memory | AccountDb items |
| `stocks` | memory | StockItem items (includes mutable online fields: mValue, mMin, mMax) |
| `bookings` | memory | BookingDb items |
| `bookingTypes` | memory | BookingTypeDb items |
| `portfolio` | derived (computed) | Active + passive stock lists; sumDepot calculation |
| `accounting` | derived (computed) | Per-account sums, gains, and yields |
| `alerts` | memory | Queue of pending alert messages for the AlertOverlay |

### Settings auto-persistence

Every settings setter calls `storageAdapter().setStorage(key, value)` so
preferences are durable across extension restarts. Cross-context sync is
handled by `addStorageChangedListener`: when the options page changes a
setting, the app context picks it up automatically.

### Runtime page cache

`runtime.loadedStocksPages` is a `Set<number>` tracking which portfolio pages
have up-to-date online prices. `runtime.loadedStocksPagesAt` stores the
timestamp. `isStocksPageFresh(page, maxAgeMs)` combines both to decide whether
a network request is needed. Cache is cleared by `clearStocksPages()` whenever
the account, provider, or pagination settings change.

### Records initialisation

`recordsStore.init(dbData, translations)` populates all entity stores from the
data returned by the database service. On account switch the store calls
`clean()` then `init()` again with data for the new account.

---

## 10. Database

The extension stores all user data in **IndexedDB** (database name
`kontenmanager.db`, current schema version 27).

### Object stores

| Store | Key | Content |
|---|---|---|
| `accounts` | `cID` | Bank / brokerage accounts (IBAN, BIC, logo URL) |
| `stocks` | `cID` | Securities (ISIN, symbol, company, URL, meeting dates) |
| `bookings` | `cID` | Transactions (buy, sell, dividend, fee, tax, …) |
| `bookingTypes` | `cID` | Transaction type labels per account |

### Layers inside `secondary/database/`

```
database/
├── service.ts          ← public API: connect(), disconnect(), getAccountRecords(),
│                          getAllRepositories(), executeBatch(), checkHealth(), repair()
├── connection/
│   └── manager.ts      ← opens / upgrades / closes the IDBDatabase
├── migrator.ts         ← runs schema migrations on version upgrade
├── transaction/
│   └── manager.ts      ← wraps IDB transactions with Promise API
├── repositories/
│   ├── base.ts         ← shared save / delete / query helpers
│   ├── account.ts
│   ├── stock.ts
│   ├── booking.ts
│   ├── bookingType.ts
│   └── factory.ts      ← creates all repositories from a single IDBDatabase instance
├── batch/
│   └── service.ts      ← atomic multi-step write operations
└── health/
    └── service.ts      ← integrity checks and repair routines
```

### Transactions

All multi-step writes go through the transaction manager so they are atomic.
`executeBatch()` is the entry point for use-case–level operations (e.g.
importing a backup atomically replaces all four stores).

---

## 11. Fetch Service & Online Data

### Providers

Six financial data providers are supported:

| Provider | Key data |
|---|---|
| Wallstreet-Online | min / current / max prices |
| Finanzen.Net | min / current / max prices |
| Aktien-Check | price check |
| Goyax | price check |
| Tradegate | price check |
| ARD Börse | general meeting / quarter dates |

The active provider is stored in `settings.service`. The fetch service routes
requests to the correct provider and falls back gracefully when a request
fails.

### Cache layers

1. **HTTP response cache** (`secondary/fetch/cache.ts`) — caches raw HTTP
   responses by URL with a configurable TTL (`CACHE_POLICY.DEFAULT_HTTP_TTL_MS`
   = 5 min, `CACHE_POLICY.QUOTE_TTL_MS` = 1 min).
2. **UI page freshness cache** (`runtime.loadedStocksPages`) — tracks which
   portfolio pages have been loaded within `CACHE_POLICY.ONLINE_RATES_MAX_AGE_MS`
   (1 min). Pages outside the window trigger a new network request.

### Online data flow

```
useOnlineStockData.loadOnlineData(page)
│
├─ Compute ISINs for the requested page (via portfolio.active + settings.stocksPerPage)
├─ Identify stocks needing date refresh (meeting / quarter day overdue)
│
├─ Promise.all([
│     fetchService.fetchMinRateMaxData(isinList, getStorage),
│     fetchService.fetchDateData(isinDatesNeeded)
│   ])
│
├─ Apply currency conversion
│     browserService.getUserLocale() → region → expected currency
│     stockCur vs uiCur → divisor from runtime.curUsd / runtime.curEur
│
├─ Write mMin, mValue, mMax, mEuroChange back into stocks.items (in place)
├─ Write updated meeting / quarter dates back into stocks.items
└─ runtime.markStocksPageLoaded(page)
```

`useOnlineStockData` exposes three functions:

- `loadOnlineData(page)` — loads a single page if not already fresh.
- `refreshOnlineData(page)` — forces a reload of one page.
- `refreshAllOnlineData()` — reloads all pages that have holdings.

Cache invalidation watchers run **once** in `AppIndex.vue` (not per call site):

```typescript
watch(() => settings.service,       () => { runtime.clearStocksPages(); fetchService.clearCache?.() })
watch(() => settings.activeAccountId, () => runtime.clearStocksPages())
watch(() => settings.stocksPerPage,   () => runtime.clearStocksPages())
```

---

## 12. Browser Storage & Settings

`browser.storage.local` holds user preferences as flat key-value pairs. All
keys and their defaults are defined in `domain/constants` as `BROWSER_STORAGE`:

| Key constant | Default | Meaning |
|---|---|---|
| `ACTIVE_ACCOUNT_ID` | `-1` | Currently selected account |
| `SKIN` | `"ocean"` | UI theme |
| `SERVICE` | `"wstreet"` | Data provider |
| `BOOKINGS_PER_PAGE` | `15` | Pagination |
| `STOCKS_PER_PAGE` | `10` | Pagination |
| `DIVIDENDS_PER_PAGE` | `10` | Pagination |
| `SUMS_PER_PAGE` | `10` | Pagination |
| `EXCHANGES` | `["EURUSD", "USDJPY"]` | Displayed exchange rates |
| `INDEXES` | `["dax"]` | Displayed market indexes |
| `MATERIALS` | `["au"]` | Displayed commodity prices |
| `MARKETS` | `["XETRA"]` | Displayed markets |

`storageAdapter.installStorageLocal()` writes all defaults on first install (or
after an extension update that adds new keys). This is called by the background
script's `onInstalled` handler.

---

## 13. Backup & Restore

### Export

`exportDatabaseUsecase` serialises all four entity stores to a JSON file
(`ModernBackupData` format) and triggers a browser download.

### Import

`importDatabaseUsecase` is the most complex use case. It runs four phases:

1. **Read & validate** — reads the JSON file, validates the top-level structure
   and schema version.
2. **Integrity check** — for legacy backups (v ≤ 25) calls
   `validateLegacyDataIntegrity`; for modern backups calls `validateDataIntegrity`.
3. **Confirm** — shows a confirmation dialog (`confirmProceed`).
4. **Atomic write** — calls `atomicImport(backup)`, which uses
   `executeBatch()` to replace all four stores transactionally. On success,
   clears the stocks page cache and the HTTP cache. On failure, the transaction
   rolls back automatically.

`useBackupDialogs.ts` (composable) wraps both use cases and adds UI-level
snapshot / rollback: it saves a copy of all in-memory store items before
calling the use case and restores them if an error occurs.

---

## 14. Alert System

Alerts are the mechanism for all user-facing feedback (info, warning,
confirmation dialogs, and errors).

```
alertService.feedbackInfo(title, message, options?)
        │
        └─ alertsSink()              ← configured once in plugins/pinia.ts
                │                      returns useAlertsStore(pinia)
                └─ alertsStore.push(alertEntry)
                        │
                        └─ AlertOverlay.vue
                               polls alertsStore and renders v-alert / v-dialog
```

`alertService` rate-limits duplicate messages (1.5 s window) to prevent
flooding the user when an error is repeated in a fast loop.

`feedbackConfirm` returns a `Promise<boolean>` that resolves when the user
clicks OK or Cancel, enabling `await alertService.feedbackConfirm(…)` idiom
in use cases.

---

## 15. Routing & Views

The router uses **hash history** (`createWebHashHistory`), which works without
a server and is compatible with WebExtension URL schemes.

| Route | Path | Default view | Named slots |
|---|---|---|---|
| Home | `/` | `HomeContent` | `TitleBar`, `HeaderBar`, `InfoBar`, `FooterBar` |
| Company | `/company` | `CompanyContent` | `TitleBar`, `HeaderBar`, `InfoBar`, `FooterBar` |
| Privacy | `/privacy` | `PrivacyContent` | `TitleBar`, `HeaderBar` |
| Help | `/help` | `HelpContent` | `TitleBar`, `HeaderBar` |

`AppIndex.vue` renders five `<RouterView>` outlets: `title`, `header`, `info`,
`default`, and `footer`. Named outlets allow different views to share the same
chrome without duplication.

The router's `afterEach` hook syncs `runtime.currentView` so stores and
composables can react to navigation without coupling to `useRoute()`.

---

## 16. Key Architectural Patterns

### Ports & adapters in use cases

Use cases depend on **port interfaces** (`ports.ts`), not on stores directly.
`portAdapters.ts` contains adapter functions that translate a Pinia store into
the matching port interface:

```typescript
// ports.ts
export interface RecordsPort {
    accounts: { items: AccountDb[]; add(...): Promise<void>; … }
    stocks:   { add(...): Promise<void>; … }
    …
}

// portAdapters.ts
export function toRecordsPort(records: RecordsLike): RecordsPort { … }

// use site (a dialog composable)
await addStockUsecase({ records: toRecordsPort(records), … }, payload)
```

This keeps use cases testable without Pinia: pass any object that satisfies
the port interface.

### PersistDeps — shared use-case dependency bundle

Five use cases (accounts, bookings, bookingTypes, stocks, backup) all need the
same three ports. Rather than repeating the inline type, `ports.ts` exports:

```typescript
export type PersistDeps = {
    repositories: RepositoriesPort;
    records: RecordsPort;
    runtime: RuntimePort;
};
```

### Structural typing for store adapters

`RecordsLike` in `portAdapters.ts` is a duck-type interface, not an import of
the concrete store type. Any object with the right `.items` arrays and methods
satisfies it. This keeps the app layer free of Pinia imports.

### Single composition root

`container.ts` is the **only** file that imports concrete service
implementations. This is enforced by the architecture test. All other files
receive services via `useServices()` or the Pinia DI symbol.

---

## 17. Adding a Feature — Checklist

**New entity (e.g. a new database store):**

1. Add types to `src/domain/types/`.
2. Add constants (store name, defaults) to `src/domain/constants/`.
3. Write a repository in `src/adapters/secondary/database/repositories/`.
4. Register the repository in `factory.ts` and expose it from `service.ts`.
5. Add a Pinia store in `src/adapters/primary/stores/`.
6. Add the store to `records.ts` (init / clean lifecycle).
7. Extend `RecordsLike` and `RecordsPort` in `portAdapters.ts` / `ports.ts`.
8. Write use cases in `src/app/usecases/`.
9. Build Vue components in `src/adapters/primary/components/`.

**New settings preference:**

1. Add a key/default to `BROWSER_STORAGE` in `domain/constants/`.
2. Call `installStorageLocal` (already called on install; just add the new key).
3. Add state + getter + setter to `src/adapters/primary/stores/settings.ts`.
4. Expose a UI control in `OptionsIndex.vue`.

**New data provider:**

1. Add a provider file in `src/adapters/secondary/fetch/providers/`.
2. Register it in `src/adapters/secondary/fetch.ts`.
3. Add the provider key to `BROWSER_STORAGE.SERVICE` options.
4. Add a `<v-radio>` entry in the `ServiceSelector` component.

**Testing conventions:**

- Inject test doubles via `createServices(overrides)` or `attachStoreDeps(pinia, overrides)`.
- Mock `useServices()` with `vi.mock("@/adapters/secondary/context", …)` when
  testing composables that call `useServices()` directly.
- Use `setActiveTestPinia()` from `tests/unit/support/pinia.ts` as the
  standard Pinia setup in every unit test.
