# Source Root (`src/`)

This folder contains the full WebExtension application: Vue UI, domain logic, infrastructure services, and localized
strings.

The project uses the `@` path alias for `src/` (example: `@/adapters/driven/alertAdapter`).

## Layout

The source is organized into three layers:

### `domain/` — Pure business logic

- `domain/`: Business logic, validation, mapping, and error definitions.
- `domain/constants/`: Static configuration and stable identifiers used across layers.
- `domain/constants.ts`: Barrel re-export for constants.
- `domain/importExport/`: Domain-level import/export helpers (`validator.ts`).
- `domain/logic.ts`: Pure domain calculations (e.g., depot totals).
- `domain/mapping/`: Data mapping helpers (`formMapper.ts`).
- `domain/types/`: Layer-focused type modules:
    - `domain.ts` — persisted domain records.
    - `adapter.ts` — adapter/repository/DB-payload types.
    - `backup.ts` — backup file shape.
    - `ui.ts` — UI-facing form/alert option shapes (Vue/Vuetify boundary).
    - `uiLayer.ts` / `uiLayer/` — UI/store/component type surface.
- `domain/types.d.ts`: Public type surface (re-exports) used via `@/domain/types`.
- `domain/utils/`: Shared utilities (`url.ts`, `utils.ts`).
- `domain/validation/`: Validation rules, messages, duplicate checks, and validators.

### `app/` — Application orchestration

- `app/usecases/`: Multi-step workflows called by dialogs and views.

### `adapters/` — Adapter wiring

- `adapters/container.ts`: Full DI surface for app/options contexts.
- `adapters/containerBackground.ts`: Minimal DI surface for the background context (keeps bundle small).
- `adapters/context.ts`: `provideAdapters` / `useAdapters` — Vue DI bridge for the adapter surface.

### `adapters/ui/` — UI-facing adapters

- `adapters/ui/components/`: Reusable UI components and dialogs.
- `adapters/ui/views/`: Top-level screens (route targets and layout shells).
- `adapters/ui/composables/`: Vue composables for UI-facing orchestration.
- `adapters/ui/stores/`: Pinia state stores (leaf stores + aggregation stores `accounting`, `portfolio` + hub
  `recordsHub`).
- `adapters/ui/plugins/`: Vue plugin setup (Vuetify, Pinia, Router, i18n, themeSync, global components).
- `adapters/ui/entrypoints/`: HTML + TS entry points for app/options/background.
- `adapters/ui/assets/`: Static assets bundled by Vite.
- `adapters/ui/_locales/`: Translations (`messages.json` for WebExtension i18n, `gui.json` for Vue i18n).
- `adapters/ui/style.css`: Global styles.
- `adapters/ui/validationAdapter.ts`: Vuetify form validation rules (IBAN/ISIN/SWIFT checks, required/length/regex
  rules).

### `adapters/driven/` — Service-facing adapters

- `adapters/driven/database/`: IndexedDB persistence engine with connection management, transaction orchestration,
  migration logic, and per-entity repositories under `database/repositories/`.
- `adapters/driven/fetch/`: Network I/O layer with per-provider scrapers under `fetch/providers/`, shared HTTP utilities
  (`httpClient.ts`, `httpCache.ts`), and provider helpers (`providerUtils.ts`).
- `adapters/driven/*Adapter.ts`: Individual adapter implementations (app, alert, browser, favicon, importExport,
  storage, task).

## How Things Fit Together

- UI (`adapters/ui/views/`, `adapters/ui/components/`) reads/writes state via `adapters/ui/stores/`, uses
  `adapters/ui/composables/` for UI helpers, and calls `app/usecases/` for multistep workflows.
- `adapters/driven/` adapters perform I/O (IndexedDB, network, file download, etc.) and call into `domain/` for
  rules/validation.
- `domain/` defines stable rules and helper logic (including `AppError` + `ERROR_DEFINITIONS`).
- All adapters are wired via `adapters/container.ts` / `adapters/containerBackground.ts` and exposed to Vue via
  `adapters/context.ts`.

## Useful Commands (from repo root)

- TypeScript: `npm run test:typescript`
- Unit tests: `npm run test:unit`
- Lint: `npm run lint`
- Build: `npm run build:dev` / `npm run build:prod`

## Architecture

KontenManager is a Firefox web extension (Manifest V3) for managing investment portfolios. Users
track accounts, stocks, and bookings (transactions), and the extension fetches live market data
from several financial data providers. This section is the detailed architecture & developer guide
— it was originally the standalone `src/ARCHITECTURE.md`; it now lives here since this is the
first file a developer opens for a `src/`-wide overview, and there's no longer a second document to
keep in sync with it.

### Table of Contents

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
11. [Fetch Adapter & Online Data](#11-fetch-adapter--online-data)
12. [Browser Storage & Settings](#12-browser-storage--settings)
13. [Backup & Restore](#13-backup--restore)
14. [Alert System](#14-alert-system)
15. [Routing & Views](#15-routing--views)
16. [Key Architectural Patterns](#16-key-architectural-patterns)
17. [Adding a Feature — Checklist](#17-adding-a-feature--checklist)

---

### 1. Technology Stack

| Concern           | Technology                                |
|-------------------|-------------------------------------------|
| Extension format  | Firefox Manifest V3                       |
| UI framework      | Vue 3 (Composition API, `<script setup>`) |
| Component library | Vuetify 3                                 |
| State management  | Pinia                                     |
| Routing           | Vue Router 5 (hash history)               |
| Localisation      | Vue I18n                                  |
| Database          | IndexedDB (via custom repository layer)   |
| Build             | Vite                                      |
| Testing           | Vitest (unit) · Playwright (E2E)          |
| Language          | TypeScript (strict)                       |

---

### 2. Directory Structure

```
src/
├── adapters/                   ← everything framework- or browser-specific
│   ├── container.ts            ← composition root for the app/options contexts
│   ├── containerBackground.ts  ← minimal composition root for the background context
│   │
│   ├── ui/                     ← drives the application (UI layer)
│   │   ├── entrypoints/        ← bootstrap scripts (app.ts, background.ts, options.ts)
│   │   │                          and corresponding HTML shells
│   │   ├── views/              ← page-level Vue components (AppIndex, CompanyContent, …)
│   │   ├── components/         ← reusable Vue components and dialog components
│   │   ├── stores/             ← Pinia stores (settings, runtime, records, …)
│   │   ├── composables/        ← Vue composables (useOnlineStockData, useExportDialog, useImportDialog, …)
│   │   ├── plugins/            ← Vue plugins (pinia, router, i18n, vuetify, components)
│   │   ├── _locales/           ← i18n translation files (de, en)
│   │   └── validationAdapter.ts ← Vuetify form validation rules (ISIN / IBAN / BIC checks, …)
│   │
│   ├── context.ts              ← Vue provide/inject bridge (provideAdapters / useAdapters)
│   │
│   └── driven/                 ← driven by the application (infrastructure layer)
│       ├── alertAdapter.ts     ← alert / feedback adapter
│       ├── appAdapter.ts       ← 3-phase app initialisation adapter
│       ├── browserAdapter.ts   ← browser API wrapper (tabs, windows, downloads, …)
│       ├── faviconAdapter.ts   ← favicon caching
│       ├── fetchAdapter.ts     ← market-data HTTP adapter (multi-provider + cache)
│       ├── importExportAdapter.ts ← backup serialisation & validation
│       ├── storageAdapter.ts   ← browser.storage.local wrapper
│       ├── taskAdapter.ts      ← task scheduling
│       ├── types.ts            ← re-exports of shared adapter types
│       └── database/           ← IndexedDB: connection, repositories, migrations,
│                                  transactions, batch operations, health checks
│
├── app/                        ← application core (framework-agnostic)
│   └── usecases/               ← use-case functions (accounts, stocks, bookings, bookingTypes)
│       ├── backup/             ← export / import use cases and their helpers
│       ├── records/            ← records store initialisation (init.ts)
│       ├── ports.ts            ← port interfaces consumed by use cases
│       └── portAdapters.ts     ← adapts Pinia stores to port interfaces
│
└── domain/                     ← pure business rules (no framework, no browser)
    ├── constants/              ← INDEXED_DB, BROWSER_STORAGE, CACHE_POLICY, BOOKING_TYPE_ROLE, …
    ├── types/                  ← all TypeScript interfaces (AccountDb, StockItem, …)
    ├── errors.ts               ← AppError class and error definitions
    ├── logic.ts                ← pure domain calculations (e.g. FIFO cost basis, depot totals)
    ├── importExport/           ← import/export transform & validation helpers
    ├── mapping/                ← form ↔ domain data mapping helpers
    ├── utils/                  ← pure utility functions (isoDate, toNumber, log, sanitizeExternalUrl, …)
    └── validation/             ← checksum validators (ISIN, IBAN, BIC), Vuetify rules,
                                   duplicate checks, referential-integrity checks

tests/
├── unit/                       ← Vitest unit & integration tests
└── e2e/                        ← Playwright end-to-end tests
```

---

### 3. Architecture Layers

The project follows **hexagonal architecture** (ports & adapters). Dependencies always point inward:
`adapters → app → domain`. No layer may import from a layer outside it.

```
┌─────────────────────────────────────────────────────┐
│                      adapters/                       │
│                                                     │
│   ui/                ──────►   driven/              │
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

The **architecture test** (`tests/unit/architecture.test.ts`) enforces these rules at CI time:

- UI code (`ui/components`, `views`, `composables`, `plugins`) must not import concrete driven services — only `context`
  (service locator) and
  `types`.
- Only `entrypoints/` and `driven/` may import the DI container.
- Use cases must not import Vue, Pinia, or anything from `@/adapters/` — the inward-pointing rule, checked against
  parsed import specifiers rather than by regex over the file text.

---

### 4. Extension Contexts

A Firefox extension runs in **three isolated JavaScript contexts**. Each has its own entry point and its own composition
root.

| Context        | Entry point                             | HTML shell        | Purpose                                          |
|----------------|-----------------------------------------|-------------------|--------------------------------------------------|
| **App**        | `adapters/ui/entrypoints/app.ts`        | `app.html`        | Main popup / full-screen app tab                 |
| **Background** | `adapters/ui/entrypoints/background.ts` | `background.html` | Service worker: lifecycle events + toolbar click |
| **Options**    | `adapters/ui/entrypoints/options.ts`    | `options.html`    | Extension settings page                          |

Contexts cannot share JavaScript objects; they communicate via
`browser.storage.local` and `browser.runtime`.

---

### 5. Startup Flow — App Context

```
adapters/ui/entrypoints/app.ts
│
├─ createAdapters()          ← build the full adapter container
├─ ensureSingleAppTab(browserAdapter)
│       ├─ another app tab already open → focus it, close this tab, STOP (no mount)
│       └─ this tab is the sole/surviving one → continue
├─ createAppPinia(adapters)  ← create Pinia, wire store deps, configure alert sink
├─ createI18nPlugin(...)
├─ provideAdapters(app, adapters)   ← make adapters available to the Vue tree
├─ app.use(pinia, i18n, router, vuetify, components)
├─ startThemeSync(...)
└─ app.mount("#app")
        │
        └─ AppIndex.vue  onBeforeMount
               │
               └─ appAdapter.initializeApp(stores, translations, signal)
                      │
                      ├─ Phase 1 — Storage
                      │     storageAdapter.getStorage()
                      │     settingsStore.init(storageData)
                      │
                      ├─ Phase 2 — Database
                      │     databaseAdapter.connect()
                      │     databaseAdapter.getAccountRecords(activeAccountId)
                      │     recordsStore.init(dbData, translations)
                      │
                      └─ Phase 3 — External data (non-critical, allSettled)
                            fetchAdapter.fetchExchangesData()
                            fetchAdapter.fetchIndexData()
                            fetchAdapter.fetchMaterialData()
```

**Key points:**

- Phases run sequentially. Storage must succeed before the database is opened; the database must be ready before records
  are loaded.
- Phase 3 uses `Promise.allSettled`, so a failed network request does not prevent the app from rendering.
- An `AbortController` is created in `AppIndex` and canceled in `onUnmounted`, so in-flight requests are aborted on
  navigation.
- A spinner is shown until `isInitialized` becomes `true`.
- **At most one app tab is allowed to exist at a time** — `records`/`settings` are plain in-memory Pinia state with no
  cross-tab synchronization. So two simultaneously open app tabs could silently drift out of sync with each other (and
  with the database) as each make its own independent writes. Rather than reconciling that state across tabs,
  `ensureSingleAppTab()` (`entrypoints/singleTabGuard.ts`) prevents a second one from ever mounting: if another app tab
  is already open, this tab focuses it and closes itself instead of proceeding. A deterministic tie-breaker (lowest tab
  id survives) is used so two tabs opened at nearly the same moment independently agree on the same outcome. This
  complements `background.ts`'s `onClick` handler below, which only cleans up duplicates reactively on a toolbar click;
  this check also catches a tab opened any other way (duplicated tab, manual navigation to the app URL, a browser
  session restore reopening more than one saved app tab).

---

### 6. Startup Flow — Background Context

```
adapters/ui/entrypoints/background.ts
│
├─ createBackgroundAdapters()   ← minimal container: browserAdapter + storageAdapter only
│
├─ browserAdapter.runtimeOnInstalled(onInstall)
│       └─ storageAdapter.installStorageLocal()
│               └─ writes all BROWSER_STORAGE defaults on first install / update
│
├─ browserAdapter.actionOnClicked(onClick)
│       └─ tabsQuery() to find existing app tabs
│              ├─ none found  → tabsCreate()  (opens a new tab)
│              └─ found       → windowsUpdate() + tabsUpdate()  (focus the first tab)
│                                + removeTab() for any duplicate tabs
│
└─ browserAdapter.tabsOnCreated(onTabCreated)   ← fires for every new tab in the browser
        └─ isAppTabUrl(tab.url)?
               ├─ no  → ignore (not our page)
               └─ yes → singleTabGuard.ts's closeDuplicateAppTab()
                              └─ another app tab already exists?
                                     ├─ no  → nothing to do
                                     └─ yes → focus it, close this new tab immediately
```

There's no WebExtension API to remove or disable a native browser context-menu item — so the "Duplicate
Tab" action can't be blocked directly. `tabsOnCreated` is what makes it harmless instead: duplicating the
app tab copies its URL onto the new tab immediately (unlike a blank new tab), so `isAppTabUrl` recognizes
it synchronously and `closeDuplicateAppTab()` closes it before it even finishes loading. See §5's note
above for how this relates to `ensureSingleAppTab()`'s startup-time check in `app.ts`, which is the
fallback for any tab-creation path where the URL isn't known yet at this point (e.g. a blank new tab
manually navigated to the app's URL) — together, the three mechanisms (`onClick`, `onTabCreated`,
`ensureSingleAppTab`) keep at most one app tab open regardless of how a second one might otherwise appear.

The background bundle is deliberately kept small: only `browserAdapter` and
`storageAdapter` are included to avoid pulling in the full adapter graph.

---

### 7. Startup Flow — Options Context

```
adapters/ui/entrypoints/options.ts
│
├─ createAdapters()
├─ createAppPinia(adapters)
├─ provideAdapters(app, adapters)
├─ app.use(pinia, i18n, vuetify)
├─ useSettingsStore(pinia).load()   ← manual init (no appAdapter bootstrap)
├─ startThemeSync(...)
└─ app.mount("#options")
        └─ OptionsIndex.vue
```

The options page skips the full three-phase bootstrap: no database connection, no records loading. Only settings are
initialized so the preference tabs can read and persist values.

---

### 8. Dependency Injection

The project uses two complementary DI mechanisms:

#### 8.1 Service container (composition root)

`src/adapters/container.ts` creates all secondary adapters and returns them as a plain object:

```typescript
const adapters = createAdapters(overrides)
// { browserAdapter, databaseAdapter, fetchAdapter, alertAdapter,
//   storageAdapter, repositories, appAdapter, … }
```

`overrides` accepts test doubles for any adapter, enabling unit tests without real IndexedDB or network calls.

`container.ts` is the **only** file allowed to import concrete adapter implementations. Everything else receives
adapters through the mechanisms below.

#### 8.2 Vue provide / inject (for components and composables)

```typescript
// entrypoint
provideAdapters(app, adapters)  // context.ts

// any component or composable
const { fetchAdapter, alertAdapter } = useAdapters()
```

`useAdapters()` calls Vue's `inject()` internally. Because it uses Vue's injection system, it only works inside
`setup()` or a composable called from
`setup()`.

#### 8.3 Pinia symbol-based DI (for stores)

Stores cannot use `inject()` because they run outside Vue's component tree.
`src/adapters/ui/stores/deps.ts` provides a symbol-keyed side-channel:

```typescript
// wired once per Pinia instance (plugins/pinia.ts)
attachStoreDeps(pinia, { storageAdapter, alertAdapter })

// retrieved inside a store definition, via that store's own accessor
const { storageAdapter, alertAdapter } = getSettingsStoreDeps()
```

This avoids circular imports between stores and adapters.

Stores use a **per-store accessor** (`getSettingsStoreDeps()`), not the shared
`getStoreDeps()` it delegates to, so each store only "sees" what it actually
depends on — see the note in `stores/deps.ts`. Add a sibling accessor when a new
store needs dependencies.

#### 8.4 Alert sink (two-phase wiring)

`alertAdapter` is created before Pinia (because Pinia needs it), but rendering alerts requires `useAlertsStore`. The
wiring is deferred:

```typescript
// plugins/pinia.ts, after createPinia()
adapters.alertAdapter.configureAlertSink(() => useAlertsStore(pinia))
```

`alertAdapter` calls the sink lazily the first time feedback is requested, breaking the circular dependency.

---

### 9. State Management

#### Store overview

| Store          | Persistence             | Purpose                                                               |
|----------------|-------------------------|-----------------------------------------------------------------------|
| `settings`     | browser.storage.local   | User preferences (theme, provider, active account, pagination)        |
| `runtime`      | memory only             | Volatile UI state (current view, dialogs, exchange rates, page cache) |
| `recordsHub`   | memory (loaded from DB) | Hub: owns and coordinates all entity sub-stores                       |
| `accounts`     | memory                  | AccountDb items                                                       |
| `stocks`       | memory                  | Stock items (includes mutable online fields: mValue, mMin, mMax)      |
| `bookings`     | memory                  | BookingDb items                                                       |
| `bookingTypes` | memory                  | BookingTypeDb items                                                   |
| `portfolio`    | derived (computed)      | Active + passive stock lists; sumDepot calculation                    |
| `accounting`   | derived (computed)      | Per-account sums, gains, and yields                                   |
| `alerts`       | memory                  | Queue of pending alert messages for the AlertOverlay                  |

#### Settings auto-persistence

Every settings setter calls `storageAdapter().setStorage(key, value)` so preferences are durable across extension
restarts. Cross-context sync is handled by `addStorageChangedListener`: when the options page changes a setting, the app
context picks it up automatically.

#### Runtime page cache

`runtime.loadedStocksPages` is a `Set<number>` tracking which portfolio pages have up-to-date online prices.
`runtime.loadedStocksPagesAt` stores the timestamp. `isStocksPageFresh(page, maxAgeMs)` combines both to decide whether
a network request is needed. Cache is cleared by `clearStocksPages()` whenever the account, provider, or pagination
settings change.

#### Records initialization

`recordsStore.init(dbData, translations)` populates all entity stores from the data returned by the database service. On
account switch the store calls
`clean()` then `init()` again with data for the new account.

---

### 10. Database

The extension stores all user data in **IndexedDB** (database name
`kontenmanager.db`, current schema version 30 — `INDEXED_DB.CURRENT_VERSION`).
`INDEXED_DB.MIN_SUPPORTED_VERSION` is 27: backups written by older schema versions are rejected on import.

#### Object stores

| Store          | Key   | Content                                                |
|----------------|-------|--------------------------------------------------------|
| `accounts`     | `cID` | Bank / brokerage accounts (IBAN, BIC, logo URL)        |
| `stocks`       | `cID` | Securities (ISIN, symbol, company, URL, meeting dates) |
| `bookings`     | `cID` | Transactions (buy, sell, dividend, fee, tax, …)        |
| `bookingTypes` | `cID` | Transaction type labels per account, each with a `cRole` |

#### Layers inside `driven/database/`

```
database/
├── databaseAdapter.ts      ← public API: connect(), disconnect(), getAccountRecords(),
├── connectionManager.ts    ← opens / upgrades / closes the IDBDatabase
├── migrator.ts             ← runs schema migrations on version upgrade
├── transactionManager.ts   ← wraps IDB transactions with Promise API
├── batchOperations.ts      ← atomic multi-step write operations
├── healthChecker.ts        ← integrity checks and repair routines
└── repositories/
    ├── baseRepository.ts   ← shared save / delete / query helpers
    ├── accountRepository.ts
    ├── stockRepository.ts
    ├── bookingRepository.ts
    ├── bookingTypeRepository.ts
    └── repositoryFactory.ts  ← creates all repositories from a single IDBDatabase instance
```

#### Booking-type roles

A booking type carries a semantic `cRole` (`BOOKING_TYPE_ROLE` in `domain/constants`): `buy`, `sell`,
`dividend`, or `other`. Domain logic resolves a type by role (`resolveTypeIdByRole` in `logic.ts`), never by a
fixed numeric `cID` — `cID` auto-increments globally rather than per account, so a hardcoded id is only ever
correct for the first depot account created in a given IndexedDB instance.

Rules that follow from this:

- Creating a depot account seeds Buy/Sell/Dividend types with explicit roles
  (`createDefaultBookingTypes` in `usecases/accounts.ts`). Flipping an existing account's `withDepot` on seeds
  only the roles it is still missing, so toggling it off and on again cannot create duplicates.
- A `buy` / `sell` / `dividend` role must stay **unique per account**. `updateBookingTypeUsecase` returns
  `{status: "roleConflict"}` rather than saving a second same-role type, because `resolveTypeIdByRole` resolves
  only the first match and bookings under any later duplicate would silently vanish from portfolio, invest, and
  dividend totals. `other` is exempt — arbitrarily many custom types are fine.
- Schema migration 28 (`backfillBookingTypeRoles` in `migrator.ts`) stamps `cRole` onto pre-existing rows,
  inferring the legacy role from the old id/name pair.
- Schema migration 30 (`collapseBookingCreditDebitFields` in `migrator.ts`) collapses each of the 5 tax/fee
  Credit/Debit pairs on a booking (`cSoli`, `cTax`, `cFee`, `cSourceTax`, `cTransactionTax`) into the single
  signed column described below under §12.1 Currency. Lossless, since the two halves were already mutually
  exclusive per booking.

#### Transactions

All multistep writes go through the transaction manager so they are atomic.
`executeBatch()` is the entry point for use-case–level operations (e.g. importing a backup atomically replaces all four
stores).

---

### 11. Fetch Adapter & Online Data

#### Providers

Six financial data providers are supported, plus a `none` entry that disables online price fetching
(`FETCH.PROVIDERS`, keyed `none` / `wstreet` / `fnet` / `acheck` / `goyax` / `ard` / `tgate`):

| Key       | Provider          | Key data                                      |
|-----------|-------------------|-----------------------------------------------|
| `none`    | Disabled          | no requests — online price fetching is off    |
| `wstreet` | Wallstreet-Online | min / current / max prices                    |
| `fnet`    | Finanzen.Net      | min / current / max prices                    |
| `acheck`  | Aktien-Check      | min / current / max prices                    |
| `goyax`   | Goyax             | min / current / max prices                    |
| `ard`     | ARD               | min / current / max prices                    |
| `tgate`   | Tradegate         | current price only (min/max are not returned) |

`none` is a first-class, user-selectable option (it appears in `ServiceSelector` like any other), which is also
what the E2E suite selects so tests never hit the real network for quotes. It suppresses **quote** fetching
only — startup Phase 3 (exchanges / indexes / commodities) does not consult `settings.service`, which is why
E2E tests additionally block external requests at the network layer (see `tests/README.md`).

The active provider is stored in `settings.service`. The fetch service routes requests to the correct provider and falls
back gracefully when a request fails. Meeting / quarterly-report dates are **not** provider-selectable: they are always
fetched from Finanzen.Net (`fetchDateData` in `fetchAdapter.ts`
hits the `FNET.SEARCH` / `FNET.DATES` endpoints directly), regardless of which provider is active for price quotes.

Commodity/material prices and market index levels are a further exception: they share their **own**,
independent data-source setting, `settings.marketDataService` (`BROWSER_STORAGE.MARKET_DATA_SERVICE`, key
`sMarketDataService`, UI: `MarketDataServiceSelector` on the **Services** tab, not on the Indexes or
Commodities tabs) — not `settings.service`, and not affected by it. One setting for both by design: materials
and indexes always use the same source rather than being independently selectable (they used to be two separate
settings; merged on request). It supports two sources, finanzen.net remaining the default (unchanged behavior
for existing installs) because it sits behind Akamai bot protection that intermittently 403s both calls:

| Key       | Provider          | Materials (`fetchMaterialData`)                                        | Indexes (`fetchIndexData`)                                        |
|-----------|-------------------|--------------------------------------------------------------------------|-----------------------------------------------------------------------|
| `fnet`    | Finanzen.Net      | Default. One request, `FNET.MATERIALS` overview table.                 | Default. One request, `FNET.INDEXES` overview table.                |
| `wstreet` | Wallstreet-Online | Opt-in. One request per configured material (`fetchMaterialDataWstreet`, `providers/wstreetMaterials.ts`), scraping `wallstreet-online.de/rohstoffe/<slug>`. Only accepts a page whose quote is explicitly marked USD — two commodities (aluminum, lead, as of this writing) are quoted there in index points ("PKT") rather than a real price and are silently skipped rather than mislabeled. | Opt-in. One request per configured index (`fetchIndexDataWstreet`, `providers/wstreetIndexes.ts`), scraping `wallstreet-online.de/indizes/<slug>`. No currency check needed — index levels are plain points, not a currency amount. |

Both scrapers scope their DOM lookups to the page's `#quoteBoxMarker`, not a document-global selector: every
wallstreet-online.de instrument page also carries a "Kursleiste" ticker-ribbon widget (other instruments) above
the page's own quote box, and that widget's rows render a `.quote_currency` span of their own too (for the
%-change figure, literal text `"%"`). An unscoped `.quote_currency` lookup is what the materials fetcher
originally shipped with — it picked up the ribbon's `"%"` on every page, rejected every material as non-USD, and
left the InfoBar empty on every single load, not intermittently. `#quoteBoxMarker` scoping is what fixed it.

Three of the eighteen indexes previously configured (`straits`/Straits Times, `asx`/Australia All Ordinaries,
`rts`/RTS) were dropped from the app entirely rather than partially supported: wallstreet-online.de has no page
at all for the first two, and no live quote box for the third. Tin (`sn`) was dropped from materials for the
same reason (see `WSTREET_MATERIAL_SLUGS`' comment).

#### Cache layers

1. **HTTP response cache** (`driven/fetch/httpCache.ts`) — caches raw HTTP responses by URL with a configurable TTL
   (`CACHE_POLICY.DEFAULT_HTTP_TTL_MS`
   = 5 min, `CACHE_POLICY.QUOTE_TTL_MS` = 1 min).
2. **UI page freshness cache** (`runtime.loadedStocksPages`) — tracks which portfolio pages have been loaded within
   `CACHE_POLICY.ONLINE_RATES_MAX_AGE_MS`
   (1 min). Pages outside the window trigger a new network request.

#### Online data flow

```
useOnlineStockData.loadOnlineData(page)
│
├─ Compute ISINs for the requested page (via portfolio.active + settings.stocksPerPage)
├─ Identify stocks needing date refresh (meeting / quarter day overdue)
│
├─ Promise.all([
│     fetchAdapter.fetchMinRateMaxData(isinList, getStorage),
│     fetchAdapter.fetchDateData(isinDatesNeeded)
│   ])
│
├─ Apply currency conversion
│     resolveDisplayCurrency(accounts, activeAccountId, settings.currency)
│       → the ACTIVE ACCOUNT's cCurrency (NOT the UI locale)
│     stockCur vs targetCur → divisor from runtime.curUsd / runtime.curEur
│
├─ Write mMin, mValue, mMax back into stocks.items (in place)
│     (mChange is NOT written here — portfolio.active derives it)
├─ Write updated meeting / quarter dates back into stocks.items
└─ runtime.markStocksPageLoaded(page)
```

`useOnlineStockData` exposes three functions:

- `loadOnlineData(page)` — loads a single page if not already fresh.
- `refreshOnlineData(page)` — forces a reload of one page.
- `refreshAllOnlineData()` — reloads all pages that have holdings.

Cache invalidation watchers run **once** in `AppIndex.vue` (not per call site — it is the app shell, so its watchers
live for the whole session, where a route component's exist only while that route is mounted):

```typescript
watch(() => settings.service,         () => { runtime.clearStocksPages(); fetchAdapter.clearCache?.() })
watch(() => settings.activeAccountId, () => runtime.clearStocksPages())
watch(() => settings.stocksPerPage,   () => runtime.clearStocksPages())

// The display currency needs more than invalidation — see §12.1.
watch(displayCurrency, async () => {
    if (!isInitialized.value) return          // boot's Phase 3 owns the first fetch
    await appAdapter.refreshExchangeRates({records, settings, runtime}, signal)
    runtime.clearStocksPages()                // AFTER the await, never before
})
```

---

### 12. Browser Storage & Settings

`browser.storage.local` holds user preferences as flat key-value pairs. All keys and their defaults are defined in
`domain/constants` as `BROWSER_STORAGE`:

| Key constant         | Default                  | Meaning                    |
|----------------------|--------------------------|----------------------------|
| `ACTIVE_ACCOUNT_ID`  | `-1`                     | Currently selected account |
| `SKIN`               | `"ocean"`                | UI theme                   |
| `SERVICE`            | `"wstreet"`              | Data provider              |
| `CURRENCY`           | `"EUR"`                  | Default currency for new accounts (see §12.1) |
| `BOOKINGS_PER_PAGE`  | `9`                      | Pagination                 |
| `STOCKS_PER_PAGE`    | `9`                      | Pagination                 |
| `DIVIDENDS_PER_PAGE` | `9`                      | Pagination                 |
| `SUMS_PER_PAGE`      | `11`                     | Pagination                 |
| `EXCHANGES`          | `["EURUSD"]`             | Displayed exchange rates   |
| `INDEXES`            | `["dax", "dow"]`         | Displayed market indexes   |
| `MATERIALS`          | `["au", "brent"]`        | Displayed commodity prices |
| `MARKETS`            | `["Frankfurt", "XETRA"]` | Displayed markets          |

`storageAdapter.installStorageLocal()` writes all defaults on first install (or after an extension update that adds new
keys). This is called by the background script's `onInstalled` handler.

#### 12.1 Currency

**Currency is a property of the account, not of the UI language.** These are independent facts about a user — someone
can run an English-language browser and hold euros — and the app used to conflate them, deriving the currency from
`browserAdapter.getUserLocale()`. That put every eurozone user whose browser was not German onto USD and converted
their EUR quotes by the USD/EUR rate to get there.

Three pieces:

| Piece | Where | Role |
|-------|-------|------|
| `AccountDb.cCurrency` | per account, edited in `AccountForm` | What that account's booking amounts **are**, and the target a quote is converted into |
| `BROWSER_STORAGE.CURRENCY` | app-level, edited in `OptionsIndex` | Default for a newly created account; display fallback when no account is active |
| `resolveDisplayCurrency()` | `domain/logic.ts` | The single definition combining the two — active account wins, app default is the fallback |

All three consumers read that one function, so the conversion target and the printed symbol cannot drift apart:

- `useOnlineStockData` — divides the fetched quote by the FX rate unless the quote is already in that currency.
- `appAdapter.fetchExternalData` — requests exactly the two pairs (`${currency}USD`, `${currency}EUR`) that the divisor
  chain can consume; the self-pair is dropped and its rate seeded to 1.
- `appAdapter.refreshExchangeRates` — the same pair derivation and write-back, callable on its own (both share
  `resolveBaseExchangePairs` / `applyBaseExchangeResult`, so the rule has one definition). See below for why.
- `plugins/currencySync.ts` — rewrites the i18n `currency`/`currency3` number formats via `mergeNumberFormat`, so all
  ~13 `n(value, "currency")` call sites stay correct without knowing about any of this.

**The divisors must be re-fetched when the display currency changes, not only at boot.** `runtime.curUsd`/`curEur` are
written by `fetchExternalData`, which is Phase 3 of `initializeApp` and runs once at mount — so the pairs it fetches
come from whichever currency was active *then*, and the self-pair is seeded to `1`. Switching to an account with the
other `cCurrency` therefore left one divisor a stale rate and the other a `1` that no longer applied, and a EUR-quoted
stock displayed its EUR price verbatim as USD (or the mirror image). Silently: the only guard downstream is
`rawDivisor > 0`, which a stale-but-positive rate passes, and `currencySync` had already relabelled every figure with
the new symbol — so the label was right and the number was wrong.

`AppIndex` closes this with a watcher on `resolveDisplayCurrency(...)` — the same expression `currencySync` watches, so
the conversion target and the printed symbol cannot drift apart. Three details are load-bearing:

- **Both** divisors reset to `1` on every resolve, not just the self-pair. A failed fetch must not leave the previous
  currency's rate converting; `1` shows the quote unconverted, the fallback `useOnlineStockData` and `InfoBar` already use.
- `clearStocksPages()` runs **after** the await. Before it, the re-fetch would convert with the divisors being replaced;
  it is also what supersedes in-flight loads, since it bumps every page's generation.
- The watcher is gated on `isInitialized`, because Phase 2 loading the accounts is itself a currency change and Phase 3
  already reads the post-Phase-2 value.

Note `updateAccountUsecase.clearStocksPages()` is **not** sufficient on its own for a `cCurrency` edit — it makes the
next render re-fetch, but the re-convert uses these divisors, which only the watcher updates.

The **locale still owns formatting** — separators, grouping, symbol placement — which is what a locale should own.
`Intl.NumberFormat` takes locale and currency independently: `en-US` + EUR renders `€1,234.56`, `de-DE` + EUR renders
`1.234,56 €`.

`CURRENCIES.SUPPORTED` is `["EUR", "USD"]` and deliberately short: conversion needs a live rate, and only those two are
fetched. A quote scraped in a third currency (`providerUtils` resolves CAD/AUD/NZD/HKD/SGD correctly) falls through
with `divisor = 1`, i.e. unconverted — honest, but not converted. Widen the list only together with the rate-fetching
side.

**Stored booking amounts are never converted.** `cDebit`/`cCredit` and the five tax/fee fields (`cSoli`, `cTax`,
`cFee`, `cSourceTax`, `cTransactionTax` — each a single signed column since schema 30, sign encoding debit vs. credit)
are persisted exactly as entered, and `cCurrency` records which currency that was. Converting on write would destroy the transaction's real
amount (breaking reconciliation against a broker statement, and German reporting, which wants the rate at the
*transaction* date), would be irreversible, and would do so at whatever spot rate happened to be live — `runtime.curUsd`
falls back to `1` when the FX fetch fails, which on a write path would silently persist a USD figure as EUR.

---

### 13. Backup & Restore

#### Export

`exportDatabaseUsecase` serialises all four entity stores to a JSON file (`ModernBackupData` format) and triggers a
browser download.

#### Import

`importDatabaseUsecase` is the most complex use case. It runs four phases:

1. **Read & validate** — reads the JSON file, validates the top-level structure and schema version.
2. **Integrity check** — calls `validateDataIntegrity`.
3. **Confirm** — shows a confirmation dialog (`confirmProceed`).
4. **Atomic write** — calls `atomicImport(backup)`, which uses
   `executeBatch()` to replace all four stores transactionally. On success, clears the stocks page cache and the HTTP
   cache. On failure, the transaction rolls back automatically.

`useExportDialog.ts` (`useExportDatabaseDialogController`) and
`useImportDialog.ts` (`useImportDatabaseDialogController`) wrap the export and import use cases respectively.
`useImportDialog.ts` adds UI-level snapshot / rollback (`createRollbackPoint` / `restoreFromRollback`): it saves a copy
of all in-memory store items before calling `importDatabaseUsecase` and restores them if an error occurs.

---

### 14. Alert System

Alerts are the mechanism for all user-facing feedback (info, warning, confirmation dialogs, and errors).

```
alertAdapter.feedbackInfo(title, message, options?)
        │
        └─ alertsSink()              ← configured once in plugins/pinia.ts
                │                      returns useAlertsStore(pinia)
                └─ alertsStore.push(alertEntry)
                        │
                        └─ AlertOverlay.vue
                               polls alertsStore and renders v-alert / v-dialog
```

`alertAdapter` rate-limits duplicate messages (1.5 s window) to prevent flooding the user when an error is repeated in a
fast loop.

`feedbackConfirm` returns a `Promise<boolean>` that resolves when the user clicks OK or Cancel, enabling
`await alertAdapter.feedbackConfirm(…)` idiom in use cases.

---

### 15. Routing & Views

The router uses **hash history** (`createWebHashHistory`), which works without a server and is compatible with
WebExtension URL schemes.

| Route   | Path       | Default view     | Named slots                                     |
|---------|------------|------------------|-------------------------------------------------|
| Home    | `/`        | `HomeContent`    | `TitleBar`, `HeaderBar`, `FooterBar`            |
| Company | `/company` | `CompanyContent` | `TitleBar`, `HeaderBar`, `InfoBar`, `FooterBar` |
| Privacy | `/privacy` | `PrivacyContent` | `TitleBar`, `HeaderBar`, `FooterBar`            |
| Help    | `/help`    | `HelpContent`    | `TitleBar`, `HeaderBar`, `FooterBar`            |

`AppIndex.vue` renders five `<RouterView>` outlets: `title`, `header`, `info`,
`default`, and `footer`. Named outlets allow different views to share the same chrome without duplication.

The router's `afterEach` hook syncs `runtime.currentView` so stores and composables can react to navigation without
coupling to `useRoute()`.

---

### 16. Key Architectural Patterns

#### Ports & adapters in use cases

Use cases depend on **port interfaces** (`ports.ts`), not on stores directly.
`portAdapters.ts` contains adapter functions that translate a Pinia store into the matching port interface:

```typescript
// ports.ts
export interface RecordsPort {
    accounts: { items: AccountDb[]; add(): Promise<void>; }
    stocks: { add(): Promise<void>; }
}

// portAdapters.ts
export function toRecordsPort(records: RecordsLike): RecordsPort {
}

// use site (a dialog composable)
await addStockUsecase({records: toRecordsPort(records),}, payload)
```

This keeps use cases testable without Pinia: pass any object that satisfies the port interface.

#### Write rules live in the use case, not the call site

Every write to a stock or booking has two consequences of the row itself: the dialog teleport is reset, and the
stock page freshness cache is invalidated (`RuntimePort.clearStocksPages`). Both belong to the *operation*, not to
whichever UI happens to trigger it, so they live in the use case.

This matters because each entity has more than one entry point — a stock can be added from `AddStock.vue`, edited from
`UpdateStock.vue`, reactivated from `FadeInStock.vue`, and deleted from the dot menu (`useMenu.ts`). Every one of those
paths goes through the matching use case, so none of them can forget a consequence. Preconditions work the same way:
`addStockUsecase` rejects a stock whose `cAccountNumberID` is unset rather than trusting each dialog to check first.

The one deliberate asymmetry is that `addBookingUsecase` does **not** reset the teleport, because `AddBooking.vue` keeps
its dialog open for the next entry; this is commented at the use case and covered by a test.

#### PersistDeps — shared use-case dependency bundle

Five use cases (accounts, bookings, bookingTypes, stocks, backup) all need the same three ports. Rather than repeating
the inline type, `ports.ts` exports:

```typescript
export type PersistDeps = {
    repositories: RepositoriesPort;
    records: RecordsPort;
    runtime: RuntimePort;
};
```

#### Structural typing for store adapters

`RecordsLike` in `portAdapters.ts` is a duck-type interface, not an import of the concrete store type. Any object with
the right `.items` arrays and methods satisfies it. This keeps the app layer free of Pinia imports.

#### Single composition root

`container.ts` is the **only** file that imports concrete adapter implementations. This is enforced by the architecture
test. All other files receive adapters via `useAdapters()` or the Pinia DI symbol.

---

### 17. Adding a Feature — Checklist

**New entity (e.g. a new database store):**

1. Add types to `src/domain/types/`.
2. Add constants (store name, defaults) to `src/domain/constants/`.
3. Write a repository in `src/adapters/driven/database/repositories/`.
4. Register the repository in `repositoryFactory.ts` and expose it from `databaseAdapter.ts`.
5. Add a Pinia store in `src/adapters/ui/stores/`.
6. Add the store to `recordsHub.ts` (init / clean lifecycle).
7. Extend `RecordsLike` and `RecordsPort` in `portAdapters.ts` / `ports.ts`.
8. Write use cases in `src/app/usecases/`.
9. Build Vue components in `src/adapters/ui/components/`.

**New settings preference:**

1. Add a key/default to `BROWSER_STORAGE` in `domain/constants/`.
2. Call `installStorageLocal` (already called on install; just add the new key).
3. Add state + getter + setter to `src/adapters/ui/stores/settings.ts`.
4. Expose a UI control in `OptionsIndex.vue`.

**New data provider (stock quotes):**

1. Add a provider file in `src/adapters/driven/fetch/providers/`.
2. Register it in `src/adapters/driven/fetchAdapter.ts`.
3. Add the provider key to `FETCH.PROVIDERS` in `domain/constants/`. `ServiceSelector`
   generates its `<v-radio>` list automatically from `Object.keys(FETCH.PROVIDERS)`, so no separate UI change is
   needed. Its label comes from the entry's `NAME`; only the `none` pseudo-provider is translated, via
   `createServiceLabelOverrides` in `domain/constants/ui/options.ts` — real providers are brand names and stay
   untranslated in every locale.

**New market-data source (commodities/indexes)**: a related but distinct recipe — `MarketDataServiceName` /
`settings.marketDataService` is its own, narrower selection (currently `"fnet"` / `"wstreet"`), NOT auto-generated
from `FETCH.PROVIDERS` the way `ServiceSelector`'s list is (most `FETCH.PROVIDERS` keys, e.g. `goyax`/`acheck`,
never supplied commodities or indexes). Adding a third source means: a new `providers/wstreetMaterials.ts`-shaped
file, a branch in `fetchAdapter.ts`'s `fetchMaterialData`/`fetchIndexData`, and adding the key to
`MarketDataServiceSelector.vue`'s hardcoded `MARKET_DATA_SERVICES` array by hand.

**Testing conventions:**

- Inject test doubles via `createAdapters(overrides)` or `attachStoreDeps(pinia, overrides)`.
- Mock `useAdapters()` with `vi.mock("@/adapters/context", …)` when testing composables that call `useAdapters()`
  directly.
- Use `setActiveTestPinia()` from `tests/unit/support/pinia.ts` as the standard Pinia setup in every unit test.

---

*Architecture section merged into this README from `src/ARCHITECTURE.md`: 2026-08-13.*

## Directory Structure

### Directories

- `adapters/`
- `app/`
- `domain/`

### Files

- `vue-shims.d.ts`: (default)

