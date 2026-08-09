# `src/` issue register

Full analysis of `src/`, 2026-08-09, branch `dev602` (HEAD `a40d045`). Every
`.ts` / `.vue` file under `src/` was read; the coverage log at the bottom lists
them.

Severity: **High** = wrong figures shown to the user, or a feature that cannot
be used; **Medium** = a real defect with a narrower trigger; **Low** = a latent
defect, a stated contract the code does not keep, or dead surface area;
**Info** = observation, no change proposed.

Each finding is tagged **Verified** (traced end-to-end through the code that
would hit it) or **Reasoned** (deduced from the code read, not executed).
Nothing here has been executed against a running browser.

> **Status: all 12 findings fixed** (same session, 2026-08-09, uncommitted).
> Baseline before the changes was green — 867/867 unit tests, `vue-tsc` clean,
> eslint clean, i18n-lint clean — and is green after: **881/881** unit tests
> (14 net new), types, lint and i18n all clean. `test:e2e` was **not** run.
> Per-finding notes are in the [Resolution](#resolution) section at the end.

---

## 1 — FX rates are fetched only at app boot, so switching accounts (or editing an account's currency) converts quotes with the wrong divisor

**High · Verified**

`src/adapters/driven/appAdapter.ts:392-540` (`fetchExternalData`), `:553-631`
(`initializeApp`); `src/adapters/ui/composables/useOnlineStockData.ts:231-252`;
`src/adapters/ui/views/AppIndex.vue:34-39`;
`src/app/usecases/accounts.ts:304-312`

`runtime.curUsd` / `runtime.curEur` are the divisors every quote is converted
by. Grepped across `src/` and `tests/`, they have exactly **three** writers, all
inside `appAdapter.fetchExternalData`:

```
appAdapter.ts:204   runtime.curUsd = data.value;      // from the fetched base pair
appAdapter.ts:211   runtime.curEur = data.value;
appAdapter.ts:443   if (currency === USD) runtime.curUsd = 1;   // self-pair seed
appAdapter.ts:444   if (currency === EUR) runtime.curEur = 1;
```

`fetchExternalData` is Phase 3 of `initializeApp`, and `initializeApp` is called
only from `AppIndex.runInitialization` — on mount, and from the error-retry
button. **Nothing re-runs it when the display currency changes**, and the
display currency is `resolveDisplayCurrency(accounts, activeAccountId,
settings.currency)`, i.e. the *active account's* `cCurrency`.

The pairs fetched are chosen from the currency that was active **at boot**
(`appAdapter.ts:416-444`), and the self-pair is seeded to `1` rather than
fetched. So after a switch, one of the two divisors is a stale rate and the
other is a `1` that is no longer correct:

| At boot | After switching to | `curUsd` | `curEur` | Effect |
| --- | --- | --- | --- | --- |
| EUR account | a USD account | `EURUSD` (≈1.08) | **`1`** (seeded for EUR) | a EUR-quoted stock takes `divisor = curEur = 1` → its EUR price is displayed verbatim as USD |
| USD account | an EUR account | **`1`** (seeded for USD) | `USDEUR` (≈0.92) | a USD-quoted stock takes `divisor = curUsd = 1` → its USD price is displayed verbatim as EUR |

The error is the full FX rate — roughly 8 % at today's EUR/USD, unbounded in
principle — and it is silent: `useOnlineStockData`'s only guard is
`rawDivisor > 0 ? rawDivisor : 1`, which a stale-but-positive rate passes. It
propagates from `mValue` into `mMin`/`mMax`, then into `portfolio.active`'s
derived `mChange`, then into `calculateTotalDepotValue` and the depot chip in
`TitleBar`. Meanwhile `currencySync` *has* already relabelled every figure with
the new account's currency symbol, so the label is right and the number is
wrong — the exact pairing `resolveDisplayCurrency`'s doc comment says the
one-definition rule exists to prevent ("the quote was converted to one currency
and the label printed another").

`InfoBar`'s commodity row is hit by the same stale `curUsd`
(`InfoBar.vue:40-53`).

Two things make this more than an edge case:

- **`AppIndex` already watches the trigger.** `watch(() => settings.activeAccountId, () => runtime.clearStocksPages())` fires on every switch. It invalidates the *quote* cache and nothing else, so the app dutifully re-fetches every quote and re-converts each one with the wrong divisor.
- **`updateAccountUsecase` asserts the opposite in a comment.** `accounts.ts:304-312` reads: *"Editing an account can change `cCurrency`, which is the currency quotes are converted INTO (`useOnlineStockData`'s divisor) — so every already-fetched mValue/mMin/mMax on screen is now scaled to the wrong currency. Invalidate the freshness markers so the next render re-fetches and re-converts."* The re-fetch happens; the *re-convert* uses divisors that were never updated. The recorded fix does not close the case it names.

Suggested fix: extract the FX half of `fetchExternalData` (the `basePairs`
derivation, the self-pair seed, and `processExchangeBase`) into something
callable on its own, and invoke it from the same places that already call
`clearStocksPages()` for a currency-affecting change — `AppIndex`'s
`activeAccountId` watcher and `updateAccountUsecase`. Until then the divisors
should arguably fail closed (leave the quote unconverted *and* say so) rather
than silently applying the previous account's rate.

## 2 — `validationAdapter.nameRules` rejects every one-character trading symbol

**Medium · Verified**
`src/adapters/ui/validationAdapter.ts:136-142`, `:160-174`;
`src/adapters/ui/components/dialogs/forms/StockForm.vue:118-124`

`symbolRules` is `nameRules` plus a duplicate check, and `nameRules` includes
`stringLength(2, 32)`. `StockForm` binds it to the stock's trading symbol, so a
one-character symbol fails validation, `submitGuard` returns early, and the
stock cannot be saved at all.

One-character tickers are ordinary, not exotic: **F** (Ford), **T** (AT&T),
**V** (Visa), **C** (Citigroup), **K** (Kellanova), **X** (US Steel). The field
is also auto-filled — `StockForm.onUpdateIsin` writes `companyData.symbol`
straight from the fetch provider — so for these stocks the app fills in a value
it then refuses to accept. As `submitGuard`'s own comment about the count field
records, the symptom is a dead-looking OK button plus an inline message on a
field the user never typed into.

The 2-character floor is defensible for the *other* `nameRules` consumer, a
free-form booking-type name. It was never argued for the symbol: `nameRules`'
doc comment reasons at length about the *first-character* rule for symbols
(citing digit-leading Xetra symbols `1COV`, `2GB`, `3W9`) and does not mention
the length rule. No test pins a minimum of 2 for symbols specifically —
`validationAdapter.test.ts:50` exercises `stringLength(2, 4, …)` generically.

Suggested fix: give `symbolRules` its own `stringLength(1, 32)` instead of
inheriting `nameRules`' `(2, 32)`.

## 3 — `required()` accepts a whitespace-only value, so a stock can be saved with a blank company name

**Medium · Verified**
`src/adapters/ui/validationAdapter.ts:71-76`;
`src/adapters/ui/components/dialogs/forms/StockForm.vue:109-113`;
`src/domain/mapping/formMapper.ts:47`

`required()` tests `v !== null && v !== "" && v !== undefined` — it does not
trim, so `"   "` passes. The stock form's **company** field is the only place
bound to a bare `required()`; every other text field goes through `nameRules`,
`stringLength`, `regex` or `fromDomain`, all of which run `cleanString` first.

`mapStockFormToDb` then does `cCompany: data.company.trim()`, so the record is
persisted with `cCompany: ""`. Consequences, all silent:

- `CompanyContent`'s company column renders an empty cell.
- `BookingForm`'s stock picker uses `item-title="cCompany"`, so the stock is offered as a blank row — indistinguishable from the sentinel "no stock" placeholder (`createPlaceholderStock`, also `cCompany: ""`).
- `BookingForm.sortedStocks` sorts on `cCompany`, so it sorts to the top next to that sentinel.

`domain/validation/rules.ts`'s own `required()` has the same gap but no `src/`
consumer (finding 10).

Suggested fix: trim before the emptiness test in `validationAdapter.required`,
matching every neighbouring rule in the same file.

## 4 — `AddStock` reports a post-save quote-refresh failure as an add-stock failure

**Medium · Verified** — `src/adapters/ui/components/dialogs/AddStock.vue:336-358`

`operation` ends with `await refreshOnlineData(res.page)` — a network call —
*after* the stock has been written and the success alert shown. `submitGuard`
wraps `operation` in a try/catch that reports any throw via
`alertAdapter.feedbackError` with `errorContext: "ADD_STOCK"`. A provider
timeout or parse failure therefore produces "stock added successfully"
immediately followed by an add-stock error, for a stock that *was* added.

The codebase already draws this distinction one layer up:
`importDatabaseUsecase` wraps its post-commit steps in their own try/catch
because "a failure in these purely cosmetic follow-up steps must not fall
through to the catch below" (`src/app/usecases/backup/import.ts:183-188`).

Two smaller problems in the same three lines:

- The refresh runs outside `runtime.beginStockLoading()` / `beginDownload()`, unlike every other caller of `refreshOnlineData` / `loadOnlineData` (`CompanyContent.onCurrentItems`, `useHeaderBarActions.updateQuote`). So the table shows no loading state and `TitleBar`'s depot chip is not suppressed while the figures behind it are being recomputed.
- It passes no `stockIds`, so `loadOnlineData` falls back to the positional slice of `portfolio.active` — the shape `resolvePageStocks`' own doc comment (`useOnlineStockData.ts:74-86`) identifies as fetching "quotes for rows nobody was looking at" once the user has sorted the Company table. `useMenu.ts:280-286` calls out this exact call shape as the reason its dead `updateQuote` handler was worth deleting.

Suggested fix: move the refresh out of `operation` (or wrap it in its own
try/catch that logs rather than alerts), and bracket it with the ref-counted
loading flags.

## 5 — `useHeaderBarActions.updateStock` opens the update-stock dialog on a stale `runtime.activeId`

**Low (latent) · Verified**
`src/adapters/ui/composables/useHeaderBarActions.ts:76-78`, `:189-208`

The header-bar action table is an exhaustive `Record<MenuActionType, …>`. Its
own comment declares which entries are row-level actions with no header-bar
affordance and implements those as no-ops — listing `updateBooking`,
`deleteBooking`, `showDividend`, `openLink`, `deleteStock`. **`updateStock` is
the same kind of action and is not in that list**: it calls
`openDialog("updateStock")`.

`UpdateStock.vue` reads `runtime.activeId`, a generic "last row acted on" id
written by `useMenu.executeAction` for *any* DotMenu action, including booking
rows. Opening the dialog from a header icon would load whatever record id
happens to be there — the cross-store id-collision hazard
`UpdateBookingType.vue:697-710` documents at length and deliberately guards
against.

Not reachable today: `HeaderBar.vue` emits 16 ids and `updateStock` is not among
them. Recorded because it is the identical latent shape the sibling
`deleteAccount` entry was fixed for a few lines below ("adding a `deleteAccount`
control to the header bar later would have silently done nothing, and the
exhaustive `Record` type would not have objected") — except this one would do
something *wrong* rather than nothing.

Suggested fix: make `updateStock` a no-op alongside its five row-level siblings.

## 6 — Booking-type header actions use a population count where their siblings use `hasActiveAccount`

**Low · Verified** — `src/adapters/ui/composables/useHeaderBarActions.ts:117-131`

`addBookingType` gates on `records.hasActiveAccount`, with a comment explaining
that "accounts exist but none is active" is a real state the old length test
waved through. `updateBookingType` and `deleteBookingType` — account-scoped in
exactly the same way — still gate on
`records.bookingTypes.items.length === 0`.

The record stores are not cleared when `activeAccountId` falls back to the
"no account" sentinel (`HomeContent.onResetStorage` exists precisely because
that leaves the stores holding the previous account's rows), so both dialogs can
be opened with no active account, listing a stale account's booking types.

Impact is bounded — both dialogs act on the selected type's own `cID` and
`cAccountNumberID`, so nothing is stamped with the `-1` sentinel — which is why
this is Low rather than a repeat of the bug the comment describes.

## 7 — `AppIndex`'s unload handler documents `pagehide` but registers `beforeunload`

**Low · Verified** — `src/adapters/ui/views/AppIndex.vue:147-171`

The doc comment closes with: *"Not `{once: true}`: `pagehide` can fire for a
page entering the back/forward cache and then be revisited, and a one-shot
listener would silently not be there the second time."* The listener below it is
registered on `beforeunload`, and `onUnmounted` removes `beforeunload`.

The registration is self-consistent, so nothing misbehaves — but the stated
justification is about a different event, and this comment is explicitly
load-bearing (it records why the handler was moved off `HomeContent`). Either
name `beforeunload` in the comment, or move the listener to `pagehide`, which is
the more reliable choice for an extension page and is what the comment argues
for.

## 8 — `TitleBar` still hand-rolls the account switch that `settings.setActiveAccountId` was written to replace

**Low · Verified**
`src/adapters/ui/stores/settings.ts:425-445`;
`src/adapters/ui/views/TitleBar.vue:196-244`, `:380-392`

`setActiveAccountId`'s doc comment states that `activeAccountId` "was the one
persisted setting with no paired setter, so callers assigned the ref and called
`setStorage` separately — and lost everything `updateSetting` provides".

`TitleBar` is that caller and still does it by hand: the `v-select` is
`v-model`-bound straight to `settings.activeAccountId`, and `onUpdateTitleBar`
calls `setStorage(...)` itself. The setter therefore has no caller for the one
setting it names.

There is a real reason it cannot simply adopt the setter — it must also
re-hydrate the record stores and revert *those* on failure, which
`updateSetting` knows nothing about, and its hand-written revert is the more
thorough of the two. Worth either wiring the setter in beneath the record-store
handling, or amending the comment to record `TitleBar` as a deliberate exception
and why.

## 9 — Six store getters are exported with no consumer anywhere in `src/` or `tests/`

**Low · Verified**
`src/adapters/ui/stores/bookings.ts:69-84`, `:93-104`;
`src/adapters/ui/stores/bookingTypes.ts:62-71`, `:95`, `:113-118`;
`src/adapters/ui/stores/stocks.ts:69-78`

Grepped by name across `src/` and `tests/` with no head limit; each is matched
only by its own definition and its entry in the store's return object:

| Getter | Store |
| --- | --- |
| `getItemById` | `bookings`, `bookingTypes`, `stocks` (all three) |
| `getTextById` | `bookings` |
| `getNames` | `bookingTypes` |
| `getNamesWithId` | `bookingTypes` |

Worth separating from ordinary dead code for two reasons. First, the three
`getItemById` variants are the *throwing* counterparts to `getById` — the
codebase's fail-closed lookup — and every real call site uses the nullable
`getById` with a hand-written guard instead (`UpdateStock`, `UpdateBooking`,
`UpdateAccount`, `BookingTypeForm`, `useMenu.openLink`). That is the reverse of
what the pair was presumably built for.

Second, `getNamesWithId` carries a six-line doc comment describing a
positional-versus-identity bug that was found and fixed *in a getter nothing
calls*. That analysis protected nobody.

Note this is **not** the same as `stocks.active` or `portfolio.passive`, which
have no `src/` consumer but do have dedicated unit tests pinning them as
deliberate API. These six have neither.

Suggested action: delete, or — following the precedent set by
`useMenu.hasAction`, `healthChecker` and `BatchOperationBuilder` — add a note
saying they are a deliberate surface, so they stop being re-derived as dead on
every audit pass.

## 10 — `domain/validation/rules.ts`'s `required()` has no consumer

**Low · Verified** — `src/domain/validation/rules.ts:98-103`

Only two modules import from `rules.ts`: `validators.ts` (which takes
`validateIBAN`, `validateISIN`) and `validationAdapter.ts` (which uses
`ValidationRules.validateIBAN` / `validateISIN` / `validateSWIFT` only).
`validationAdapter` has its own unrelated `required()`. The domain one is
reached solely by `tests/unit/domain/validation/rules.test.ts`.

Same disposition as finding 9. Note its test pins the same untrimmed-string
behaviour flagged in finding 3, so if it is kept *and* fixed, that test needs
updating too.

## 11 — `mapBookingTypeFormToDb` has a branch that cannot be reached

**Info · Verified** — `src/domain/mapping/formMapper.ts:194-196`

```ts
if (!data.id) return bookingType;
if (data.id > 0) return {cID: data.id, ...bookingType};
return bookingType;
```

`BookingTypeFormData.id` is `number | null`. `null` and `0` take the first
branch; a positive id the second; the third is reachable only for a negative id,
which nothing produces (`createBookingTypeFormManager` seeds `id: null`, and the
only writer is `BookingTypeForm.onSelect` from a real `cID`). It returns the
same value as the first branch anyway.

Harmless, but the three-branch shape reads as though the negative case is
meaningful — the sibling mappers all use a single `if (data.id > 0)`.

## 12 — `stocksPerPage` is watched in two places, both calling `clearStocksPages()`

**Info · Verified**
`src/adapters/ui/views/AppIndex.vue:39`;
`src/adapters/ui/views/CompanyContent.vue:362-364`

`AppIndex` (app shell, mounted for the session) and `CompanyContent` (route
component) both watch `settings.stocksPerPage` and both call
`runtime.clearStocksPages()`. The operation is idempotent so nothing
misbehaves, but `CompanyContent`'s watcher carries a careful comment about *not*
also refetching, which reads as though it is the sole owner of this concern.

---

## Checked and found correct

Recorded so these are not re-derived next pass. Each was examined specifically
because it looked like a defect, and is not one.

- **Amount fields are not affected by the Vuetify string-model problem.** Every credit/debit pair routes through `CreditDebitFieldset` → `CurrencyInput`, which parses in `onBlur` and emits a real `number`. Only `BookingForm`'s `count` binds a raw `v-text-field type="number"`, and both its rule (`countRules`) and its mapper (`toNumber`) already handle the string.
- **`calculateInvestByStockId`'s descending FIFO sort.** Sorting BUY lots newest-first and consuming until `totalPortfolio` is correct: under FIFO the oldest lots are sold first, so the shares still held come from the newest ones.
- **`useOnlineStockData`'s divisor direction.** `curUsd` is `${local}USD` and `curEur` is `${local}EUR`, so dividing a foreign-quoted price by the corresponding rate converts *into* the display currency correctly — when the rates are current (see finding 1).
- **`runtime.clearStocksPages()` mutating a Map while iterating its own keys.** `bumpStocksPageGeneration` only `set`s keys that already exist, which is safe during `Map` iteration.
- **`baseRepository.deleteBy` running three cursor walks concurrently on one `tx`** (`databaseAdapter.deleteAccountRecords`). Each `openCursor` is issued synchronously before the first `await`, so all three requests are registered while the transaction is still active.
- **`migrator`'s backfills using async cursor callbacks inside `onupgradeneeded`.** The version-change transaction stays alive while requests are pending, so the cursors complete before it commits.
- **`ShowAccounting.summaryEntries` id collisions.** `accountEntries` uses `0…sums.length-1`; the summary rows use `sums.length`, `+1`, `+2`.
- **`ThemeSelector` / `OptionsIndex` reading a `computed` without `.value` in the template.** `<script setup>` bindings are ref-unwrapped by the template compiler.
- **`fetchIndexData`'s `claimed` set.** A link that matched an index but yielded no parseable number stays unclaimed, but it cannot then give a *wrong* value to a later index — the same `continue` fires again.
- **`connectionManager`'s `onblocked` / `abandoned` guard, `transactionManager`'s handler-before-operation ordering, `httpCache`'s stricter-of-two-TTLs rule, `alertAdapter`'s log-before-rate-limit ordering, `batchOperations`' queue-identity check.** All read as deliberate and correct.

---

## Resolution

All 12 fixed on 2026-08-09. 881/881 unit tests, `vue-tsc`, eslint and i18n-lint
clean. `test:e2e` not run.

**1 — FX divisors were boot-only.** `appAdapter` gained two extracted helpers,
`resolveBaseExchangePairs` (the pair derivation plus the self-pair seed) and
`applyBaseExchangeResult` (the write-back), so the divisor rule has one
definition; `fetchExternalData` now calls both instead of inlining them. A new
public `refreshExchangeRates(stores, signal?)` reuses them to re-fetch the FX
pairs alone — deliberately *not* indexes or materials, which are
currency-independent. `AppIndex` drives it from a watcher on
`resolveDisplayCurrency(...)`, the same expression `currencySync` watches, so
the converted number and the printed symbol cannot drift apart; it covers all
three ways the currency can change (account switch, `cCurrency` edit,
`settings.currency` with no account active).

Three details worth stating because they are behaviour, not refactoring:

- `resolveBaseExchangePairs` now resets **both** divisors to `1`, where it used to seed only the self-pair. If the new fetch fails, the previous currency's rate would otherwise stay in place and convert with a divisor belonging to a currency no longer on screen; `1` shows the quote unconverted, which is the fallback `useOnlineStockData` and `InfoBar` already use for a missing rate. At boot this is a no-op — the store defaults are already `1`.
- `clearStocksPages()` runs **after** the await, not before. Before it, a re-fetch would start against the divisors being replaced; after it, the generation bump also discards any write-back already in flight.
- The watcher is gated on `isInitialized`, because Phase 2 loading the accounts is itself a change to the resolved currency and Phase 3 already reads the post-Phase-2 value — without the gate a USD-account user got a redundant second fetch racing boot.

`updateAccountUsecase`'s comment, which asserted that invalidation alone made
the next render "re-fetch and re-convert", now says plainly that it does not and
points at the watcher. 6 new tests.

**2 — one-character tickers.** `symbolRules` no longer delegates to `nameRules`;
it spells out `required` + `stringLength(1, 32)` + the first-character rule. The
existing test `"keeps the three nameRules checks"` **asserted the bug**
(`rules[1]("A")` was expected to be `"length"`) — it now checks the upper bound
instead, and a new parameterised test covers F/T/V/C/K/X.

**3 — `required()` accepted whitespace.** Now trims strings before the emptiness
test; non-strings are unchanged, since presence of a non-string is not a
whitespace question. 2 new tests.

**4 — `AddStock`'s post-save refresh.** Moved into its own try/catch inside
`operation` so a provider failure logs instead of raising an add-stock error
after the success alert, bracketed with `beginDownload`/`beginStockLoading`, and
given `stockIds: [res.id]` so it no longer falls back to the positional slice.

**5 — `updateStock` from the header bar.** Now a no-op alongside its five
row-level siblings, with a test asserting it cannot act on a stale
`runtime.activeId`.

**6 — booking-type guards.** `updateBookingType`/`deleteBookingType` check
`hasActiveAccount` first, then keep the "no booking types" message for the case
where an account *is* active — that is the more specific answer and the only one
the user can act on. Two existing tests needed an active account added; one new
parameterised test covers the no-active-account path.

**7 — `AppIndex`'s unload comment.** Rewritten to justify `beforeunload`. The
listener was **not** switched to `pagehide`: that also fires on bfcache entry,
and a restored page would be left with a closed IndexedDB connection and no path
back to one (`connect()` runs only in `appAdapter`'s boot phase, and every
dialog is gated on `isConnected()`).

**8 — `setActiveAccountId`'s claim.** Comment corrected on both sides.
`TitleBar` is recorded as a deliberate exception with the two structural
reasons it cannot use the setter: its `v-select` is `v-model`-bound, so the ref
already holds the new id and the setter's rollback would "revert" to it; and a
failed switch must also revert the record stores, which the setter knows nothing
about.

**9 / 10 — seven unused exports removed.** `getItemById` ×3, `getTextById`,
`getNames`, `getNamesWithId`, and `domain/validation/rules.ts`'s `required` (plus
its test, this module's only caller). Each store keeps a short note on what went
and why, and `getNamesWithId`'s positional-versus-identity lesson is preserved in
prose rather than lost with the code.

**11 — unreachable branch.** `mapBookingTypeFormToDb` now uses a single
`data.id && data.id > 0` gate, matching its three sibling mappers.

**12 — duplicate watcher.** `CompanyContent`'s `stocksPerPage` watcher removed;
`AppIndex` is the single owner and is always mounted, where the route component's
was not. The reasoning moved with it, and the half specific to `CompanyContent`
(why it does *not* refetch here) stayed behind as a comment.

### Not done

Nothing in this register is outstanding. Two things deliberately left alone:

- **No e2e run.** Finding 1 is the one worth an e2e case — a two-account, two-currency switch — but `test:e2e` needs a build and was not run.
- **The `basePairs.length === 0` branch in `refreshExchangeRates` has no test.** With `CURRENCIES.SUPPORTED = ["EUR", "USD"]` one derived code is always a real pair, so it is unreachable; it is a guard for a future single-currency configuration.

---

## Coverage log

Every `.ts` and `.vue` file under `src/` was read in full for this pass, plus
`style.css` and the `_locales` structure. By area:

- **`domain/`** — `constants.ts`, `constants/core.ts`, `constants/cachePolicy.ts`, `constants/ui.ts`, `constants/ui/{headers,materials,menus,options,pagination,translationKeys}.ts`, `errors.ts`, `logic.ts`, `mapping/formMapper.ts`, `importExport/validator.ts`, `types.d.ts`, `types/*.ts`, `types/uiLayer/*.ts`, `utils/utils.ts`, `utils/url.ts`, `validation/{rules,validators,duplicates,referentialIntegrity,messages}.ts`
- **`app/usecases/`** — `accounts.ts`, `bookings.ts`, `bookingTypes.ts`, `stocks.ts`, `ports.ts`, `portAdapters.ts`, `records/init.ts`, `backup.ts`, `backup/{import,importHelpers,export,exportHelpers}.ts`
- **`adapters/`** — `container.ts`, `containerBackground.ts`, `context.ts`, `driven/types.ts`
- **`adapters/driven/`** — `appAdapter.ts`, `alertAdapter.ts`, `browserAdapter.ts`, `faviconAdapter.ts`, `fetchAdapter.ts`, `importExportAdapter.ts`, `storageAdapter.ts`, `taskAdapter.ts`
- **`adapters/driven/database/`** — `baseRepository.ts`, `batchOperations.ts`, `connectionManager.ts`, `databaseAdapter.ts`, `healthChecker.ts`, `migrator.ts`, `transactionManager.ts`, `repositories/{account,booking,bookingType,stock}Repository.ts`, `repositories/repositoryFactory.ts`
- **`adapters/driven/fetch/`** — `httpCache.ts`, `httpClient.ts`, `providerUtils.ts`, `providers/{acheck,ard,fnet,goyax,tgate,wstreet}.ts`
- **`adapters/ui/`** — `validationAdapter.ts`, `style.css`
- **`adapters/ui/entrypoints/`** — `app.ts`, `background.ts`, `options.ts`, `errorHandling.ts`, `singleTabGuard.ts`
- **`adapters/ui/plugins/`** — `components.ts`, `currencySync.ts`, `i18n.ts`, `pinia.ts`, `router.ts`, `themeSync.ts`, `vuetify.ts`
- **`adapters/ui/stores/`** — `accounting.ts`, `accounts.ts`, `alerts.ts`, `bookings.ts`, `bookingTypes.ts`, `deps.ts`, `portfolio.ts`, `recordsHub.ts`, `runtime.ts`, `settings.ts`, `stocks.ts`
- **`adapters/ui/composables/`** — `bookingSearch.ts`, `useDialogGuards.ts`, `useExportDialog.ts`, `useFavicon.ts`, `useForms.ts`, `useHeaderBarActions.ts`, `useImportDialog.ts`, `useKeyboardShortcuts.ts`, `useMenu.ts`, `useOnlineStockData.ts`, `useUrl.ts`
- **`adapters/ui/views/`** — `AppIndex.vue`, `CompanyContent.vue`, `FooterBar.vue`, `HeaderBar.vue`, `HelpContent.vue`, `HomeContent.vue`, `InfoBar.vue`, `OptionsIndex.vue`, `PrivacyContent.vue`, `TitleBar.vue`
- **`adapters/ui/components/`** — `AlertOverlay.vue`, `CheckboxGrid.vue`, `ContentCard.vue`, `CreditDebitFieldset.vue`, `CurrencyInput.vue`, `CurrencySelector.vue`, `DialogPort.vue`, `DotMenu.vue`, `DynamicList.vue`, `MenuItem.vue`, `ServiceSelector.vue`, `ThemeSelector.vue`
- **`adapters/ui/components/dialogs/`** — all 15 dialogs, plus `forms/{AccountForm,BaseDialogForm,BookingForm,BookingTypeForm,StockForm}.vue`

Not code, read only for structure: the `README.md` / `ARCHITECTURE.md` /
`WORKFLOWS.md` files, `_locales/*/gui.json` and `messages.json`, `assets/*.png`,
`entrypoints/*.html`.
