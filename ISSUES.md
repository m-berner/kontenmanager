# ISSUES — full `src/` audit, 2026-08-09

Scope: every file under `/src` (191 files; 185 `.ts`/`.vue`, ~26.7k lines), read
in full. Baseline before the audit was green: `vue-tsc --noEmit` clean,
`vitest run` 84 files / 838 tests passing, `eslint` clean, `i18n-lint` clean.

**Status: everything actionable is FIXED** — the High, both Mediums, all 13 Lows
and the three Infos that had an action (I2 was already resolved by
documentation). After the fixes: `vue-tsc` clean, **867/867** unit tests (29 new
regression tests), `eslint` clean, `i18n-lint` clean.

One finding was **narrowed rather than fixed as written**: see L2, where half of
what this register claimed turned out to be wrong.

**The I3 cleanup uncovered a real latent defect** that no finding here had
spotted — see I3.

**Tags.** *Verified* = the defect was traced end to end through the code (and,
where a library's behaviour decides it, confirmed against the installed source
in `node_modules`). *Reasoned* = the mechanism is read correctly but the
triggering state was not reproduced.

| # | Severity | File | Summary |
|---|----------|------|---------|
| H1 | High — **FIXED** | `AccountForm.vue` / `validationAdapter.ts` | An account with a blank or invalid IBAN can never be edited again |
| M1 | Medium — **FIXED** | `app/usecases/backup/export.ts` | Export reads the four stores in four separate transactions |
| M2 | Medium — **FIXED** | `useImportDialog.ts` / `backup/import.ts` | A full-database rollback runs for failures that wrote nothing |
| L1 | Low — **FIXED** | `domain/utils/url.ts` | Scheme-less stock URLs are rejected at entry and silently stop opening |
| L2 | Low — **FIXED** | `stores/portfolio.ts` | `sumDepot` uses a bare `-1` and a weaker predicate than `hasActiveAccount` |
| L3 | Low — **FIXED** | `fetchAdapter.ts` | Index matching is substring-in-reverse, and all 18 indexes are scanned |
| L4 | Low — **FIXED** | `ShowAccounting.vue` | The "All years" sentinel `1000` collides with a real calendar year |
| L5 | Low — **FIXED** | `HomeContent.vue` | The `beforeunload` DB disconnect only exists on the Home route |
| L6 | Low — **FIXED** | `useMenu.ts` | `hasAction` is an unsound type predicate with no callers |
| L7 | Low — **FIXED** | `CompanyContent.vue` | `isDownloading` is set on the initial sweep but not on later refetches |
| L8 | Low — **FIXED** | `ContentCard.vue` | `getListContent(item)` is evaluated twice per rendered item |
| L9 | Low — **FIXED** | `importExportAdapter.ts` / `export.ts` | The export string is fully re-parsed and re-encoded twice after being built |
| L10 | Low — **FIXED** | `migrator.ts` | The backfill cursors' `update()` requests carry no `onerror` |
| L11 | Low — **FIXED** | `migrator.ts` | The v27 index migration re-runs on a brand-new database |
| L12 | Low — **FIXED** | `connectionManager.ts` | "Already connected" is logged at `warn` on the ordinary retry path |
| L13 | Low — **FIXED** | `composables/bookingSearch.ts` / `HomeContent.vue` | The "recomputed" comment describes a mechanism that does not run |
| I1 | Info — **FIXED** | `useMenu.ts`, `stores/stocks.ts` | Exports with no `src/` consumer |
| I2 | Info — no action | `healthChecker.ts`, `transactionManager.ts`, `batchOperations.ts` | Test-only surfaces, re-confirmed |
| I3 | Info — **FIXED** | `CheckboxGrid.vue`, `DynamicList.vue` | The options page keeps a second copy of settings state |
| I4 | Info — **FIXED** | `alertAdapter.ts` | Two different idioms for resolving the default alert duration |

---

## High

### H1 — An account with a blank or checksum-invalid IBAN can never be edited again

**Verified.** `AccountForm.vue:130-137`, `validationAdapter.ts:286-311`,
`useDialogGuards.ts:287-319`.

The IBAN field is `:disabled="props.isUpdate"`, so on the update path the user
cannot change it. Its `:rules` binding is still `validationAdapter.ibanRules(...)`,
which is `required(...)` plus the domain `validateIBAN` check.

Vuetify runs a disabled input's rules anyway. Confirmed against the installed
source:

- `vuetify/lib/composables/validation.js` — `useValidation` registers with the
  form unconditionally in `onBeforeMount`, and its `validate()` loops
  `rules.value` with no `disabled`/`readonly` short-circuit. The `isDisabled` it
  exposes is `form.isDisabled` (the **form's** prop), not the input's own.
- `vuetify/lib/composables/form.js` — `createForm.validate()` iterates every
  registered item and awaits `item.validate()`; there is no filter.

So `submitGuard`'s `validateForm(formRef)` returns `{valid: false}`, it shows the
generic `xx_form_invalid` warning and returns without running `operation`. The
user cannot change the account's **currency, SWIFT, depot flag or logo** — and
nothing on screen says why, because the offending field is greyed out.

Reachability is not theoretical; a blank IBAN is a first-class state this
codebase goes out of its way to support:

- `AccountDb.cIban` is optional *by design* (`types/domain.ts:28-31`), because
  `accounts_uk1` is a **global** unique index and IndexedDB indexes `""` as a
  colliding value.
- `accountRepository.save()` and `importHelpers.stripBlankAccountIban()` both
  `delete` a blank `cIban`.
- `initializeRecords()` normalizes it back to `""` on the read path.
- `TitleBar.accountItems` has a dedicated `mLabel` fallback
  (`cSwift` → `#${cID}`) written specifically so blank-IBAN accounts remain
  selectable.

The invalid-but-non-blank case is reachable the same way: `validateAccount()`
only *logs a warning* for a failed `validateIBAN` and stores the record anyway
(`validators.ts:82-89`), so any imported IBAN that fails MOD-97 produces the same
lockout via the checksum rule rather than the `required` rule.

**Failure scenario.** Import a backup containing an account with no `cIban` (or
one whose IBAN fails the checksum). Select it in the title bar. Open *Update
account*, change the currency from EUR to USD, click OK. Nothing happens beyond a
generic "form invalid" toast; the account is permanently uneditable.

**FIXED.** `AccountForm.vue` now resolves the field's rules through a computed
that yields `[]` on the update path — a field the user cannot edit does not gate
the form. The add path is unchanged (`excludeId` went with the update branch; it
was only ever non-`undefined` there). `CurrencyInput.vue` carried the same latent
shape (`:disabled` + `:rules` on one input) and now returns no rules while
disabled; it was harmless today only because nothing passes `disabled` and
`oneOfTwo` accepts the `0` a disabled amount holds.

**No unit test.** This repo has no component-mounting harness — `@vue/test-utils`
is not a dependency and the files under `tests/unit/adapters/ui/components/` are
store-level logic tests, not mounts — so the template binding cannot be asserted.
A static "no input binds both `:disabled` and `:rules`" architecture check was
considered and rejected: `CurrencyInput` and `CreditDebitFieldset` legitimately
bind both while handling the interaction internally, so the predicate would have
to be fuzzy to be satisfiable. This one is e2e-shaped; see the coverage gaps.

---

## Medium

### M1 — `exportDatabaseUsecase` reads the four stores in four separate transactions

**Verified.** `app/usecases/backup/export.ts:62-67`.

```ts
const [accounts, bookings, stocks, bookingTypes] = await Promise.all([
    deps.repositories.accounts.findAll(),
    deps.repositories.bookings.findAll(),
    ...
]);
```

No `{tx}` is passed, so `baseRepository.runInTransaction` falls through to
`transactionManager.execute(storeName, …)` and opens **one transaction per
store**.

`databaseAdapter.getAllRecords()` exists for exactly this call and states the
reason in its own doc comment — *"Read in a single readonly transaction so the
four stores cannot be observed at different points in time"* — and is already
used by the import rollback point. The export duplicates the read without the
guarantee, and then runs `findExportConsistencyIssues` over the result, i.e. it
checks referential integrity across a snapshot that may be torn.

Stated honestly: the window is narrow. Single-tab enforcement rules out a second
app tab, and the dialog port allows only one dialog at a time, so the only writer
that can realistically interleave is `useOnlineStockData`'s date persistence
(`repositories.stocks.save`) — which does not change ids and so cannot by itself
manufacture a dangling reference. The certain part is the duplication of a
helper written to prevent this, in the one place whose output the app must later
be able to re-import.

**FIXED.** A new `DatabaseSnapshotPort` (`app/usecases/ports.ts`) declares
`getAllRecords`, and `ExportDatabaseUsecaseDeps` now takes `databaseAdapter`
in place of `repositories`. `useExportDialog`'s `services` and
`ExportDatabase.vue` were threaded through to match, with the port narrowed by
`Pick<DatabaseAdapter, "getAllRecords">` exactly as `useImportDialog` already
narrows its own. Regression test: *"reads the whole database in one snapshot
call, not per store"* — the test builder now stubs one `getAllRecords` rather
than four `findAll`s, which is itself the point: four independent stubs could
not express the difference, which is why the torn read went unnoticed.

### M2 — A full-database rollback runs for import failures that wrote nothing

**Verified.** `useImportDialog.ts:291-431`, `backup/import.ts:148-174`.

`runImport()` calls `createRollbackPoint()` — a `getAllRecords()` read of the
*entire* database — **before** `importDatabaseUsecase` has looked at the file at
all. It then passes an `onError` callback that runs `rollbackOnce()`, i.e. an
`atomicImport` of `{type: "clear"}` + one `add` per record across all four
stores, followed by `records.init`.

`importDatabaseUsecase`'s catch fires for every failure, including ones that
happen before any write:

- `readJsonFile` rejecting on a malformed or oversize file,
- `parseJson` rejecting on non-object JSON,
- a `setStorage` rejection in `setActiveAccountIdPersisted`.

For each of those the user's database is fully read, then fully cleared and
rewritten, and they are told "rollback succeeded" — for a file that was never
applied. On a large database that is two complete passes over every record to
undo nothing.

The file already recognises the shape one case earlier: the `askConfirmation`
comment (line 256-271) notes that a confirm-busy rejection "ran a full rollback
and showed a database error, telling the user their import had failed when all
that happened was that another dialog was up", and fixes it by absorbing that one
rejection. The broader case — *the usecase can fail before it writes* — was not
addressed.

**FIXED — both halves.**

- `importDatabaseUsecase` now takes a `prepareRollback(): Promise<boolean>`
  callback and invokes it once, after both confirmations and immediately before
  `setActiveAccountIdPersisted` (it must precede that, since the snapshot carries
  `activeAccountId` and the rollback restores it). A file that fails to parse,
  fails validation, or is declined no longer costs a whole-database read.
  Returning `false` aborts the import — writing without a way back is worse than
  not importing — which preserves the previous "no rollback point" behaviour.
- `onError` gained a `didAttemptWrite` argument, set from a local flag flipped
  immediately *before* `atomicImport`, not after: `transactionManager.execute`
  logs "abort failed — writes may have been committed" for the auto-commit case,
  so a throw out of `atomicImport` is not proof nothing landed. Erring toward
  "we wrote" costs a redundant restore; the other direction loses data.
  `rollbackOnce()` also now returns `false` when no snapshot exists yet.

Four regression tests in `import.test.ts`: a pre-write failure reports
`didAttemptWrite: false`; no snapshot is taken for an invalid backup; none for a
declined confirmation; and a refused snapshot aborts without writing. The two
existing `onError` assertions were updated to the new arity with a comment
pointing at the flag.

---

## Low

### L1 — Scheme-less stock URLs are rejected at entry and silently stop opening

**Verified.** `domain/utils/url.ts:161-182`, `validationAdapter.ts:377-384`,
`useMenu.ts:353-367`.

`sanitizeExternalUrl` calls `new URL(trimmed)` with no base, so a bare
`www.example.com` throws and returns `null`. `UrlUtils.parseUrl`, twelve lines
above it in the same file, prepends `https://` for precisely this shape — the
difference is deliberate and correctly documented (parseUrl's prepend would mask
`javascript:`), but the consequence for the *bare domain* case was not
considered.

Two effects on a stock saved before `urlRules` existed (the field had no `:rules`
binding at all until recently, so bare domains are the expected legacy content):

- `useMenu.openLink` reports "no link" and the row's menu item does nothing.
- Re-saving that stock from *Update stock* is blocked until the user prefixes the
  scheme, and the message is `validators.urlRules.invalid` — "invalid URL" —
  rather than "add https://".

**FIXED.** `sanitizeExternalUrl` prepends `https://` when the value carries no
scheme at all. The guard is the *presence of a scheme*, not `startsWith("http")`
— the latter is `UrlUtils.parseUrl`'s rule and would rewrite
`javascript:alert(1)` into a valid https URL, defeating the allowlist. A
scheme-less `host:port` is unchanged: it matches the scheme pattern, parses
as-is, and is still rejected. Six new cases in `url.test.ts` pin both halves.

### L2 — `sumDepot` uses a bare `-1` and a weaker predicate than `hasActiveAccount`

**Verified.** `stores/portfolio.ts:75-78`.

```ts
if (settings.activeAccountId === -1) return 0;
```

Two things. The literal should be `INDEXED_DB.INVALID_ID` — `accounts.ts:211-213`
states the convention outright ("not a bare -1: it is the named 'no active
account' sentinel and is what every other call site in this layer compares
against"). And the test is weaker than `recordsHub.hasActiveAccount`
(`id > 0 && accountsStore.getById(id) !== null`), so a *dangling* active id — one
pointing at a deleted account — makes `sumDepot` compute and display a total while
`hasActiveAccount` reports no account is selected. `recordsHub` documents that
dangling ids are a real state the bare comparison "would wave through".

**PARTLY FIXED — and the second half of this finding was wrong.**

The constant is now `INDEXED_DB.INVALID_ID`. That part stands.

Aligning with `hasActiveAccount` does not. It was implemented, and two existing
tests immediately failed (`portfolio.test.ts`, `stocks.test.ts`) because they set
an `activeAccountId` with stocks and bookings loaded but no matching account row
— and on reflection they are right to. `hasActiveAccount` guards *writes* and
dialog entry ("can I record a booking under this account?"), which is a different
question from "what are the loaded stocks worth". `sumDepot` aggregates
`portfolio.active`, and `CompanyContent` renders those same rows with their
values regardless; returning 0 for a dangling id would put a `0` in the app bar
above a table full of holdings — trading the inconsistency this register
complained about for a more visible one.

The original register overreached by treating a naming/convention observation as
licence for a semantic change. The reasoning is now recorded at the call site so
the next pass does not re-derive it.

### L3 — Index matching is substring-in-reverse, and all 18 indexes are scanned

**Verified.** `fetchAdapter.ts:367-405`.

```ts
if (SETTINGS.INDEXES[property]?.includes(title) && numberText) {
```

This asks whether the *configured label* contains the *scraped link title*, which
is the reverse of the usual containment test and makes a shorter title match a
longer label — a link titled `"DA"` would be accepted as `"DAX"`, and `"S&P"`
as `"S&P/TSX"` or `"S&P 500"` depending on iteration order. The intended relation
(the scraped title identifies the index) is exact equality or a
label-contains-title test with a length guard.

Separately, the outer loop is over `Object.keys(SETTINGS.INDEXES)` — all 18 — not
over `settings.indexes`, which defaults to two. The other 16 are fetched, parsed
and returned on every app start, and `InfoBar` renders only the configured ones.

**FIXED (matching); the "all 18" half deliberately left alone.**

Matching now: drops untitled links up front, compares trimmed and case-folded
(it was neither, so a title differing only in case matched nothing), prefers an
*exact* title across all candidates before falling back to containment, and
claims each link for at most one index — the concrete hazard, since `"S&P"` is
contained in both `"S&P 500"` and `"S&P/TSX"` and each property previously
scanned independently and took its first hit. Three new cases in `fetch.test.ts`.

The "scans all 18" half is **not** worth fixing and the register overstated it as
a cost: it is a nested loop over an already-parsed document, not extra network,
and restricting it would mean plumbing `settings.indexes` through `appAdapter`
into `fetchAdapter` for microseconds.

### L4 — The "All years" sentinel collides with a real calendar year

**Verified.** `constants/core.ts:375` (`ALL_YEARS_ID: 1000`),
`ShowAccounting.vue:27-49`.

`DATE.UNDATED_YEAR` is `-1` and its doc comment explains the choice: "`-1` is
unreachable from a real ISO date, which `ISO_DATE_REGEX` requires to be four
digits." `ALL_YEARS_ID` is `1000`, which **is** four digits and therefore
reachable — `bookedYears` would legitimately contain it for a booking dated
`1000-06-15`, which a hand-edited backup can carry (`normalizeDate` accepts any
regex-valid, calendar-valid ISO date).

The selector would then show two entries reading "All years" and "1000", and
`getAccountData(1000)` takes the all-years branch for both, so the year-1000 row
silently shows all-time figures. Same class as the sentinel reasoning already
applied to `UNDATED_YEAR`, applied to only one of the two sentinels.

**FIXED.** `ALL_YEARS_ID` is now `-2` — negative for the reason `UNDATED_YEAR`
already documents, and `-2` rather than `-1` because the two must stay
distinguishable (`getAccountData` and `getYearTitle` both branch on them). The
value is transient UI state, never persisted, so no migration is involved.

### L5 — The `beforeunload` DB disconnect only exists on the Home route

**Verified.** `HomeContent.vue:55-58, 168-177`.

`window.addEventListener("beforeunload", onBeforeUnload)` is registered in
`HomeContent`'s `onBeforeMount` and removed in its `onUnmounted`. Navigate to
`/company`, `/help` or `/privacy` and close the tab, and
`databaseAdapter.disconnect()` never runs.

Low because the browser tears the connection down regardless. Worth recording
because the app's only self-initiated disconnect is route-dependent in a way the
handler's placement does not suggest, and `connectionManager.disconnect()` was
specifically hardened for this call site ("HomeContent's beforeunload calls this,
which is exactly when a slow connect could still be in flight").

**FIXED.** The listener moved to `AppIndex`, the always-mounted app shell, and
`HomeContent` keeps only its `Ctrl+Alt+R` shortcut. Also dropped `{once: true}`:
a page entering the back/forward cache can fire this and then be revisited, and a
one-shot listener would silently not be there the second time.

### L6 — `hasAction` is an unsound type predicate with no callers

**Verified.** `useMenu.ts:410-412`, returned at line 416; `grep` over `src/`
finds no consumer.

```ts
const hasAction = (actionType: string): actionType is MenuActionType =>
    actionType in actionHandlers;
```

Since `actionHandlers` was narrowed to `RowMenuActionType` (6 members), this
returns `false` for the other 17 members of `MenuActionType` — `"home"`,
`"addStock"`, `"exportDatabase"`, … — while its return type tells TypeScript that
a `false` means "not a `MenuActionType`". Any future caller writing
`if (hasAction(x)) … else /* x: string */` gets a narrowing that is simply wrong.

No caller exists today, so this is latent. It is exported from the composable's
public surface, which is how one would be found.

**FIXED — and the register's "no callers" framing was sloppy.** It has no
*production* caller, but it does have four dedicated tests
(`useMenu.test.ts:114-130`) pinning exactly the row-only behaviour, which is why
it was corrected rather than deleted. `RowMenuActionType` moved to module scope
(a predicate has to name the type it proves) and `hasAction` now narrows to it.
Runtime behaviour is unchanged; the tests pass untouched, and `tsc` covers the
type.

### L7 — `isDownloading` is set on the initial sweep but not on later refetches

**Verified.** `CompanyContent.vue:296-308` vs `319-337`; `TitleBar.vue:246-263`.

`onBeforeMount` brackets its load with both `beginDownload()/endDownload()` and
`beginStockLoading()/endStockLoading()`. `onCurrentItems` — which owns every
refetch after a page change or a re-sort — uses only the stock-loading pair.

`TitleBar` shows the depot chip on `currentView === "company" && !isDownloading`,
so the chip is hidden during the initial quote sweep and stays visible during
every subsequent one. The two paths do the same work and should report it the
same way.

**FIXED.** `onCurrentItems` now raises and releases both pairs, matching
`onBeforeMount`. The early returns (first emit, empty row set) still happen
before either flag is touched.

### L8 — `getListContent(item)` is evaluated twice per rendered item

**Verified.** `ContentCard.vue:105-111`.

```html
<v-card-text v-if="getListContent(item).length > 0">
  <li v-for="(step, index) in getListContent(item)" ...>
```

Each call re-runs `tm(content)` and maps `rt()` over the whole array. Static
content and short arrays, so the cost is trivial — it is listed because the
duplication is invisible at the call site and a `computed`/single local would
read better.

**FIXED.** A `sections` computed resolves each item's icon, subtitle, list and
text once; the template reads those fields. The nested `v-for` index was also
shadowing the outer one, so the inner is now `stepIndex`.

### L9 — The export string is fully re-parsed and re-encoded twice after being built

**Verified.** `importExportAdapter.ts:194-221`, `export.ts:97-109`.

After `stringifyDatabase` produces the JSON, `verifyExportIntegrity` runs a full
`JSON.parse` plus `validateBackup` plus `validateDataIntegrity` over the parsed
copy, and `estimateSizeKb` then runs `new TextEncoder().encode(data)` over the
whole string to measure it.

For an export approaching the 64 MB `MAX_EXPORT_SIZE_KB` ceiling that is the
string, a second full object graph, and a byte array of the same length, all live
at once — in a page that is still holding the four record arrays the string was
built from. `Blob.size` would give the byte length without the copy.

**PARTLY FIXED, by design.** `estimateSizeKb` now walks the string and counts
UTF-8 bytes instead of allocating a `Uint8Array` to read `.length` off it — one
whole-buffer allocation removed. Seven parameterised tests assert it agrees with
`TextEncoder` exactly, including the cases a hand-rolled walk has to get right
alone: multi-byte scalars, surrogate pairs (4 bytes over two code units), and
lone surrogates (replaced by U+FFFD at 3 bytes).

`verifyExportIntegrity`'s `JSON.parse` stays. Re-parsing the exact string that
will be written *is* the check — removing it would drop a real guarantee about
the round trip to save a pass.

### L10 — The backfill cursors' `update()` requests carry no `onerror`

**Verified.** `migrator.ts:163-238`.

Both `backfillBookingTypeRoles` and `backfillAccountCurrency` attach an `onerror`
to `store.openCursor()`, each with a comment explaining why ("without this the
cursor's failure surfaces as an unhandled request error that aborts the whole
version-change transaction with none of the migrator's own context attached").

The `cursor.update({...})` request inside the success handler — the one that
actually writes — has no handler at all, so a failure there produces exactly the
context-free transaction abort the `openCursor` handler was added to prevent.

**FIXED.** Both backfills now attach an `onerror` to the `update()` request,
logging the store and the offending `cID`. This surfaced a gap in the test
double, which returned `undefined` from `cursor.update()` — the real
`IDBCursor.update()` always returns an `IDBRequest` (the same guarantee
`baseRepository.deleteByCursor` documents for `cursor.delete()`), so the double
was modelling a cursor that cannot exist. Corrected there too.

### L11 — The v27 index migration re-runs on a brand-new database

**Verified.** `migrator.ts:273-284, 293-313`.

`setupDatabase` calls `createStores(db)` unconditionally (correct, and documented),
which for a fresh database creates `stocks_uk1`–`uk4` in their current form. Then
`runMigrations` sees `oldVersion === 0` and runs
`migrateStocksAccountScopedUniqueness`, which deletes `uk1`/`uk2` and recreates
them with the definitions `createStores` just used, then skips `uk3`/`uk4`
because they exist.

Harmless, but it means every fresh install executes a migration whose entire
purpose is to repair a pre-v27 schema. A `oldVersion > 0 && oldVersion < 27`
guard would say what is meant.

**FIXED.** That guard, plus a test driving the real fresh-install path
(`oldVersion: 0`, `objectStoreNames.contains` false) and asserting neither
`deleteIndex` nor `createIndex` is called on the existing-store mock. The
backfills need no equivalent guard — they are naturally inert on an empty store.

### L12 — "Already connected" is logged at `warn` on the ordinary retry path

**Verified.** `connectionManager.ts:67-70`.

```ts
if (db) { log("DATABASE connection: already connected", null, "warn"); return Promise.resolve(); }
```

`appAdapter.initializeDatabase` calls `connect()` on every initialization,
including `AppIndex`'s user-facing retry button. A retry after a *non-database*
failure therefore emits a warning for the expected case. `info`, or nothing, is
the honest level.

**FIXED.** Now `info`.

### L13 — The "recomputed" comment describes a mechanism that does not run

**Verified.** `HomeContent.vue:47-49`, `stores/bookingTypes.ts:54-59`.

```ts
// Recomputed so a renamed booking type is searchable under its new name.
const customSearchKeys = computed(() =>
    createBookingSearchFilter(records.bookingTypes.getNameById)
);
```

`getNameById` is `computed(() => (ident) => …)` — the computed's own body never
reads `items.value`, only the returned closure does — so its identity is stable
for the store's lifetime and this `computed` never re-evaluates after the first
read.

The *behaviour* is nonetheless correct: the closure reads `items.value` when
Vuetify's filter computed invokes it, so a rename is tracked and the search does
follow it. Only the stated reason is wrong, and it is the kind of comment a future
edit would rely on when deciding whether the wrapper is needed.

**FIXED.** The `computed` wrapper is gone — it is a plain const now — and the
comment states the real mechanism (the dependency is registered inside Vuetify's
filter computed, where the closure actually runs). Behaviour is identical.

---

## Info

### I1 — Exports with no `src/` consumer — DOCUMENTED

- `useMenuAction().hasAction` — see L6. Not documented as deliberate.
- `stores/stocks.ts` `active` — **deliberate**, documented in place as the leaf-store
  view versus `portfolio.active`'s enriched one, and covered by a dedicated unit
  test. Recorded so it is not re-derived as dead code.

**RESOLVED by documenting, not deleting.** `hasAction` now carries the same kind
of head note `healthChecker` and `BatchOperationBuilder` do: no production caller
because `DotMenu` dispatches straight through `executeAction`, which has its own
`!handler` branch and reports an unknown id — but it is the honest public form of
the question `executeAction` answers privately, it is correct, and it is covered
by four tests.

Deleting it was the alternative and was rejected on precedent: `stocks.active`
was removed as dead in an earlier round and had to be reinstated as a doc comment
for exactly this reason. Neither is dead; both are unused.

### I2 — Test-only surfaces, re-confirmed

`healthChecker.performHealthCheck`/`repairDatabase`,
`transactionManager.executeMultiple`, and the whole `BatchOperationBuilder`
(`batchService.createBuilder`, `databaseAdapter.batch()`/`batchOperations()`)
have no production callers. All three carry head comments saying so and why, and
`database/README.md` tabulates them. Confirmed still accurate; no action.

**Still no action, and that is the answer rather than a deferral.** Acting on
this means deleting ~400 lines of `src/` plus three test files — capability the
author twice chose to keep and annotated as "not dead code left behind by a
refactor". `batchOperations`' own note invites one question at a cleanup:
whether `atomicImport` wants to be expressed through the builder. It does not —
`import.ts` and the rollback both pass explicit descriptor arrays, and routing
them through a fluent builder would add indirection, not remove it. Left intact.

### I3 — The options page keeps a second copy of settings state — FIXED

`CheckboxGrid` (`checked`) and `DynamicList` (`list`) each read their key
straight from `browser.storage.local` in `onBeforeMount` and write back from that
local copy, rather than reading and writing `settings.indexes` / `materials` /
`markets` / `exchanges`. The settings store's `applyStorageChange` listener
re-syncs afterwards, so the two agree in practice — but there are two sources of
truth for the same four keys, and `DynamicList.addItem` pushes to *both* (`list`
and the store ref) while persisting only `list`.

**FIXED.** The store gained the four missing setters (`setIndexes`,
`setMaterials`, `setMarkets`, `setExchanges`), all going through `updateSetting`,
which already owns the optimistic write, the revert and the failure report. Both
components now seed from the store and persist through it:

- `DynamicList` renders `settings.markets`/`exchanges` directly. Its private
  `list`, its `getStorage` on mount, its `isLoading` state and its hand-rolled
  `removeByValue` rollback are all gone.
- `CheckboxGrid` keeps `checked` as an editing buffer for the checkbox v-model —
  seeded from the store and kept current by a `watch`, which also covers
  `settings.load()` resolving after mount (`options.ts` does not await it). Its
  own `getStorage`, `isLoading` and per-item rollback are gone.

Both pass `{rethrow: true}`, a new `updateSetting` option, so each keeps the
error contract it deliberately had: `CheckboxGrid` its inline `v-alert` beside
the control that failed, `DynamicList` the global alert plus the restore of the
exchange rate it removed alongside the entry. Neither could do that if the store
had already swallowed the error.

The two now-unused `components.*.loading` locale keys were removed from both
locale files (`i18n-lint` reported them).

**This uncovered a real latent defect.** `updateSetting`'s revert is guarded by
`refVar.value === value`, and `ref()` stores an object through `toReactive` — so
`.value` on an array setting returns a reactive **proxy**, never the array that
was assigned. The identity test was always false and the four list settings would
never have rolled back on a failed write. It went unnoticed because every setter
that existed until now held a primitive, where the test is sound. Now compared
through `toRaw`, with a regression test for the revert on each path. The audit
had not spotted this; the new tests did, on their first run.

### I4 — Two idioms for the default alert duration — FIXED

`alertAdapter.ts:189` and `:205` use
`options?.duration !== undefined ? options.duration : DEFAULT`, while `:266` uses
`options?.duration ?? DEFAULT`. Equivalent today only because
`ALERT_INFO.DURATIONS.ERROR` is `null`; they diverge for any caller passing
`duration: null` if that default ever becomes a number.

**FIXED.** One shared `resolveDuration(options, fallback)` on the `!== undefined`
form, which is the correct one: an explicit `duration: null` means "do not
auto-dismiss" and must survive, and `app.ts`'s database-versionchange notice
passes exactly that because the app is read-only from that point. Three
parameterised tests assert all three helpers preserve it.

---

## Checked and found correct

Recorded so the same ground is not re-walked next pass.

- **`CreditDebitFieldset`'s apparent rule swap** (`cRules` from `modelValue.debit`,
  `dRules` from `modelValue.credit`) is correct. `amountRules` closes over the
  *other* side's value and the rule receives its own field's value, which is what
  makes `oneOfTwo`'s cross-field "only one positive" check work.
- **`useOnlineStockData`'s FX divisor chain.** `appAdapter` fetches
  `${displayCurrency}USD` / `${displayCurrency}EUR` and `processExchangeBase`
  keys on the suffix; dividing a USD quote by `curUsd` (= EUR→USD) yields EUR,
  and the reverse case (USD account, EUR quote, `curEur` = USD→EUR) is likewise
  correct.
- **`calculateInvestByStockId`'s FIFO direction.** Sorting BUY lots newest-first
  and walking until `totalPortfolio` is right: under FIFO the *oldest* lots are
  sold, so the remaining holding is the newest lots, which is what the cost basis
  must be drawn from.
- **`baseRepository`'s insert/update split** under `validateAccount`/`validateStock`/
  `validateBooking`/`validateBookingType`, all of which default an absent `cID` to
  `0`; `save()` treats `0` as an insert and `stripId` removes it.
- **`getAccountRecords`/`getAllRecords` sharing one `tx` across a `Promise.all`.**
  Each repository read issues its `IDBRequest` synchronously before its first
  `await`, so all four are in flight in the same tick and the transaction cannot
  auto-commit between them. (This is what M1 is missing.)
- **The blank-identifier guards are complete.** `migrator.ts` defines exactly two
  unique-index surfaces (`accounts_uk1`, `stocks_uk3`/`uk4`); both the repository
  write path and the import path strip blanks for both.
- **`portAdapters.toRecordsPort`** validates every store `add`/`update` through the
  same domain validator the repository uses, which is what keeps a Vuetify
  `type="number"` string from reaching the store as a string.
- **`DialogPort`'s `@click="dialogRef?.onClickOk"`** is a valid handler reference
  (member-expression path, so Vue binds rather than invokes) and is a no-op while
  the ref is unset.
- **`AlertOverlay`'s cached `renderedAlert`/`renderedConfirmation`** and
  `alerts.confirm`'s reject-when-busy contract, together with
  `isConfirmDialogBusyError`, are consistently applied at all four confirmation
  call sites (`useMenu`, `useImportDialog`, `useExportDialog`, `HomeContent`).

---

## Coverage gaps

Things this audit could not settle by reading:

- **Runtime behaviour of the six scrapers.** Every provider is read for structure
  and guarded against the known phantom-value/wrong-currency classes, but the
  selectors themselves can only be validated against live markup. `finanzen.net`
  is known to hard-403 the extension (Akamai), so `fnet`, the InfoBar indexes and
  materials, and the meeting/quarter date lookups are presumed non-functional in
  production regardless of this code.
- **Vuetify's disabled-input validation** was confirmed against the installed
  3.11.8 source rather than a running app; H1's user-visible symptom has not been
  reproduced in the browser.
- **`test:e2e` was not run** (standing preference: not on the auditor's own
  initiative), before or after the fixes. H1 in particular would be worth an e2e
  case, since it involves a dialog that renders fine and simply refuses to save,
  and since it is the one fix here with no unit coverage.
- **H1's fix is not unit-tested** — no component-mounting harness exists in this
  repo. See the note under H1. The same applies to L5, L7, L8 and L13, which are
  all SFC-level changes; L5 and L7 in particular are behavioural and would be
  worth e2e coverage.
- **L3's matching change is pinned only by fixtures.** finanzen.net 403s the
  extension, so the real `title` attributes cannot be checked. The new rules are
  strictly more conservative than the old ones (exact preferred, one link per
  index) and the existing DAX fixture still matches, but "does this match what
  the live page emits" remains unanswerable from here.
