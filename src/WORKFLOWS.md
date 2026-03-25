# KontenManager — Detailed Workflows & Extension Processing

This document describes every user-facing workflow in KontenManager, the user actions involved, and the internal
processing steps the extension performs in response.

---

## Table of Contents

1. [Extension Startup](#1-extension-startup)
2. [Account Management](#2-account-management)
3. [Transaction (Booking) Management](#3-transaction-booking-management)
4. [Booking Type Management](#4-booking-type-management)
5. [Stock Portfolio Management](#5-stock-portfolio-management)
6. [Live Market Data Refresh](#6-live-market-data-refresh)
7. [Financial Analytics](#7-financial-analytics)
8. [Data Export (Backup)](#8-data-export-backup)
9. [Data Import (Restore)](#9-data-import-restore)
10. [Settings & Preferences](#10-settings--preferences)
11. [Navigation & View Switching](#11-navigation--view-switching)
12. [Background Script Lifecycle](#12-background-script-lifecycle)

---

## 1. Extension Startup

### Trigger

User clicks the KontenManager toolbar icon in Firefox.

### Processing Steps

```
Background Script (background.ts)
    ├─ browser.action.onClicked fires
    ├─ Check: is a KontenManager tab already open?
    │   ├─ YES → focus that tab, close any duplicates
    │   └─ NO  → browser.tabs.create({ url: "app.html" })
    └─ Tab opens → app.html loads
```

```
App Context Bootstrap (app.ts → AppIndex.vue)
    │
    ├─ PHASE 1 — Storage
    │   ├─ storageAdapter.getStorage()  [reads browser.storage.local]
    │   └─ settingsStore.init(data)
    │       ├─ activates stored theme (skin)
    │       ├─ restores active account ID
    │       └─ restores all pagination settings
    │
    ├─ PHASE 2 — Database
    │   ├─ databaseAdapter.connect()    [opens/upgrades IndexedDB v27]
    │   │   └─ migrator.migrate() if version mismatch
    │   ├─ databaseAdapter.getAccountRecords(activeAccountId)
    │   │   └─ reads accounts, bookings, bookingTypes, stocks
    │   └─ recordsStore.init(dbData, translations)
    │       ├─ populates accountsStore, bookingsStore, stocksStore, bookingTypesStore
    │       └─ merges STOCK_STORE_MEMORY defaults (online-only fields)
    │
    └─ PHASE 3 — External Data  [Promise.allSettled — non-blocking]
        ├─ fetchAdapter.fetchExchangesData()   → forex rates → runtimeStore
        ├─ fetchAdapter.fetchIndexData()       → market indexes → runtimeStore
        └─ fetchAdapter.fetchMaterialData()    → commodities → runtimeStore
```

**What the user sees:**

- Loading spinner while phases 1 & 2 run
- App renders with home view once `isInitialized = true`
- InfoBar shows forex / index data once phase 3 resolves (gracefully absent on failure)

---

## 2. Account Management

### 2.1 Add Account

**User actions:**

1. Clicks the **Add Account** button in HeaderBar
2. Fills in: IBAN, BIC, bank name, (optional) logo URL
3. Clicks **Save**

**Processing:**

```
HeaderBar button click
    └─ runtimeStore.setDialogName("AddAccount")
        └─ DialogPort.vue renders <AddAccount> dialog

User submits form
    └─ useDialogGuards.validateAndProceed()
        ├─ validationAdapter.validateAccount(payload)
        │   ├─ IBAN checksum validation (domain/validation)
        │   ├─ BIC format check
        │   └─ duplicate IBAN check against accountsStore
        │
        └─ [validation passes]
            └─ addAccountUsecase(deps, payload)
                ├─ accountRepository.create(newAccount)  [writes to IndexedDB]
                ├─ bookingTypeRepository.createDefaults(accountId)
                │   └─ inserts default booking types for new account
                ├─ accountsStore.add(newAccount)          [updates UI state]
                ├─ settingsStore.setActiveAccountId(newAccountId)
                │   └─ storageAdapter.setStorage(ACTIVE_ACCOUNT_ID, id)
                └─ runtimeStore.closeDialog()
```

**What the user sees:**

- New account appears in the TitleBar dropdown immediately
- Account is now the active account
- Home view shows (empty) booking list for the new account

---

### 2.2 Update Account

**User actions:**

1. Opens account action menu → clicks **Edit**
2. Modifies fields
3. Clicks **Save**

**Processing:**

```
updateAccountUsecase(deps, payload)
    ├─ validationAdapter.validateAccount(payload, existingId)
    │   └─ duplicate check excludes current account
    ├─ accountRepository.update(accountId, data)    [IndexedDB update]
    ├─ accountsStore.update(accountId, data)        [reactive UI update]
    └─ runtimeStore.closeDialog()
```

---

### 2.3 Delete Account

**User actions:**

1. Opens account action menu → clicks **Delete**
2. Confirms deletion in the confirmation dialog

**Processing:**

```
deleteAccountUsecase(deps, accountId)
    ├─ Checks if this is the last remaining account
    │   └─ [blocked if true — at least one account must exist]
    ├─ transactionManager.executeBatch([
    │   accountRepository.delete(accountId),
    │   bookingRepository.deleteByAccountId(accountId),
    │   bookingTypeRepository.deleteByAccountId(accountId),
    │   stockRepository.deleteByAccountId(accountId)
    │ ])                                             [atomic IndexedDB transaction]
    ├─ recordsStore.removeAccount(accountId)         [removes from all sub-stores]
    └─ settingsStore.setActiveAccountId(nextAccountId)
        └─ storageAdapter.setStorage(ACTIVE_ACCOUNT_ID, nextId)
```

**What the user sees:**

- Account disappears from the dropdown
- Extension automatically switches to the next available account

---

### 2.4 Switch Account

**User actions:**

1. Opens the account dropdown in TitleBar
2. Selects a different account

**Processing:**

```
TitleBar account selection
    └─ settingsStore.setActiveAccountId(selectedId)
        ├─ storageAdapter.setStorage(ACTIVE_ACCOUNT_ID, selectedId)
        └─ databaseAdapter.getAccountRecords(selectedId)
            └─ recordsStore.init(newData, translations)
                └─ all sub-stores updated reactively
```

**What the user sees:**

- TitleBar updates: account name, IBAN, logo, balance
- HomeContent table reloads with the new account's bookings
- CompanyContent reloads with the new account's stocks

---

## 3. Transaction (Booking) Management

### 3.1 Add Booking (Transaction)

**User actions:**

1. Clicks **Add Booking** in HeaderBar
2. Fills in: date, description, booking type, debit/credit amount
3. Clicks **Save**

**Processing:**

```
AddBooking dialog submit
    └─ useDialogGuards.validateAndProceed()
        ├─ validationAdapter.validateBooking(payload)
        │   ├─ date format check
        │   ├─ amount precision check (max 2 decimal places)
        │   └─ booking type existence check
        │
        └─ addBookingUsecase(deps, payload)
            ├─ bookingRepository.create(newBooking)   [IndexedDB write]
            ├─ bookingsStore.add(newBooking)           [reactive UI update]
            │   └─ derived accountBalance recalculates automatically
            └─ runtimeStore.closeDialog()
```

**What the user sees:**

- New row appears at the top of the HomeContent booking table
- Account balance in TitleBar updates immediately

---

### 3.2 Update Booking

**User actions:**

1. Clicks the row action menu on a booking → **Edit**
2. Modifies fields
3. Clicks **Save**

**Processing:**

```
updateBookingUsecase(deps, payload)
    ├─ validationAdapter.validateBooking(payload, existingId)
    ├─ bookingRepository.update(bookingId, data)   [IndexedDB update]
    ├─ bookingsStore.update(bookingId, data)        [reactive update]
    │   └─ balance recalculates
    └─ runtimeStore.closeDialog()
```

---

### 3.3 Delete Booking

**User actions:**

1. Clicks the row action menu → **Delete**
2. Confirms in the confirmation dialog

**Processing:**

```
deleteBookingUsecase(deps, bookingId)
    ├─ bookingRepository.delete(bookingId)   [IndexedDB delete]
    ├─ bookingsStore.remove(bookingId)        [reactive update]
    │   └─ balance recalculates
    └─ runtimeStore.closeDialog()
```

---

### 3.4 Search Bookings

**User actions:**

1. Types in the search field above the booking table

**Processing:**

```
HomeContent search input (debounced)
    └─ bookingsStore computed getter filters in-memory array
        ├─ matches against: description, booking type name, date string
        └─ pagination resets to page 1
```

No database query — all filtering is purely in-memory on the loaded dataset.

---

## 4. Booking Type Management

Booking types are account-scoped labels (e.g. "Buy", "Sell", "Dividend", "Fee") that categorize transactions.

### 4.1 Add Booking Type

**User actions:**

1. HeaderBar → **Manage Booking Types** → **Add**
2. Enters a label name
3. Clicks **Save**

**Processing:**

```
addBookingTypeUsecase(deps, payload)
    ├─ validationAdapter.validateBookingType(payload)
    │   └─ duplicate name check within same account
    ├─ bookingTypeRepository.create(newType)    [IndexedDB write]
    └─ bookingTypesStore.add(newType)            [reactive update]
```

---

### 4.2 Update / Delete Booking Type

Same pattern as add — update writes to IndexedDB and the Pinia store; delete checks for any bookings still referencing
the type before allowing removal.

---

## 5. Stock Portfolio Management

### 5.1 Add Stock

**User actions:**

1. On CompanyContent → HeaderBar **Add Stock**
2. Enters: ISIN, (optional) stock exchange, company name, URL
3. Clicks **Save**

**Processing:**

```
AddStock dialog submit
    └─ useDialogGuards.validateAndProceed()
        ├─ validationAdapter.validateStock(payload)
        │   ├─ ISIN checksum validation (Luhn-like algorithm, domain/validation)
        │   └─ duplicate ISIN check within account
        │
        └─ addStockUsecase(deps, payload)
            ├─ stockRepository.create(newStock)          [IndexedDB write]
            ├─ stocksStore.add(newStock)                  [merges STOCK_STORE_MEMORY defaults]
            │   └─ mValue, mMin, mMax set to 0 (placeholders for online data)
            └─ runtimeStore.closeDialog()
```

**What the user sees:**

- New row in CompanyContent with `—` for market data fields
- Online data loads on next refresh cycle

---

### 5.2 Update Stock

**User actions:**

1. Row action menu → **Edit**
2. Modifies details (name, URL, exchange, etc.)
3. Clicks **Save**

**Processing:**

```
updateStockUsecase(deps, payload)
    ├─ validationAdapter.validateStock(payload, existingId)
    ├─ stockRepository.update(stockId, data)    [IndexedDB update]
    ├─ stocksStore.update(stockId, data)         [reactive update]
    └─ runtimeStore.closeDialog()
```

---

### 5.3 Delete Stock

**User actions:**

1. Row action menu → **Delete**
2. Confirms

**Processing:**

```
deleteStockUsecase(deps, stockId)
    ├─ stockRepository.delete(stockId)     [IndexedDB delete]
    ├─ stocksStore.remove(stockId)          [reactive update]
    │   └─ portfolioStore derived values recalculate
    └─ runtimeStore.closeDialog()
```

---

## 6. Live Market Data Refresh

### 6.1 Automatic Load on CompanyContent

**Trigger:** User navigates to CompanyContent view (or changes page).

**Processing:**

```
CompanyContent.vue onMounted / page change
    └─ useOnlineStockData.loadOnlineData(currentPage)
        ├─ Check runtimeStore.loadedStocksPages[page]
        │   └─ if page is fresh (< 1 min old) → skip fetch, return cached
        │
        ├─ Compute ISINs for stocks on current page
        ├─ Identify stocks needing meeting/quarter date refresh
        │
        ├─ Promise.all([
        │   fetchAdapter.fetchMinRateMaxData(isinList)
        │   │   ├─ httpClient.get(providerURL)   [with retry & response caching]
        │   │   └─ parse HTML/JSON for mMin, mValue, mMax per ISIN
        │   │
        │   fetchAdapter.fetchDateData(isinDatesNeeded)
        │       └─ ARD Börse scraper → meeting / quarterly report dates
        │ ])
        │
        ├─ Currency conversion (EUR ↔ USD based on user locale)
        ├─ stocksStore.updateOnlineFields(isin, { mMin, mValue, mMax })
        │   └─ Vue reactivity propagates to table cells
        └─ runtimeStore.markPageLoaded(page, timestamp)
```

---

### 6.2 Manual Refresh (Force Update)

**User actions:**

1. Clicks the **Refresh Quotes** button in HeaderBar

**Processing:**

```
useHeaderBarActions.onUpdateClick()
    ├─ runtimeStore.clearLoadedStocksPages()    [invalidates page freshness cache]
    └─ useOnlineStockData.loadOnlineData(currentPage)
        └─ [same flow as 6.1, but cache check always misses]
```

---

### 6.3 Provider Selection Impact

When the user changes the data provider in Settings, the next refresh automatically uses the new provider. The freshness
cache is also invalidated so stale data from the old provider is discarded.

---

### 6.4 HTTP Cache Behavior

| Data Type           | Cache TTL | Cache Layer     |
|---------------------|-----------|-----------------|
| Stock quote (price) | 1 minute  | httpCache (RAM) |
| Meeting/date data   | 5 minutes | httpCache (RAM) |
| Exchange rates      | 5 minutes | httpCache (RAM) |
| Index data          | 5 minutes | httpCache (RAM) |

Cache is in-memory only; it is cleared on import, provider switch, and page reload.

---

## 7. Financial Analytics

### 7.1 Accounting View

**User actions:**

1. HeaderBar → **Show Accounting**

**Processing:**

```
ShowAccounting dialog opens
    └─ accountingStore (derived from bookingsStore + bookingTypesStore)
        ├─ Groups bookings by booking type and year
        ├─ Aggregates: sum of debits, sum of credits per group
        ├─ Calculates net gain/loss per type
        ├─ Separates tax and fee amounts (by type label convention)
        └─ Returns paginated rows for the v-data-table
```

All calculations are in-memory using `domain/logic.ts` aggregation functions with high-precision arithmetic. No database
query is made when opening this dialog.

---

### 7.2 Dividend View

**User actions:**

1. Row action menu on a stock → **Show Dividends**

**Processing:**

```
ShowDividend dialog opens
    └─ Filters bookingsStore for bookings of type "Dividend" linked to the ISIN
        ├─ Calculates total dividends received
        ├─ Calculates dividend yield = (total dividends / total invested)
        └─ Renders per-year dividend history table
```

---

### 7.3 Portfolio Calculations (Depot Sum)

The TitleBar shows a live depot value computed reactively:

```
portfolioStore.sumDepot (computed)
    └─ For each active stock:
        ├─ Retrieve FIFO-based investment total from bookings
        │   └─ domain/logic.ts: calculateFifoInvestment(bookings, isin)
        ├─ Add mValue * quantity  (current market value)
        └─ Sum across all stocks
```

The `sumDepot` value updates automatically whenever `mValue` changes (i.e. after a market data fetch) or when bookings
are added/removed.

---

## 8. Data Export (Backup)

**User actions:**

1. HeaderBar → **Export Database**
2. Clicks **Download**

**Processing:**

```
ExportDatabase dialog
    └─ useExportDialog.onExport()
        └─ exportDatabaseUsecase(deps)
            ├─ Serialize all stores to ModernBackupData JSON:
            │   { version: 27, accounts: [...], stocks: [...],
            │     bookings: [...], bookingTypes: [...] }
            ├─ Convert to Blob
            └─ browserAdapter.downloadFile(blob, "kontenmanager-backup.json")
                └─ browser.downloads.download(objectURL)
```

**What the user sees:**

- Browser download prompt / file saved to Downloads folder
- File is a complete, human-readable JSON snapshot

---

## 9. Data Import (Restore)

**User actions:**

1. HeaderBar → **Import Database**
2. Selects a `.json` backup file
3. Reviews the confirmation dialog
4. Clicks **Confirm**

**Processing (4 phases):**

```
ImportDatabase dialog
    └─ useImportDialog.onImport()

Phase 1 — Read & Validate
    ├─ FileReader.readAsText(file)
    ├─ JSON.parse(text)
    └─ importExportAdapter.validate(parsed)
        ├─ Check top-level structure (version field, entity arrays)
        ├─ Detect format: legacy (v≤25) vs. modern
        └─ Run schema validators on every entity

Phase 2 — Integrity Check
    ├─ Legacy backup:
    │   └─ validateLegacyDataIntegrity() + transform to modern format
    └─ Modern backup:
        └─ validateDataIntegrity()
            ├─ Cross-reference: every booking references a valid accountId
            ├─ Cross-reference: every stock references a valid accountId
            └─ Cross-reference: every booking type exists

Phase 3 — User Confirmation
    └─ alertAdapter.feedbackConfirm("This will overwrite all data. Continue?")
        └─ Awaits Promise<boolean>

Phase 4 — Atomic Write
    └─ [user confirmed]
        ├─ Save in-memory snapshot for rollback:
        │   useBackupDialogs.saveSnapshot(currentRecordsStore)
        │
        └─ databaseAdapter.atomicImport(validatedData)
            └─ transactionManager.executeBatch([
                accountRepository.replaceAll(data.accounts),
                stockRepository.replaceAll(data.stocks),
                bookingRepository.replaceAll(data.bookings),
                bookingTypeRepository.replaceAll(data.bookingTypes)
              ])                                      [single IndexedDB transaction]
            │
            ├─ [SUCCESS]
            │   ├─ recordsStore.init(importedData)   [refresh all UI state]
            │   ├─ httpCache.clear()                  [invalidate stale online data]
            │   ├─ runtimeStore.clearLoadedStocksPages()
            │   └─ alertAdapter.feedbackInfo("Import successful")
            │
            └─ [FAILURE]
                ├─ IndexedDB transaction is automatically rolled back
                └─ alertAdapter.feedbackError("Import failed — data unchanged")
```

**What the user sees:**

- Success: app reloads with restored data, confirmation toast
- Failure: error alert, original data unchanged

---

## 10. Settings & Preferences

Settings are managed in the **Options page** (accessible via the extension settings icon) and persist to
`browser.storage.local`.

### 10.1 Theme Change

**User actions:** Options page → **Appearance** tab → select theme

**Processing:**

```
OptionsIndex.vue theme selection
    └─ settingsStore.setSkin(newTheme)
        ├─ storageAdapter.setStorage(SKIN, newTheme)   [persists immediately]
        └─ themeSync plugin watches settingsStore.skin
            └─ vuetify.theme.global.name = newTheme    [re-renders all components]
```

Cross-context sync: if the Options page is open alongside the app tab, `addStorageChangedListener` fires in the app
context and applies the new theme there too.

---

### 10.2 Data Provider Change

**User actions:** Options page → **Market Data** tab → select provider

**Processing:**

```
settingsStore.setService(newProvider)
    ├─ storageAdapter.setStorage(SERVICE, newProvider)
    └─ runtimeStore.clearLoadedStocksPages()
        └─ next CompanyContent render will re-fetch using new provider
```

---

### 10.3 Pagination Settings

**User actions:** Options page → **Display** tab → adjust rows per page

**Processing:**

```
settingsStore.setBookingsPerPage(n)  /  setStocksPerPage(n)
    └─ storageAdapter.setStorage(BOOKINGS_PER_PAGE / STOCKS_PER_PAGE, n)
        └─ v-data-table itemsPerPage binding updates reactively
```

---

### 10.4 Market Preferences (Exchanges, Indexes, Commodities)

**User actions:** Options page → **Market Data** tab → toggle items

**Processing:**

```
settingsStore.setExchanges(selectedList)
    └─ storageAdapter.setStorage(EXCHANGES, selectedList)
        └─ InfoBar re-renders with only selected forex pairs
```

---

## 11. Navigation & View Switching

### 11.1 Home View ↔ Company View

**User actions:** Click **Home** or **Portfolio** button in HeaderBar

**Processing:**

```
HeaderBar navigation click
    └─ router.push("/")  or  router.push("/company")
        └─ Vue Router replaces named view components:
            ├─ default: HomeContent.vue  ↔  CompanyContent.vue
            ├─ TitleBar, HeaderBar, InfoBar, FooterBar: persist across routes
            └─ CompanyContent.vue onMounted triggers online data load (6.1)
```

---

### 11.2 Privacy / Help Pages

Routes `/privacy` and `/help` render static informational content. No data queries are made.

---

### 11.3 Keyboard Shortcuts

| Shortcut         | Action                                             |
|------------------|----------------------------------------------------|
| `Ctrl + Alt + R` | Reset browser.storage.local to defaults and reload |

---

## 12. Background Script Lifecycle

The background script runs in a separate, lightweight context with minimal dependencies.

### 12.1 First Install

```
browser.runtime.onInstalled fires (reason: "install")
    └─ storageAdapter.installStorageLocal()
        └─ browser.storage.local.set(ALL_DEFAULTS)
            ├─ SKIN: "ocean"
            ├─ SERVICE: "wstreet"
            ├─ ACTIVE_ACCOUNT_ID: -1
            └─ all pagination defaults
```

### 12.2 Extension Update

```
browser.runtime.onInstalled fires (reason: "update")
    └─ storageAdapter.installStorageLocal()
        └─ Merges new default keys without overwriting existing user settings
```

### 12.3 Toolbar Icon Click

```
browser.action.onClicked
    └─ browser.tabs.query({ url: "*://*kontenmanager*" })
        ├─ No existing tab  → browser.tabs.create({ url: "app.html" })
        └─ Existing tab(s):
            ├─ Focus the first match
            └─ Close any duplicate tabs
```

---

## Data Flow Summary

```
User Action
    │
    ▼
Vue Component / Composable
    │
    ├─ Validation  ──────────────►  domain/validation/
    │
    ├─ Use Case    ──────────────►  app/usecases/
    │                               (orchestrates ports)
    │
    ├─ Repository  ──────────────►  adapters/secondary/database/
    │               (read/write)    IndexedDB
    │
    ├─ Pinia Store ──────────────►  adapters/primary/stores/
    │               (state update)  (reactive, in-memory)
    │
    └─ UI Update   ──────────────►  Vue reactivity propagates
                                    to all dependent components
```

External data (market prices) flows separately:

```
CompanyContent / HeaderBar refresh trigger
    │
    ├─ fetchAdapter  ────────────►  adapters/secondary/fetch/
    │                               (HTTP + in-memory cache)
    │
    ├─ Provider scraper  ────────►  adapters/secondary/fetch/providers/
    │
    └─ stocksStore.updateOnlineFields()
        └─ Vue reactivity → CompanyContent table cells update
```

---

*Generated: 2026-03-25 | KontenManager v27*