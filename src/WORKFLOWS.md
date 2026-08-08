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
13. [E2E Test Coverage](#13-e2e-test-coverage)

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

At most one app tab is ever allowed to run at once — `records`/`settings` are plain in-memory state with no
cross-tab sync, so two open app tabs could silently drift out of sync with each other. The check above only covers
tabs opened via the toolbar icon; `app.ts` repeats the check itself on every startup (see below) so a tab opened any
other way (duplicated tab, manual navigation to the app URL, a session restore reopening more than one saved tab) is
also caught.

```
App Context Bootstrap (app.ts → AppIndex.vue)
    │
    ├─ ensureSingleAppTab(browserAdapter)
    │   ├─ another app tab already open → focus it, close this tab, STOP (nothing below runs)
    │   └─ this tab is the sole/surviving one → continue
    │
    ├─ PHASE 1 — Storage
    │   ├─ storageAdapter.getStorage()  [reads browser.storage.local]
    │   └─ settingsStore.init(data)
    │       ├─ activates stored theme (skin)
    │       ├─ restores active account ID
    │       └─ restores all pagination settings
    │
    ├─ PHASE 2 — Database
    │   ├─ databaseAdapter.connect()    [opens/upgrades IndexedDB v28]
    │   │   └─ migrator.migrate() if version mismatch
    │   ├─ databaseAdapter.getAccountRecords(activeAccountId)
    │   │   └─ reads accounts, bookings, bookingTypes, stocks
    │   └─ recordsStore.init(dbData, translations)
    │       ├─ populates accountsStore, bookingsStore, stocksStore, bookingTypesStore
    │       └─ merges INDEXED_DB.STORE.STOCK_MEMORY defaults (online-only fields)
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

> **Validation happens at two levels**, and the flows below reference both:
>
> 1. **Field rules (UI).** `adapters/ui/validationAdapter.ts` builds Vuetify rule arrays
>    (`ibanRules`, `isinRules`, `nameRules`, `amountRules`, `countRules`, `isoDateRules`, …) bound to the form
>    fields. `useDialogGuards.submitGuard` runs `form.validate()` and is **fail-closed**: it proceeds only on a
>    valid form, or when the dialog explicitly declares it has no form (file picker, confirmations, selectors).
> 2. **Record rules (persistence).** Each repository's `save()` runs the matching validator from
>    `domain/validation/validators.ts` (`validateAccount`, `validateBooking`, `validateBookingType`,
>    `validateStock`). These rebuild the record from an explicit `cXxx` whitelist, so nothing the UI happened to
>    attach — including the in-memory `m*` price fields — can reach IndexedDB.
>
> Duplicate and referential checks sit in `domain/validation/duplicates.ts` and
> `domain/validation/referentialIntegrity.ts`, and are called from the use cases.
>
> Repositories expose `save` / `remove` / `findById` / `findAll` / `findBy` / `deleteBy` / `count` / `countBy`
> (`baseRepository.ts`). `save()` both inserts and updates — there is no separate `create`/`update` pair.

### 2.1 Add Account

**User actions:**

1. Clicks the **Add Account** button in HeaderBar
2. Fills in: IBAN, BIC, bank name, (optional) logo URL
3. Clicks **Save**

**Processing:**

```
HeaderBar button click
    └─ runtimeStore.setTeleport({dialogName: "AddAccount", dialogOk: true, dialogVisibility: true})
        └─ DialogPort.vue renders <AddAccount> dialog

User submits form
    └─ useDialogGuards.submitGuard({formRef, onValid})
        ├─ form.validate()   [Vuetify field rules from validationAdapter.ts:
        │                     ibanRules (checksum), swiftRules, nameRules, urlRules]
        │   └─ fail-closed: invalid, or no formRef and no explicit "no form" flag
        │      → returns without running onValid
        │
        └─ [validation passes]
            └─ addAccountUsecase(deps, payload)
                ├─ duplicate IBAN check (domain/validation/duplicates.ts)
                ├─ accountRepository.save(newAccount)   [writes to IndexedDB;
                │   └─ save() runs domain validateAccount(), which rebuilds the
                │      record from an explicit cXxx whitelist]
                ├─ if withDepot: createDefaultBookingTypes(...)   [usecases/accounts.ts]
                │   └─ inserts Buy / Sell / Dividend types, each stamped with its
                │      explicit cRole (see §4 — roles, not ids, drive portfolio logic)
                ├─ accountsStore.add(newAccount)          [updates UI state]
                ├─ settingsStore.setActiveAccountId(newAccountId)
                │   └─ storageAdapter.setStorage(ACTIVE_ACCOUNT_ID, id)
                └─ runtimeStore.resetTeleport()
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
    ├─ duplicate IBAN check, excluding the account being edited
    ├─ accountRepository.save(account)              [IndexedDB update]
    ├─ if withDepot flipped false → true: createDefaultBookingTypes(...)
    │   └─ seeds only the Buy/Sell/Dividend roles the account is still missing
    ├─ accountsStore.update(accountId, data)        [reactive UI update]
    └─ runtimeStore.resetTeleport()
```

Turning `withDepot` off deletes nothing, so the seeding step skips roles that already exist. Toggling the
switch off and on repeatedly therefore cannot produce duplicate same-role types — which matters because only
the first match of a role is ever resolved (§4).

---

### 2.3 Delete Account

**User actions:**

1. Opens account action menu → clicks **Delete**
2. Confirms deletion in the confirmation dialog

**Processing:**

```
deleteActiveAccountUsecase(deps, input)
    ├─ databaseAdapter.deleteAccountRecords(accountId)   [removes account + its bookings,
    │                                                      booking types, stocks from IndexedDB]
    ├─ recordsStore.accounts.remove(accountId)
    ├─ if another account remains:
    │   ├─ settingsStore.setActiveAccountId(nextAccountId)   [first remaining account]
    │   │   └─ storageAdapter.setStorage(ACTIVE_ACCOUNT_ID, nextId)
    │   └─ recordsStore.init(...)                            [load the new active account's data]
    └─ else (this was the last account):
        ├─ settingsStore.setActiveAccountId(-1)
        │   └─ storageAdapter.setStorage(ACTIVE_ACCOUNT_ID, -1)
        └─ recordsStore.clean(false)                         [clear all sub-stores]
```

No guard prevents deleting the last remaining account — this is allowed, and the app lands in a zero-accounts state
rather than being blocked.

**What the user sees:**

- Account disappears from the dropdown
- Extension automatically switches to the next available account, or, if none remain, to an empty state with no active
  account

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
    └─ useDialogGuards.submitGuard({formRef, onValid})
        ├─ form.validate()   [isoDateRules, amountRules, countRules, nameRules]
        │
        └─ addBookingUsecase(deps, payload)
            ├─ bookingRepository.save(newBooking)     [IndexedDB write; runs
            │   domain validateBooking() on the way in]
            ├─ bookingsStore.add(newBooking)           [reactive UI update]
            │   └─ derived accountBalance recalculates automatically
            └─ runtimeStore.resetTeleport()
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
    ├─ bookingRepository.save(booking)             [IndexedDB update]
    ├─ bookingsStore.update(bookingId, data)        [reactive update]
    │   └─ balance recalculates
    └─ runtimeStore.resetTeleport()
```

---

### 3.3 Delete Booking

**User actions:**

1. Clicks the row action menu → **Delete**
2. Confirms in the confirmation dialog

**Processing:**

```
deleteBookingUsecase(deps, bookingId)
    ├─ bookingRepository.remove(bookingId)   [IndexedDB delete]
    ├─ bookingsStore.remove(bookingId)        [reactive update]
    │   └─ balance recalculates
    └─ runtimeStore.resetTeleport()
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

Each type also carries a **role** (`cRole`): `buy`, `sell`, `dividend`, or `other`. The label is free text the
user can rename in any language; the role is what portfolio, invest, and dividend calculations key off
(`resolveTypeIdByRole` in `domain/logic.ts`). Renaming "Buy" to "Kauf" therefore changes nothing functionally,
while changing its *role* does.

Roles matter because `cID` auto-increments across the whole database rather than per account, so a fixed
numeric id identifies the Buy type only for the very first depot account ever created. A depot account gets its
Buy/Sell/Dividend types seeded automatically (§2.1, §2.2).

### 4.1 Add Booking Type

**User actions:**

1. HeaderBar → **Manage Booking Types** → **Add**
2. Enters a label name and picks a role
3. Clicks **Save**

**Processing:**

```
addBookingTypeUsecase(deps, payload)
    ├─ validationAdapter.validateBookingType(payload)
    │   └─ duplicate name check within same account
    │      (names normalized: trimmed, whitespace collapsed, compared case-insensitively)
    ├─ bookingTypeRepository.save(newType)      [IndexedDB write]
    └─ bookingTypesStore.add(newType)            [reactive update]
```

---

### 4.2 Update / Delete Booking Type

Update follows the same pattern as add — IndexedDB first, then the Pinia store — with one extra guard:

```
updateBookingTypeUsecase(deps, input)
    ├─ duplicate name check within the account          → {status: "duplicate"}
    ├─ if cRole !== "other":
    │   └─ bookingTypeRepository.findByAccount(accountId)
    │       └─ another type already holds this role?    → {status: "roleConflict"} (nothing written)
    ├─ bookingTypeRepository.save(bookingType)          [IndexedDB write]
    ├─ bookingTypesStore.update(bookingType)            [reactive update]
    └─ runtimeStore.clearStocksPages()
        └─ a changed role re-partitions which bookings count toward holdings,
           which can move a stock onto a different page
```

A `buy` / `sell` / `dividend` role must stay unique per account: only the first match is ever resolved, so
bookings recorded under a second same-role type would silently disappear from portfolio, invest, and dividend
totals. `other` is exempt — arbitrarily many custom types are fine.

The role check reads from the repository rather than `records.bookingTypes.items`, because the store holds only
the **active** account's types; filtering it by account id would look account-agnostic while being correct only
when that account happens to be active.

Delete checks for any bookings still referencing the type before allowing removal.

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
    └─ useDialogGuards.submitGuard({formRef, onValid})
        ├─ form.validate()   [isinRules — ISIN checksum, symbolRules, urlRules]
        │
        └─ addStockUsecase(deps, payload)
            ├─ rejects a stock whose cAccountNumberID is unset (precondition
            │   in the use case, not in each dialog)
            ├─ duplicate ISIN check within the account
            ├─ stockRepository.save(newStock)            [IndexedDB write; runs
            │   domain validateStock(), dropping the RAM-only m* fields]
            ├─ stocksStore.add(newStock)                  [merges INDEXED_DB.STORE.STOCK_MEMORY defaults]
            │   └─ mValue, mMin, mMax set to 0 (placeholders for online data)
            └─ runtimeStore.resetTeleport()
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
    ├─ stockRepository.save(stock)              [IndexedDB update]
    ├─ stocksStore.update(stockId, data)         [reactive update]
    └─ runtimeStore.resetTeleport()
```

---

### 5.3 Delete Stock

**User actions:**

1. Row action menu → **Delete**
2. Confirms

**Processing:**

```
deleteStockUsecase(deps, stockId)
    ├─ stockRepository.remove(stockId)     [IndexedDB delete]
    ├─ stocksStore.remove(stockId)          [reactive update]
    │   └─ portfolioStore derived values recalculate
    └─ runtimeStore.resetTeleport()
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
        │       └─ Finanzen.Net (FNET.SEARCH / FNET.DATES) → meeting / quarterly report dates
        │           (always Finanzen.Net, independent of the active `settings.service` provider)
        │ ])
        │
        ├─ Currency conversion (EUR ↔ USD based on user locale)
        ├─ Write mMin / mValue / mMax in place onto stocksStore.items
        │   ├─ Vue reactivity propagates to table cells
        │   └─ mEuroChange is deliberately NOT written — portfolio.active derives it
        ├─ Write fetched cMeetingDay / cQuarterDay / cAskDates onto the same items,
        │   then persist those stocks via repositories.stocks.save()
        │   └─ these three are real DB columns; cAskDates is the "don't re-fetch for
        │      7 days" throttle, so store-only writes would reset it on every reload
        │      (failures are logged, not surfaced — prices already refreshed fine)
        └─ runtimeStore.markStocksPageLoaded(page)
```

---

### 6.2 Manual Refresh (Force Update)

**User actions:**

1. Clicks the **Refresh Quotes** button in HeaderBar

**Processing:**

```
useHeaderBarActions.onIconClick(ev) → dialogActions.updateQuote()
    ├─ aborts any in-flight refresh (its own AbortController), starts a new one
    ├─ runtime.beginStockLoading() / beginDownload()   [spinner + progress state]
    ├─ fetchAdapter.clearCache()                        [drops cached HTTP responses]
    └─ useOnlineStockData.refreshAllOnlineData({signal})
        └─ [same flow as 6.1 for every page with holdings, cache check always misses]
```

An abort caused by a newer `updateQuote()` is swallowed rather than reported — it isn't a failure. The
controller is also aborted in `onUnmounted`, so navigating away cancels an in-flight refresh.

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
        ├─ sumBookingsPerType          — aggregates all bookings by booking type
        ├─ sumBookingsPerTypeAndYear(y) — same, restricted to one year
        └─ Returns rows for the v-data-table

Fee / tax totals come from the per-booking amount fields, not from type labels:
    └─ domain/logic.ts: calculateSumFees / calculateSumTaxes (per year),
       calculateSumAllFees / calculateSumAllTaxes (all years)
        └─ each booking's own cFee / cTax / cSoli / cSourceTax / cTransactionTax
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
    └─ domain/logic.ts: getDividendBookingsByStockId(bookings, stockId, bookingTypes)
        ├─ Resolves the account's dividend type by cRole — not by name or a fixed id,
        │   so a renamed "Dividend" label still resolves correctly
        ├─ Filters bookings for that type linked to the stock
        ├─ Calculates total dividends received
        ├─ Calculates dividend yield = (total dividends / total invested)
        └─ Renders the dividend history table (keyed by each booking's ex-date)
```

---

### 7.3 Portfolio Calculations (Depot Sum)

The TitleBar shows a live depot value computed reactively:

```
portfolioStore.sumDepot (computed)
    └─ For each active stock:
        ├─ Retrieve FIFO-based investment total from bookings
        │   └─ domain/logic.ts: calculateInvestByStockId(bookings, stockId, bookingTypes)
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
    └─ useExportDialog.run()   [returns {filename, dialogText, run}]
        └─ exportDatabaseUsecase(deps)
            ├─ Serialize all stores to JSON:
            │   { sm: { cVersion, cDBVersion: 28, cEngine: "indexeddb" },
            │     accounts: [...], stocks: [...], bookings: [...], bookingTypes: [...] }
            ├─ estimateSizeKb(data); if > 10,000 KB, ask user to confirm
            │   (confirmLargeFile) before proceeding, else just notify the size
            └─ browserAdapter.writeBufferToFile(data, filename)
                filename = `${isoDate}_${INDEXED_DB.CURRENT_VERSION}_${INDEXED_DB.NAME}.json`
                (createExportFilename, in exportHelpers.ts)
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
    └─ useImportDialog.runImport()   [file selection via onChange / fileBlob]

Phase 1 — Read & Validate
    ├─ FileReader.readAsText(file)
    ├─ JSON.parse(text)
    └─ importExportAdapter.validate(parsed)
        ├─ Check top-level structure (version field, entity arrays)
        ├─ Reject versions older than INDEXED_DB.MIN_SUPPORTED_VERSION
        └─ Run schema validators on every entity

Phase 2 — Integrity Check
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
        │   useImportDialog.createRollbackPoint()   [restoreFromRollback() on error]
        │
        └─ databaseAdapter.atomicImport(plan.descriptors)
            └─ batchService.executeAtomic(descriptors)   [single IndexedDB transaction]
                └─ descriptors built by buildModernImportPlan (usecases/backup/importHelpers.ts):
                   clear + repopulate accounts, stocks, bookings, bookingTypes
            │
            ├─ [SUCCESS]
            │   ├─ recordsStore.init(importedData)   [refresh all UI state]
            │   ├─ httpCache.clear()                  [invalidate stale online data]
            │   ├─ runtimeStore.clearStocksPages()
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
    └─ storageAdapter.setStorage(SERVICE, newProvider)
        └─ AppIndex.vue's watcher on settings.service fires
            ├─ runtimeStore.clearStocksPages()
            ├─ fetchAdapter.clearCache?.()
            └─ next CompanyContent render re-fetches using the new provider
```

Cache invalidation lives in watchers registered **once** in `AppIndex.vue`, not in the setter and not per call
site — the same applies to `settings.activeAccountId` and `settings.stocksPerPage`.

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
DynamicList (exchanges/markets) or CheckboxGrid (indexes/materials)
    └─ storageAdapter.setStorage(EXCHANGES / MARKETS / INDEXES / MATERIALS, selectedList)
        └─ settings store's storage listener (applyStorageChange) updates its ref
            └─ InfoBar re-renders with only the selected entries
```

These four lists have no store setter: unlike `skin` / `service` / pagination, the components write to
`browser.storage.local` directly and the settings store picks the change back up through its storage listener
(the same path that syncs the app tab when the options page changes a setting).

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

This only runs on a toolbar click. `app.ts`'s own `ensureSingleAppTab()` startup check (§1) enforces the same
single-app-tab rule for every other way a tab could appear (duplicated tab, manual URL navigation, session restore).

### 12.4 New Tab Created (any tab, not just the toolbar click path)

```
browser.tabs.onCreated fires (every new tab in the browser, not just this extension's)
    └─ isAppTabUrl(tab.url)?
        ├─ No  → ignore
        └─ Yes → browser.tabs.query({ url: app.html }) for other app tabs
            ├─ None found → nothing to do (this is the only app tab)
            └─ Found      → focus the existing one, close this new tab immediately
```

This exists specifically for the browser's native "Duplicate Tab" context-menu action: there's no
WebExtension API to remove or disable that menu item, but duplicating a tab copies its URL onto the new tab
right away (unlike a blank new tab), so this listener recognizes and closes the duplicate before it even
finishes loading — faster than waiting for `ensureSingleAppTab()` to catch it once the duplicate's own
`app.ts` runs.

---

## 13. E2E Test Coverage

Playwright E2E specs (`tests/e2e/*.spec.ts`, run via `npm run test:e2e`, see `tests/README.md`) exercise many of the
workflows above end-to-end against a built extension served over HTTP with a stubbed `browser.*` API. This table maps
each workflow to its covering spec/test so regressions surface where the behavior is described.

| Workflow                             | Spec file                                      | Test                                                                                                                                                   |
|--------------------------------------|------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1. Extension Startup                 | `background-smoke.spec.ts`                     | `background smoke (firefox): registers listeners and initializes storage defaults`                                                                     |
| 1. Extension Startup (app boot)      | `happy-path.spec.ts`                           | `happy path (firefox): import backup and see Company content` (boot + header render)                                                                   |
| 2.1 Add Account                      | `dialog-actions.spec.ts`                       | `addAccount: creates a new account and switches to it`                                                                                                 |
| 2.2 Update Account                   | `dialog-actions.spec.ts`                       | `updateAccount: edits the active account's SWIFT code`                                                                                                 |
| 2.3 Delete Account                   | `dialog-actions.spec.ts`                       | `deleteAccountConfirmation: removes the active account`                                                                                                |
| 2.4 Switch Account                   | `dialog-actions.spec.ts`                       | `switchAccount: adds a second account and switches back to the original via the TitleBar select`                                                       |
| 3.1 Add Booking                      | `dialog-actions.spec.ts`                       | `addBooking: creates a new booking against the fixture's BUY type and AAPL stock`                                                                      |
| 3.2 Update Booking                   | `dialog-actions.spec.ts`                       | `updateBooking: edits the existing booking's remark via the row menu`                                                                                  |
| 3.3 Delete Booking                   | `dialog-actions.spec.ts`                       | `deleteBooking: removes the booking via the row menu (no confirmation step)`                                                                           |
| 3.4 Search Bookings                  | `dialog-actions.spec.ts`                       | `searchBookings: filters the bookings table in-memory`                                                                                                 |
| 4.1 Add Booking Type                 | `dialog-actions.spec.ts`                       | `addBookingType: creates a new booking type`                                                                                                           |
| 4.2 Update Booking Type              | `dialog-actions.spec.ts`                       | `updateBookingType: renames the existing booking type`                                                                                                 |
| 4.2 Delete Booking Type              | `dialog-actions.spec.ts`                       | `deleteBookingType: creates then deletes a fresh, unreferenced booking type`                                                                           |
| 5.1 Add Stock                        | `happy-path.spec.ts`                           | `add company by ISIN (firefox): create new company with ISIN DE000BASF111`                                                                             |
| 5.2 Update Stock                     | `dialog-actions.spec.ts`                       | `updateStock: edits the stock's URL via the row menu`                                                                                                  |
| 5.3 Delete Stock                     | `dialog-actions.spec.ts`                       | `deleteStock: adds a disposable stock then deletes it via the row menu`                                                                                |
| 6.1 Automatic Load on CompanyContent | *none*                                         | not directly covered (only the disabled-provider path is exercised, via 6.2)                                                                           |
| 6.2 Manual Refresh (Force Update)    | `dialog-actions.spec.ts`                       | `updateQuote: manual refresh completes without errors when the provider is disabled`                                                                   |
| 6.3 Provider Selection Impact        | `options-page.spec.ts`                         | `serviceSelector: changes the market data provider and persists it to storage`                                                                         |
| 7.1 Accounting View                  | `dialog-actions.spec.ts`                       | `showAccounting: opens a read-only dialog with accounting figures, then closes`                                                                        |
| 7.2 Dividend View                    | `dialog-actions.spec.ts`                       | `showDividend: opens the read-only dividend dialog for a stock, then closes` (fixture has no dividend booking, so this exercises the empty-state path) |
| 7.3 Portfolio Calculations           | `dialog-actions.spec.ts`                       | `portfolioDepotSum: shows the depot chip with a value on the Company view`                                                                             |
| 8. Data Export (Backup)              | `dialog-actions.spec.ts`                       | `exportDatabase: triggers a download with the current data`                                                                                            |
| 9. Data Import (Restore)             | `happy-path.spec.ts`                           | `happy path (firefox): import backup and see Company content`                                                                                          |
| 10.1 Theme Change                    | `options-page.spec.ts`                         | `themeSelector: changes the active skin and persists it to storage`                                                                                    |
| 10.2 Data Provider Change            | `options-page.spec.ts`                         | `serviceSelector: changes the market data provider and persists it to storage` (same control as 6.3)                                                   |
| 10.3 Pagination Settings             | *none*                                         | not directly covered (the `v-data-table` items-per-page footer control)                                                                                |
| 10.4 Market Preferences              | `options-page.spec.ts`                         | `marketPreferences: adds and removes a stock exchange entry`; `marketPreferences: toggles an index's visibility checkbox and persists it`              |
| 11.1 Home ↔ Company navigation       | `happy-path.spec.ts`, `dialog-actions.spec.ts` | covered incidentally via `#company` / `#home` navigation in multiple tests                                                                             |
| 11.2 Privacy / Help Pages            | `dialog-actions.spec.ts`                       | `footerNavigation: opens Help and Privacy pages via the FooterBar`                                                                                     |
| 11.3 Keyboard Shortcuts              | `dialog-actions.spec.ts`                       | `keyboardShortcut: Ctrl+Alt+R resets browser.storage.local without touching IndexedDB data`                                                            |
| 12. Background Script Lifecycle      | `background-smoke.spec.ts`                     | `background smoke (firefox): registers listeners and initializes storage defaults` (install, update, toolbar click/focus/dedupe)                       |

Additionally, `dialog-actions.spec.ts` covers `fadeInStock` (guard-clause branch: info alert when no passive stocks
exist), which is not otherwise documented above as a standalone workflow.

The one remaining gap — 10.3 Pagination Settings (the `v-data-table` items-per-page footer control on the Home/ Company
tables) and 6.1's fully-online automatic-load path — are currently only covered, if at all, by unit tests under
`tests/unit/` — see `tests/README.md` for the unit test layout.

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
    ├─ Repository  ──────────────►  adapters/driven/database/
    │               (read/write)    IndexedDB
    │
    ├─ Pinia Store ──────────────►  adapters/ui/stores/
    │               (state update)  (reactive, in-memory)
    │
    └─ UI Update   ──────────────►  Vue reactivity propagates
                                    to all dependent components
```

External data (market prices) flows separately:

```
CompanyContent / HeaderBar refresh trigger
    │
    ├─ fetchAdapter  ────────────►  adapters/driven/fetch/
    │                               (HTTP + in-memory cache)
    │
    ├─ Provider scraper  ────────►  adapters/driven/fetch/providers/
    │
    └─ in-place write of mMin / mValue / mMax onto stocksStore.items
        └─ Vue reactivity → CompanyContent table cells update
```

---

*Generated: 2026-03-25 | Updated: 2026-08-08 (schema v28 / booking-type roles, script renames) | KontenManager
v28*