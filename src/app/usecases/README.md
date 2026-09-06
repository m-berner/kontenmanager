# Usecases Layer

This directory contains the application-layer workflows (multistep operations) used by dialogs and views.

Usecases:

- coordinate multiple repositories/stores
- enforce ordering/atomicity (transactions, rollback, confirmations)
- keep UI components thin (UI does map + guard + call a usecase)

## Principles

- No Vue imports: usecases should not depend on `inject()`, refs, or component lifecycle.
- Depend on small ports, not concrete Pinia stores:
    - ports live in [`ports.ts`](ports.ts)
    - UI adapts DI-provided services/stores to these ports
- Keep domain rules in `src/domain/*`. Usecases orchestrate, they do not own calculations/validation rules.

## Entry Points

Typical call site (from a dialog/view):

```ts
import {useAdapters} from "@/adapters/context";
import {useRecordsStore} from "@/adapters/ui/stores/recordsHub";
import {useRuntimeStore} from "@/adapters/ui/stores/runtime";
import {useSettingsStore} from "@/adapters/ui/stores/settings";
import {toRecordsPort, toSettingsPort} from "@/app/usecases/portAdapters";
import {addAccountUsecase} from "@/app/usecases/accounts";

const {databaseAdapter, repositories, alertAdapter, storageAdapter} = useAdapters();
const {setStorage} = storageAdapter();

const res = await addAccountUsecase(
    {
        databaseAdapter,
        repositories,
        records: toRecordsPort(useRecordsStore()),
        runtime: useRuntimeStore(),
        settings: toSettingsPort(useSettingsStore()),
        setStorage
    },
    {
        accountData,
        withDepot,
        bookingTypeLabels,
        initMessages: {title, message}
    }
);
```

Most concrete types (`repositories`, `runtime`, `databaseAdapter`) satisfy their port interfaces structurally and can be
passed directly. `records` and `settings` require the thin adapter wrappers from `src/app/usecases/portAdapters.ts` to
preserve Pinia reactivity.

## Backup Usecases

Backup import/export lives under `src/app/usecases/backup/*` with pure helper functions for unit testing. The public
surface is re-exported from [`backup.ts`](backup.ts).

## Detailed Walkthroughs

The `docs/` subdirectory has a dedicated, file-by-file walkthrough for each add/edit/delete flow below —
opening every file the corresponding `### N.M` subsection only names, with a sequence diagram for each:

| Entity                | Add                                                    | Edit                                                     | Delete                                                       |
|-----------------------|--------------------------------------------------------|----------------------------------------------------------|--------------------------------------------------------------|
| Booking (transaction) | [`docs/add-booking.md`](docs/add-booking.md)           | [`docs/edit-booking.md`](docs/edit-booking.md)           | [`docs/delete-booking.md`](docs/delete-booking.md)           |
| Account               | [`docs/add-account.md`](docs/add-account.md)           | [`docs/edit-account.md`](docs/edit-account.md)           | [`docs/delete-account.md`](docs/delete-account.md)           |
| Booking Type          | [`docs/add-booking-type.md`](docs/add-booking-type.md) | [`docs/edit-booking-type.md`](docs/edit-booking-type.md) | [`docs/delete-booking-type.md`](docs/delete-booking-type.md) |
| Stock                 | [`docs/add-stock.md`](docs/add-stock.md)               | [`docs/edit-stock.md`](docs/edit-stock.md)               | [`docs/delete-stock.md`](docs/delete-stock.md)               |

Every other `HeaderBar.vue` action that isn't an add/edit/delete triple also has its own walkthrough:

| Action                        | HomeContent or CompanyContent | Doc                                                  |
|-------------------------------|-------------------------------|------------------------------------------------------|
| Show Accounting               | Home                          | [`docs/show-accounting.md`](docs/show-accounting.md) |
| Export Database               | Home                          | [`docs/export-database.md`](docs/export-database.md) |
| Import Database               | Home                          | [`docs/import-database.md`](docs/import-database.md) |
| Refresh Quotes (Update Quote) | Company                       | [`docs/update-quote.md`](docs/update-quote.md)       |
| Fade In Stock                 | Company                       | [`docs/fade-in-stock.md`](docs/fade-in-stock.md)     |

Two `DotMenu.vue` row actions (dispatched via `useMenu.ts`, never from a `HeaderBar.vue` icon) round
out CompanyContent's stock-row menu:

| Action         | Doc                                                                                               |
|----------------|---------------------------------------------------------------------------------------------------|
| Show Dividends | [`docs/show-dividend.md`](docs/show-dividend.md)                                                  |
| Open Link      | *(not documented — a two-line `sanitizeExternalUrl` + `window.open` call, no dialog, no usecase)* |

Not documented as their own flow: `home`/`company` (a one-line `runtime.setCurrentView` view switch)
and `setting` (`browserAdapter.openOptionsPage()`, opening the browser's native extension options page) —
both are one-line calls with no dialog, no form, and no `app/usecases/` involvement at all.

## Workflows

This section walks through every user-facing workflow in KontenManager end to end — the user
action, the dialog/usecase call chain it triggers, and what the user sees afterward. It was
originally the standalone `WORKFLOWS.md` at the repo's `src/` root; it now lives here because
almost every step below funnels through this layer (`app/usecases/`), which is exactly where a
reader tracing "what happens when the user clicks Save" ends up. Sections outside the usecases
layer proper — extension startup, market-data fetch mechanics, settings/options, navigation, the
background script, and e2e coverage — are kept for the same reason: they're the context a usecase
runs in, not a separate document a reader would think to open instead.

### Table of Contents

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

### 1. Extension Startup

#### Trigger

User clicks the KontenManager toolbar icon in Firefox.

#### Processing Steps

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
    │   ├─ databaseAdapter.connect()    [opens/upgrades IndexedDB v30]
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

### 2. Account Management

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

#### 2.1 Add Account

*Detailed walkthrough: [`docs/add-account.md`](docs/add-account.md)*

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
        │                     ibanRules (checksum + duplicate check via
        │                     records.accounts.isDuplicate → domain/validation/
        │                     duplicates.ts's isDuplicateAccountIban), swiftRules,
        │                     nameRules, urlRules — the duplicate/checksum check
        │                     runs ONLY here, on add; see §2.2, it is dropped
        │                     entirely on update]
        │   └─ fail-closed: invalid, or no formRef and no explicit "no form" flag
        │      → returns without running onValid
        │
        └─ [validation passes]
            └─ addAccountUsecase(deps, payload)
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

#### 2.2 Update Account

*Detailed walkthrough: [`docs/edit-account.md`](docs/edit-account.md)*

**User actions:**

1. Opens account action menu → clicks **Edit**
2. Modifies fields
3. Clicks **Save**

**Processing:**

```
AccountForm.vue on the update path
    └─ ibanRules is [] entirely (not the add path's rule set with the edited
       account excluded) — IBAN is immutable once an account exists, so the
       field is unchecked and effectively read-only; see AccountForm.vue's
       own comment for why a disabled input's rules still running was itself
       a prior bug (a blank/invalid legacy IBAN permanently blocked Save)

updateAccountUsecase(deps, payload)
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

#### 2.3 Delete Account

*Detailed walkthrough: [`docs/delete-account.md`](docs/delete-account.md)*

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

#### 2.4 Switch Account

**User actions:**

1. Opens the account dropdown in TitleBar
2. Selects a different account

**Processing:**

```
TitleBar's v-select is v-model-bound to settings.activeAccountId,
so the new id is applied OPTIMISTICALLY before the handler runs
    └─ TitleBar.onUpdateTitleBar()
        ├─ databaseAdapter.getAccountRecords(selectedId)
        ├─ recordsStore.init(newData, translations)   [all sub-stores updated reactively]
        ├─ storageAdapter.setStorage(ACTIVE_ACCOUNT_ID, selectedId)
        └─ lastConfirmedAccountId = selectedId
        │
        └─ on failure: revert settings.activeAccountId to lastConfirmedAccountId,
           re-init the records from THAT account, then report the error
    │
    └─ AppIndex watchers fire on the changed settings.activeAccountId:
        ├─ runtime.clearStocksPages()
        └─ displayCurrency watcher (only if the new account's cCurrency differs)
            ├─ appAdapter.refreshExchangeRates(...)   [re-fetches the FX pairs]
            └─ runtime.clearStocksPages()             [after the await]
```

Note this does **not** go through `settingsStore.setActiveAccountId`, despite that setter existing for this key.
It cannot: the `v-select` has already written the ref, so `updateSetting`'s rollback would read the *new* id as the
"previous" one and revert to it — `lastConfirmedAccountId` is what actually knows the pre-switch account. A failed
switch must also revert the **record stores**, which the setter knows nothing about. See the note on
`setActiveAccountId` in `stores/settings.ts`.

**What the user sees:**

- TitleBar updates: account name, IBAN, logo, balance
- HomeContent table reloads with the new account's bookings
- CompanyContent reloads with the new account's stocks
- Quotes re-fetch, converted with the new account's currency (not the previous account's rates)

---

### 3. Transaction (Booking) Management

#### 3.1 Add Booking (Transaction)

*Detailed walkthrough: [`docs/add-booking.md`](docs/add-booking.md)*

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

#### 3.2 Update Booking

*Detailed walkthrough: [`docs/edit-booking.md`](docs/edit-booking.md)*

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

#### 3.3 Delete Booking

*Detailed walkthrough: [`docs/delete-booking.md`](docs/delete-booking.md)*

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

#### 3.4 Search Bookings

**User actions:**

1. Types in the search field above the booking table

**Processing:**

```
HomeContent search input (v-model="search")
    └─ VDataTable's own client-side filtering (Vuetify's useFilter), not a Pinia
       getter — `:search`, `:filter-keys="BOOKING_SEARCH_KEYS"`,
       `:custom-key-filter="customSearchKeys"` (composables/bookingSearch.ts),
       `filter-mode="union"`
        ├─ matches against, each compared to what the cell actually renders:
        │   description (raw), booking type name (resolved from cBookingTypeID),
        │   Soll/Haben (locale-formatted currency text), Datum (locale-formatted
        │   short date, plus the raw ISO string so a bare year still matches)
        └─ pagination resets to page 1 automatically (VDataTable's own behavior
           on a filtered result set)
```

No database query — all filtering is purely in-memory on the loaded dataset.

All four non-description keys share one function rather than four independent ones — a Vuetify
`filterMode="union"` quirk (see `bookingSearch.ts`'s own doc comment) requires every registered
`customKeyFilter` to agree for a row to be kept via customs alone, not an independent OR across
each; registering them separately silently broke matching on any one field alone.

A second, deeper issue existed alongside that one and predates all of it: `VDataTable` does not
hand a `customKeyFilter` the raw booking row — internally it wraps every row as `{type, key,
index, value, columns, raw}` and passes THAT to the filter function (its own default filter is
spared this, since it's fed an already-extracted field value). Reading a field directly off the
filter's `item` argument — the shape this file's booking-type-name filter used from its very
first version — is `undefined` on that wrapper, so the custom-filtered column silently matched
nothing **in production** despite passing every unit test (which drove Vuetify's `filterItems`
directly with plain, un-wrapped objects, never exercising `VDataTable`'s real item shape). Found
only by building the extension and driving it with Playwright; fixed by unwrapping `item.raw`
(the same pattern `CompanyContent.vue`'s `toStockIds` already uses for the identical class of
Vuetify-wrapping mismatch, on the `update:current-items` event instead of a filter). See
`bookingSearch.test.ts`'s `"VDataTable's real internal item shape"` block — the only tests in
that file that would have caught it, and the ones any future change to this file must keep green.

---

### 4. Booking Type Management

Booking types are account-scoped labels (e.g. "Buy", "Sell", "Dividend", "Fee") that categorize transactions.

Each type also carries a **role** (`cRole`): `buy`, `sell`, `dividend`, or `other`. The label is free text the
user can rename in any language; the role is what portfolio, invest, and dividend calculations key off
(`resolveTypeIdByRole` in `domain/logic.ts`). Renaming "Buy" to "Kauf" therefore changes nothing functionally,
while changing its *role* does.

Roles matter because `cID` auto-increments across the whole database rather than per account, so a fixed
numeric id identifies the Buy type only for the very first depot account ever created. A depot account gets its
Buy/Sell/Dividend types seeded automatically (§2.1, §2.2).

#### 4.1 Add Booking Type

*Detailed walkthrough: [`docs/add-booking-type.md`](docs/add-booking-type.md)*

**User actions:**

1. HeaderBar → **Manage Booking Types** → **Add**
2. Enters a label name
3. Clicks **Save**

`BookingTypeForm` has no role control — every added type is created with `cRole: "other"`. The
only way an account gets a `buy`/`sell`/`dividend`-role type is the default set seeded by
`createDefaultBookingTypes` (§2.1, §2.2); there is no dialog to promote a custom type to one of
those roles (see the "recovery existed but was undiscoverable" comment on `deleteBookingTypeUsecase`
in `usecases/bookingTypes.ts`).

**Processing:**

```
addBookingTypeUsecase(deps, {bookingTypeData, isDuplicateName})
    ├─ [cAccountNumberID not a positive integer] → throws xx_no_active_account
    ├─ isDuplicateName(cName)   [caller-supplied — the store's own case-insensitive,
    │  trim/whitespace-collapsed check — not a validationAdapter.* Vuetify rule]
    │      → {status: "duplicate"}, nothing written
    ├─ repositories.bookingTypes.save(bookingTypeData)   [IndexedDB write; save() runs
    │   the domain validateBookingType() internally, same as every other repository]
    └─ records.bookingTypes.add(newType)                  [reactive update]
```

---

#### 4.2 Update / Delete Booking Type

*Detailed walkthroughs: [`docs/edit-booking-type.md`](docs/edit-booking-type.md) ·
[`docs/delete-booking-type.md`](docs/delete-booking-type.md)*

Update follows the same pattern as add — IndexedDB first, then the Pinia store — with one extra guard:

```
updateBookingTypeUsecase(deps, {bookingType, isDuplicateName})
    ├─ isDuplicateName(cName, cID)                       → {status: "duplicate"}, nothing written
    ├─ if cRole !== "other":
    │   └─ repositories.bookingTypes.findByAccount(accountId)
    │       └─ another type already holds this role?    → {status: "roleConflict"} (nothing written)
    ├─ repositories.bookingTypes.save(bookingType)        [IndexedDB write]
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

Both dialogs are reached from the header bar, which gates them on
`records.hasActiveAccount` **before** the "this account has no booking types" check. Booking types are account-scoped,
and the record stores are not cleared when `activeAccountId` falls back to the no-account sentinel — so a bare
population count let either dialog open with no active account, listing the previous account's types. The length check
is kept underneath, because "this account has no booking types yet" is the more specific answer when an account *is*
active, and the only one of the two the user can act on.

---

### 5. Stock Portfolio Management

#### 5.1 Add Stock

*Detailed walkthrough: [`docs/add-stock.md`](docs/add-stock.md)*

**User actions:**

1. On CompanyContent → HeaderBar **Add Stock**
2. Enters: ISIN, (optional) stock exchange, company name, URL
3. Clicks **Save**

**Processing:**

```
AddStock dialog submit
    └─ useDialogGuards.submitGuard({formRef, onValid})
        ├─ form.validate()   [isinRules/symbolRules — checksum AND the duplicate-within-
        │  account check (via records.stocks.isDuplicate), urlRules — the usecase itself
        │  has no duplicate check of its own; the uk3/uk4 unique indexes are the backstop]
        │
        └─ addStockUsecase(deps, payload)
            ├─ rejects a stock whose cAccountNumberID is unset (precondition
            │   in the use case, not in each dialog)
            ├─ stockRepository.save(newStock)            [IndexedDB write; runs
            │   domain validateStock(), dropping the RAM-only m* fields]
            ├─ stocksStore.add(newStock)                  [merges INDEXED_DB.STORE.STOCK_MEMORY defaults]
            │   └─ mValue, mMin, mMax set to 0 (placeholders for online data)
            └─ runtimeStore.resetTeleport()
        │
        └─ post-save, OUTSIDE the add's error path:
            refreshOnlineData(res.page, {stockIds: [res.id]})
            ├─ bracketed by runtime.beginDownload()/beginStockLoading()
            └─ its own try/catch — a provider timeout here logs and is not
               reported as an add-stock failure, since the stock is already saved
```

The refresh is deliberately isolated from `submitGuard`'s catch. It runs after the write has committed and the success
alert has shown, so letting it throw produced "stock added successfully" immediately followed by an add-stock error for
a stock that *was* added — the same distinction `importDatabaseUsecase` draws for its post-commit steps. It passes
`stockIds` rather than relying on the positional page slice, which stops matching what is on screen once the user sorts
the table.

**What the user sees:**

- New row in CompanyContent, with market data filled in by the post-save refresh
- If that refresh fails, the row still appears with empty price cells; no error is shown for the add itself

---

#### 5.2 Update Stock

*Detailed walkthrough: [`docs/edit-stock.md`](docs/edit-stock.md)*

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

#### 5.3 Delete Stock

*Detailed walkthrough: [`docs/delete-stock.md`](docs/delete-stock.md)*

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

#### 5.4 Fade In Stock

*Detailed walkthrough: [`docs/fade-in-stock.md`](docs/fade-in-stock.md)*

**User actions:**

1. HeaderBar (Company view) → **Fade In Stock**
2. Selects a passive (previously faded-out) stock
3. Clicks **OK**

**Processing:**

```
updateStockUsecase(deps, {stock: {...selected, cFadeOut: 0}})
    ├─ stockRepository.save(stock)          [IndexedDB update; same usecase §5.2 uses]
    ├─ stocksStore.update(stock)            [reactive update]
    ├─ runtimeStore.resetTeleport()
    └─ runtimeStore.clearStocksPages()      [fade-out is a paging input]
```

Introduces no usecase of its own — it is a single-field call into the same
`updateStockUsecase` §5.2 (Update Stock) uses, with every field carried over from the
selected record except `cFadeOut`.

---

### 6. Live Market Data Refresh

#### 6.1 Automatic Load on CompanyContent

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
        ├─ Currency conversion (EUR ↔ USD, target = active account's cCurrency)
        ├─ Write mMin / mValue / mMax in place onto stocksStore.items
        │   ├─ Vue reactivity propagates to table cells
        │   └─ mChange is deliberately NOT written — portfolio.active derives it
        ├─ Write fetched cMeetingDay / cQuarterDay / cAskDates onto the same items,
        │   then persist those stocks via repositories.stocks.save()
        │   └─ these three are real DB columns; cAskDates is the "don't re-fetch for
        │      7 days" throttle, so store-only writes would reset it on every reload
        │      (failures are logged, not surfaced — prices already refreshed fine)
        └─ runtimeStore.markStocksPageLoaded(page)
```

A third trigger besides mount/page-change: `CompanyContent.vue` also watches `runtime.curUsd`/
`curEur` directly and re-fetches the currently rendered rows (via `refreshOnlineData`, not
`loadOnlineData` — same result, keyed by the rendered row ids rather than a page number) whenever
those divisors actually change while this view stays mounted. This is what repaints an
already-displayed quote correctly after a display-currency or provider change (§6.3, §10.2) that
happens while the user hasn't navigated away — invalidating the freshness cache alone does not
retroactively fix a value already on screen.

---

#### 6.2 Manual Refresh (Force Update)

*Detailed walkthrough: [`docs/update-quote.md`](docs/update-quote.md)*

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

#### 6.3 Provider Selection Impact

When the user changes the data provider in Settings, the next refresh automatically uses the new provider. The freshness
cache is also invalidated so stale data from the old provider is discarded.

If the change is away from `"none"` — a first-class, user-selectable "service disabled" option —
`AppIndex.vue`'s `settings.service` watcher also re-fetches the FX exchange rates, sharing one
`refreshRates()` (and its abort controller) with the `displayCurrency` watcher that re-fetches
them on an account switch or currency edit (`src/README.md` §12.1). Both FX writers (boot's
`fetchExternalData`, and `refreshExchangeRates` here) skip entirely while `"none"` is selected, so
without this the divisors a non-EUR/target-currency quote is converted by would still be whatever
they were left at — `1`, if the app booted with `"none"` selected — and a quote would render
unconverted under the correct-looking currency symbol. See §10.2 below for the settings-side view
of the same fix.

---

#### 6.4 HTTP Cache Behavior

| Data Type                       | Cache TTL  | Cache Layer     |
|---------------------------------|------------|-----------------|
| Stock quote (price)             | 1 minute   | httpCache (RAM) |
| Meeting/date data               | 5 minutes  | httpCache (RAM) |
| Exchange rates                  | 5 minutes  | httpCache (RAM) |
| Index data                      | 5 minutes  | httpCache (RAM) |
| Meeting/date lookup **failure** | 10 minutes | httpCache (RAM) |

Cache is in-memory only; it is cleared on import, provider switch, and page reload.

The failure row is a negative-result backoff, not a body cache: `fetchDateData` remembers a failed
lookup (keyed `datefail:<searchUrl>`) so a host-level failure — e.g. finanzen.net's Akamai
protection hard-403ing the extension — doesn't cost a fresh network request for every stock whose
meeting/quarter day has passed on every single page load. Before this, there was no backoff at
all: only the (separate, still-correct) refusal to overwrite a stock's stored dates with a
failure.

---

### 7. Financial Analytics

#### 7.1 Accounting View

*Detailed walkthrough: [`docs/show-accounting.md`](docs/show-accounting.md)*

**User actions:**

1. HeaderBar → **Show Accounting**

**Processing:**

```
ShowAccounting dialog opens
    └─ accountingStore (derived from bookingsStore + bookingTypesStore)
        ├─ sumBookingsPerType          — aggregates all bookings by booking type
        ├─ sumBookingsPerTypeAndYear(y) — same, restricted to one year
        └─ ShowAccounting.vue re-shapes the rows for the v-data-table:
            ├─ every type other than Buy/Sell (matched by cRole, not name) — sorted
            │   alphabetically, this is what the table paginates
            └─ pinned below the paginated body on every page, in this order:
               Buy, Sell, [Fees, Taxes — only when either is non-zero], Sum —
               all but Sum highlighted (category cell only) via a translucent
               `.category-highlight` background wash (style.css), theme-agnostic
               by construction rather than a per-theme text color

Fee / tax totals come from the per-booking amount fields, not from type labels:
    └─ domain/logic.ts: calculateSumFees / calculateSumTaxes (per year),
       calculateSumAllFees / calculateSumAllTaxes (all years)
        └─ each booking's own cFee / cTax / cSoli / cSourceTax / cTransactionTax

Fees/Taxes visibility AND their inclusion in Sum are both decided by
`domain/logic.ts`'s `resolveAccountingTotal(finalSum, taxes, fees)` — gated on the
figures themselves (`taxes !== 0 || fees !== 0`), not on whether the account is
currently marked `isDepot`. `cWithDepot` can be switched off on an account that
still carries Buy/Sell/Dividend booking types and fee/tax-bearing bookings
(toggling it off deletes nothing — §2.2), so gating on `isDepot` let a toggle
change what this dialog showed without changing the TitleBar's own account
balance (`domain/logic.ts`'s `calculateTotalSum`, not documented as its own
workflow subsection — it subtracts fees+taxes unconditionally, for every
booking, regardless of `isDepot`), producing two disagreeing totals for the
same account on screen at once.
```

All calculations are in-memory using `domain/logic.ts` aggregation functions with high-precision arithmetic. No database
query is made when opening this dialog.

---

#### 7.2 Dividend View

*Detailed walkthrough: [`docs/show-dividend.md`](docs/show-dividend.md)*

**User actions:**

1. Row action menu on a stock → **Show Dividends**

**Processing:**

```
ShowDividend dialog opens (dialogOk: false — read-only, no OK button)
    └─ domain/logic.ts: getDividendBookingsByStockId(bookings, stockId, bookingTypes)
        ├─ Resolves the account's dividend type by cRole — not by name or a fixed id,
        │   so a renamed "Dividend" label still resolves correctly
        ├─ Filters bookings for that type linked to the stock
        └─ Renders one row per dividend booking: ex-date + amount (cCredit)
```

No total and no yield calculation exist in this dialog — `docs/show-dividend.md` §5
covers a claim this section itself used to make about a yield figure that isn't actually
computed anywhere in the code.

---

#### 7.3 Portfolio Calculations (Depot Sum)

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

### 8. Data Export (Backup)

*Detailed walkthrough: [`docs/export-database.md`](docs/export-database.md)*

**User actions:**

1. HeaderBar → **Export Database**
2. Clicks **Download**

**Processing:**

```
ExportDatabase dialog
    └─ useExportDialog.run()   [returns {filename, dialogText, run}]
        └─ exportDatabaseUsecase(deps)
            ├─ Serialize all stores to JSON:
            │   { sm: { cVersion, cDBVersion: 30, cEngine: "indexeddb" },
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

### 9. Data Import (Restore)

*Detailed walkthrough: [`docs/import-database.md`](docs/import-database.md)*

**User actions:**

1. HeaderBar → **Import Database**
2. Selects a `.json` backup file
3. Reviews up to two confirmation dialogs (undated bookings, then existing-data deletion)
4. Clicks **Confirm**

**Processing** (`importDatabaseUsecase`, `usecases/backup/import.ts`, orchestrated by
`useImportDialog.runImport()`):

```
useImportDialog.runImport()   [file selection via onChange / fileBlob]
    └─ importDatabaseUsecase(deps, input)

Read & validate
    ├─ importExportAdapter.readJsonFile(fileBlob)   [FileReader + JSON.parse, size/blank checks]
    ├─ importExportAdapter.validateBackup(backup)
    │   ├─ Check top-level structure (cDBVersion, entity arrays)
    │   ├─ Reject versions older than INDEXED_DB.MIN_SUPPORTED_VERSION
    │   └─ [invalid] → onInvalidBackup(); stop
    └─ importExportAdapter.validateDataIntegrity(backup)
        ├─ Cross-reference: every booking/stock references a valid account, every
        │  booking references a valid booking type, no duplicate buy/sell/dividend
        │  role per account (checkDuplicateBookingTypeRoles)
        └─ [errors] → onIntegrityErrors(sliced to 5, +remainder note); resetTeleport(); stop

Undated-bookings confirmation (only if getImportCounts finds any)
    └─ confirmUndatedBookings(counts) → declined: onResetFileInput(); stop

Existing-data confirmation
    ├─ existingCounts read from the live record stores (accounts/bookings/bookingTypes
    │  counted directly; stocks excludes the cID-0 placeholder every account's stocks
    │  store carries, or a fresh install would always show "existing data")
    └─ confirmProceed(counts, existingCounts) → declined: onResetFileInput(); stop
        └─ [useImportDialog] "N account(s)/... " + "(Existing data will be deleted
           before the import)." only when existingCounts has anything real — no second
           count breakdown of what's being destroyed

Rollback snapshot (only after every confirmation, right before the write)
    └─ prepareRollback() → useImportDialog.createRollbackPoint()
        └─ databaseAdapter.getAllRecords()   [reads IndexedDB directly, not the in-memory
           stores — those hold only the ACTIVE account's bookings/stocks/bookingTypes]
        └─ [snapshot fails] → onResetFileInput(); stop (writing without a way back is
           worse than not importing)

Atomic write
    ├─ setActiveAccountIdPersisted(deps, activeId)   [first imported account's cID, or
    │  INDEXED_DB.INVALID_ID for an empty accounts array]
    ├─ buildModernImportPlan({backup, activeId})   [usecases/backup/importHelpers.ts:
    │  normalizes every entity, clear+repopulate descriptors, initData scoped to activeId]
    ├─ databaseAdapter.atomicImport(plan.descriptors)
    │   └─ batchOperations.executeAtomic(descriptors)   [single IndexedDB transaction]
    ├─ records.init(plan.initData, initMessages)   [refresh all UI state]
    ├─ runtime.resetTeleport(); clearStocksPages(); clearHttpCache()
    │
    ├─ [SUCCESS] → onImported(counts); onResetFileInput()
    │
    └─ [FAILURE] (anything from atomicImport onward)
        └─ onError(message, didAttemptWrite)
            └─ [only if didAttemptWrite] restoreFromRollback(rollbackData)
                ├─ atomicImport([clear+re-add every store from the snapshot])
                │  [FAILURE here] → feedbackError("Rollback failed"); stop
                ├─ setActiveAccountIdPersisted(deps, rollbackData.activeAccountId)
                └─ records.init({...}, initMessages)   [re-hydrated RAW, the same as
                   boot — not re-run through validateBooking/applyBookingRoleInvariants;
                   the DB write just above restores these exact rows]
```

**What the user sees:**

- Success: app reloads with restored data, confirmation toast
- Failure: error alert; if the write was ever attempted, a rollback runs and reports its
  own success/failure separately; if nothing was written yet (validation/confirmation
  declined, or the rollback snapshot itself couldn't be taken), the original data is
  simply untouched

---

### 10. Settings & Preferences

Settings are managed in the **Options page** (accessible via the extension settings icon) and persist to
`browser.storage.local`.

#### 10.1 Theme Change

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

#### 10.2 Data Provider Change

**User actions:** Options page → **Market Data** tab → select provider

**Processing:**

```
settingsStore.setService(newProvider)
    └─ storageAdapter.setStorage(SERVICE, newProvider)
        └─ AppIndex.vue's watcher on settings.service fires
            ├─ fetchAdapter.clearCache?.()
            └─ once initialized: refreshRates()
                ├─ appAdapter.refreshExchangeRates(...)   [see below — "none" skipped this before]
                └─ runtimeStore.clearStocksPages()        [after the await]
```

Cache invalidation lives in watchers registered **once** in `AppIndex.vue`, not in the setter and not per call
site — the same applies to `settings.activeAccountId` and `settings.stocksPerPage`. `AppIndex` is the app shell, so
those watchers live for the whole session; a route component's would exist only while that route is mounted, which is
why `CompanyContent`'s duplicate `stocksPerPage` watcher was removed rather than `AppIndex`'s.

Two cases need more than invalidation, and share one `refreshRates()` (one abort controller, so whichever fires most
recently wins):

- The **display currency** changes — switching accounts, editing the active account's `cCurrency`, or changing
  `settings.currency` with no account active. Invalidating alone would re-fetch every quote and re-convert it with
  `runtime.curUsd`/`curEur` still holding the previous currency's divisors.
- The **provider changes away from `"none"`**. `"none"` is a first-class, user-selectable provider (options page lists
  it as "service disabled"), and both FX writers (`fetchExternalData` at boot, `refreshExchangeRates` here) skip
  entirely while it's selected — so a user who starts on `"none"` and later picks a real provider got quotes (cache
  invalidation alone made `CompanyContent` re-fetch) but no divisors to convert a non-target-currency quote by, and it
  rendered unconverted under the correct-looking currency symbol.

See `src/README.md` §12.1 (Architecture section) — including the correction there about `clearStocksPages()` only
invalidating freshness markers, not repainting an already-mounted `CompanyContent`, which has its own watcher on the
resolved divisors for exactly that.

---

#### 10.3 Pagination Settings

**User actions:** Options page → **Display** tab → adjust rows per page

**Processing:**

```
settingsStore.setBookingsPerPage(n)  /  setStocksPerPage(n)
    └─ storageAdapter.setStorage(BOOKINGS_PER_PAGE / STOCKS_PER_PAGE, n)
        └─ v-data-table itemsPerPage binding updates reactively
```

---

#### 10.4 Market Preferences (Exchanges, Indexes, Commodities)

**User actions:** Options page → **Market Data** tab → toggle items

**Processing:**

```
DynamicList (exchanges/markets) or CheckboxGrid (indexes/materials)
    └─ storageAdapter.setStorage(EXCHANGES / MARKETS / INDEXES / MATERIALS, selectedList)
        └─ settings store's storage listener (applyStorageChange) updates its ref
            └─ InfoBar re-renders with only the selected entries
```

These four lists have no store setter: unlike `skin` / `service` / pagination, the components write to
`browser.storage.local` directly and the settings store picks the change back up through its storage listener (the same
path that syncs the app tab when the options page changes a setting).

The data **source** for indexes and materials (`fnet` vs `wstreet`) is a separate, single setting —
`settings.marketDataService` — with a real store setter (`setMarketDataService`), same shape as `skin`/`service`.
It lives on the **Services** tab (`MarketDataServiceSelector`, next to `ServiceSelector`), not on the
Indexes or Commodities tab: materials and indexes always use the same source, so there is nothing to configure
per-tab. See `/src/README.md`'s "Fetch Adapter & Online Data" section for the two sources themselves.

---

### 11. Navigation & View Switching

#### 11.1 Home View ↔ Company View

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

#### 11.2 Privacy / Help Pages

Routes `/privacy` and `/help` render static informational content. No data queries are made.

---

#### 11.3 Keyboard Shortcuts

| Shortcut         | Action                                             |
|------------------|----------------------------------------------------|
| `Ctrl + Alt + R` | Reset browser.storage.local to defaults and reload |

---

### 12. Background Script Lifecycle

The background script runs in a separate, lightweight context with minimal dependencies.

#### 12.1 First Install

```
browser.runtime.onInstalled fires (reason: "install")
    └─ storageAdapter.installStorageLocal()
        └─ browser.storage.local.set(ALL_DEFAULTS)
            ├─ SKIN: "ocean"
            ├─ SERVICE: "wstreet"
            ├─ ACTIVE_ACCOUNT_ID: -1
            └─ all pagination defaults
```

#### 12.2 Extension Update

```
browser.runtime.onInstalled fires (reason: "update")
    └─ storageAdapter.installStorageLocal()
        └─ Merges new default keys without overwriting existing user settings
```

#### 12.3 Toolbar Icon Click

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

#### 12.4 New Tab Created (any tab, not just the toolbar click path)

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

### 13. E2E Test Coverage

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

### Data Flow Summary

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

*Workflows section generated: 2026-03-25 | Updated: 2026-08-12 (schema v29 / account currency,
corrected two stale v28 references) | Merged into this README from `src/WORKFLOWS.md`: 2026-08-13 |
Updated: 2026-09-05 (schema v30 / collapsed tax-fee Credit-Debit pairs; §9 Data Import rewritten
to match the current confirm/rollback flow; §10.2 Data Provider Change covers the FX-refresh fix) |
KontenManager v30*

## Directory Structure

### Directories

- `backup/`
- `records/`

### Files

- `accounts.ts`: AddAccountUsecaseDeps, DeleteAccountUsecaseDeps, UpdateAccountUsecaseDeps, addAccountUsecase,
  deleteActiveAccountUsecase, ...
- `backup.ts`: exportDatabaseUsecase, createExportFilename, createExportMetadata, estimateSizeKb,
  findExportConsistencyIssues, ...
- `bookings.ts`: AddBookingUsecaseDeps, RemoveBookingUsecaseDeps, UpdateBookingUsecaseDeps, addBookingUsecase,
  removeBookingUsecase, ...
- `bookingTypes.ts`: AddBookingTypeUsecaseDeps, DeleteBookingTypeUsecaseDeps, UpdateBookingTypeUsecaseDeps,
  addBookingTypeUsecase, deleteBookingTypeUsecase, ...
- `portAdapters.ts`: RecordsLike, toSettingsPort, setActiveAccountIdPersisted, toRecordsPort
- `ports.ts`: TxOptions, AccountRepositoryPort, AlertPort, BookingRepositoryPort, BookingTypeRepositoryPort, ...
- `stocks.ts`: AddStockUsecaseDeps, RemoveStockUsecaseDeps, UpdateStockUsecaseDeps, addStockUsecase,
  removeStockUsecase, ...

