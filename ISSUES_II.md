# ISSUES_II — full `src/` analysis

Systematic file-by-file analysis of every file under `src/` (156 code files, ~25.8k lines),
run in rounds by architectural layer. Started 2026-08-08.

**Baseline tooling at start of analysis:** `npm run test:typescript` (vue-tsc) — clean.
`npx eslint src/` — clean. No changes were made to any file except this register.

**Severity key**

| Level | Meaning |
|-------|---------|
| **Critical** | Data loss / corruption, or a core flow that cannot work at all |
| **High** | Wrong financial figures, or a user-facing flow that fails silently |
| **Medium** | Real defect with a narrower trigger, or a wrong/misleading message |
| **Low** | Dead code, unreachable branch, cosmetic or maintainability issue |
| **Info** | Not a defect; documented for awareness |

**Evidence key** — *Verified* = confirmed by reading every relevant call site (and, where
noted, by running the code). *Reasoned* = derived from the code but not executed.

---

## Round coverage

| Round | Scope | Files | Status |
|-------|-------|-------|--------|
| 1 | `domain/` (+ `ui/validationAdapter.ts`, the two form components it drives) | 30 | done |
| 2 | `app/usecases/` | 12 | done |
| 3 | `adapters/driven/database/` | 12 | done |
| 4 | `adapters/driven/` (fetch, providers, other adapters) + `container`/`context` | 20 | done |
| 5 | `adapters/ui/stores/` + `plugins/` | 17 | done |
| 6 | `adapters/ui/composables/` + `entrypoints/` | 15 | done |
| 7 | `adapters/ui/components/` (incl. `dialogs/`, `forms/`) | 29 | done |
| 8 | `adapters/ui/views/` | 11 | done |
| 9 | `_locales/`, `*.html`, `style.css`, `*.d.ts`, cross-cutting sweep | 11 | done |

**All 156 code files under `src/` were read.** Analysis complete.

---

## Summary — all findings

| # | Severity | Location | Finding |
|---|----------|----------|---------|
| 9.2 | ~~**High**~~ **FIXED** | cross-cutting (`browserAdapter` / `appAdapter` / `useOnlineStockData` / `i18n`) | Display currency is derived from the browser's UI language with no user override; only fetched quotes are converted, so `mEuroChange` and the two TitleBar chips mix currencies for any non-German-browser user |
| 2.1 | ~~**Medium**~~ **FIXED** | `usecases/bookingTypes.ts:60` | A Buy/Sell/Dividend booking type can be deleted while it has no bookings, silently disabling all stock bookings for that account |
| 2.2 | ~~**Medium**~~ **FIXED** | `usecases/backup/import.ts:148` | The error handler awaits `setStorage` unguarded; a failure there discards the real error and skips `onError` |
| 4.1 | ~~**Medium**~~ **FIXED** | `adapters/container.ts:66` | The documented `storageAdapter` override is accepted and silently ignored |
| 5.1 | ~~**Medium**~~ **FIXED** | `plugins/i18n.ts:126` | The app runs vue-i18n in removed-in-v12 Legacy mode, and the locale assignment works *only* because of that — the obvious fix silently reverts every euro amount to USD formatting |
| 8.1 | ~~**Medium**~~ **FIXED** | `driven/browserAdapter.ts:264` | The system-notification `iconUrl` resolves to a path that does not exist in the build |
| 2.3 | Low | `usecases/backup/exportHelpers.ts:69` | An empty database reports "Export validation failed" |
| 3.1 | Low | `connectionManager.ts:41` | `onVersionChange` has no caller, so an extension update hard-reloads the tab and discards unsaved dialog input |
| 3.2 | Low | `driven/database/` | ~8 API surfaces (builder, `executeMultiple`, `countByAccount`, …) reachable only from tests |
| 3.3 | Info | `migrator.ts:143` | The `oldVersion < 27` migration can permanently break a legacy database with blank identifiers |
| 4.2 | Low | `driven/appAdapter.ts:675` | `getStatus` reports `storage: "error"` for a legitimately empty install |
| 4.3 | Info | `driven/fetchAdapter.ts:573` | Quote fetches are unbounded-parallel per page (up to 26 requests in one tick) |
| 4.4 | Info | — | Round 1.5 re-examined against the provider and cleared as a non-issue |
| 5.2 | Low | `stores/settings.ts:247` | Every local settings write echoes back through the cross-context storage listener |
| 5.3 | Low | `stores/deps.ts:130` | `attachStoreTranslate` has only a plausible-looking English fallback, no wiring guarantee |
| 5.4 | Low | `plugins/vuetify.ts:101` | `info: "yellow"` on near-white surfaces in all six themes (~1.1:1 contrast) |
| 6.1 | Low | `useMenu.ts:258` / `useHeaderBarActions.ts:38` | Two action tables over one union, each ~⅔ dead, diverging on `updateQuote` |
| 6.2 | Low | `useOnlineStockData.ts:136` | A blank-ISIN stock still issues a quote request and raises a non-dismissing alert every refresh |
| 6.3 | Info | `entrypoints/app.ts:44` | `i18n.global.t` passed unbound — safe today for the same reason as 5.1 |
| 7.1 | Low | 5 call sites | `item-key` is a Vuetify 2 prop; Vuetify 3 ignores it and `item-value` is never set |
| 7.2 | Low | `dialogs/ShowAccounting.vue:172` | The totals row is paginated with the data rows |
| 7.3 | Low | `components/DialogPort.vue:47` | The OK button's `type="submit"` is inert (it sits outside the form) |
| 8.2 | Low | `views/HomeContent.vue:191` | The bookings search matches hidden numeric fields and cannot search the booking-type column it displays |
| 8.3 | Low | `adapters/ui/style.css:24-32` | Unscoped `tbody tr` rules keep every table light-themed at ~2.4:1 text contrast |
| 9.1 | Low | `constants/core.ts:328` | The title-bar logo path is hand-rolled and unmanaged by Vite |

**Totals:** 0 Critical · 1 High · 5 Medium · 15 Low · 4 Info.
**Status:** the High (9.2) and **all five Mediums** are fixed — 9.2 on 2026-08-08, then 2.1,
2.2, 4.1, 8.1 and 5.1 on 2026-08-08, one commit each. The 15 Lows and 4 Infos are open;
6.3 (Info) was re-verified as part of 5.1 rather than merely inherited.

**9.2 is the one to read first.** It is the only finding that is invisible from any single file:
four modules each derive currency from `getUserLocale()` and agree with one another, so nothing
looks wrong locally — the defect is the shared premise that a user's *UI language* determines
their *currency*, plus the fact that only fetched quotes are converted while stored booking
amounts are not.

Two further themes ran through the Medium findings and are worth naming, since both were borne
out by the fixes:

- **Three of the five were silent.** 2.2, 4.1 and 5.1 all failed without an error, a log line or
  a type error — an override that is accepted and dropped, an error handler that eats its own
  error, and a locale that would quietly fall back to formatting euros as dollars. None was
  caught by the tooling, which was clean throughout. Each fix therefore carries a regression
  test rather than relying on the next audit to notice.
- **Two were path/config coupling** (8.1, 9.1): strings that name a file location and are not
  managed by the build, so they are correct only while unrelated settings stay aligned. 8.1 was
  the case where the alignment already did not hold; it now resolves through
  `browser.runtime.getURL`, which removes the coupling rather than re-aligning it. 9.1 (Low) is
  the same idiom still unmanaged and remains open.

One thing the fixes added that the analysis had not predicted: **5.1's silent-failure shape was
already present in the plugin's own test**, where an equality assertion over two empty key sets
passed vacuously the moment `numberFormats` changed type. The analysis found the defect in the
source; only executing the change found it in the test.

No finding contradicts the extensive in-code reasoning already present in this codebase; the
"Checked and found correct" sections record ~50 places where a plausible-looking defect turned
out to be deliberate and correctly argued.

---

## Round 1 — `domain/` layer

Files read in full: `logic.ts`, `errors.ts`, `constants.ts`, `constants/core.ts`,
`constants/cachePolicy.ts`, `constants/ui.ts` + all 6 `constants/ui/*`, `utils/utils.ts`,
`utils/url.ts`, `mapping/formMapper.ts`, `importExport/validator.ts`,
`validation/{rules,validators,duplicates,referentialIntegrity,messages}.ts`,
`types.d.ts`, `types/{adapter,backup,domain,ui,uiLayer}.ts`.
Cross-checked against `adapters/ui/validationAdapter.ts`, `BookingForm.vue`,
`CreditDebitFieldset.vue`, `CurrencyInput.vue`.

### 1.1 — Low · **FIXED** · `domain/validation/rules.ts:181` · `validateSWIFT` has three unreachable failure codes

> **Resolved.** The three per-segment checks are gone (the format regex already
> implied all of them), and so are the four dead `VALIDATION_CODES` entries
> (`INVALID_BANK`, `INVALID_REGION`, `INVALID_BRANCH`, `TEST_BIC`), the five dead
> `swiftRules` map entries — `INVALID_COUNTRY` included, since the membership
> check is deliberately skipped for BICs — the five `createSwiftMessages` slots,
> and the ten locale keys behind them. Behaviour is unchanged by construction:
> no input could reach any removed branch. A new test pins the outcome set by
> asserting that a malformed bank, country, location *and* branch segment all
> report `INVALID_FORMAT`.

*Verified.*

`validateSWIFT` runs `/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/` and only then checks the
bank code (`/^[A-Z]{4}$/`, lines 192-194), the location code (`/^[A-Z0-9]{2}$/`, lines 199-201)
and the branch code (`/^[A-Z0-9]{3}$/`, lines 203-207). All three are already implied by the
regex that just passed, so `INVALID_BANK`, `INVALID_REGION` and `INVALID_BRANCH` can never be
returned. `TEST_BIC` is defined in `VALIDATION_CODES` and never returned by anything.

Consequence is only in the message table: `swiftRules` (`validationAdapter.ts:326`) maps
`msgArray[3]`, `[5]`, `[6]` and `[7]` to codes that never occur, and `createSwiftMessages`
(`validation/messages.ts:30`) allocates 8 translation keys for 5 reachable outcomes. Any
malformed BIC reports `INVALID_FORMAT`, which is accurate but less specific than the message
table implies is available.

### 1.2 — Low · **FIXED** · `domain/validation/rules.ts:112` · unknown IBAN country reports "invalid length"

> **Resolved.** The table lookup is split out of the length comparison and
> returns `INVALID_COUNTRY` when the country is absent — matching `validateISIN`,
> which already did. `ibanRules` and `createIbanMessages` gained the matching
> slot, inserted at position 3 so the order mirrors `isinRules`
> (required/length/format/country/checksum/duplicate) rather than appended;
> `duplicate` therefore moved from index 4 to 5, updated at the one call site
> and in its test. New `country` key in both locales. Tests cover the
> unsupported country, and that a genuinely wrong length for a *supported*
> country still reports `INVALID_LENGTH`.

*Verified.*

`validateIBAN` looks the country up in `IBAN_LENGTH_CODES` and compares the length in one step
(lines 118-123). For a country code absent from the table the lookup is `undefined`, the
comparison fails, and the result is `INVALID_LENGTH`. So an IBAN from an unsupported country
tells the user their IBAN is the wrong length rather than that the country is not supported.
`VALIDATION_CODES.INVALID_COUNTRY` exists and `ibanRules` has no slot for it —
`validateISIN` does return it for the same situation, so the two validators are inconsistent.

### 1.3 — Low · `domain/constants/core.ts:41` · `VALID_COUNTRY_CODES` omits the `EU` ISIN prefix

*Verified.*

The set is a list of ISO-3166 country codes plus the two special securities prefixes `XS`
(Euroclear/Clearstream) and `XK`. `EU` — the prefix used by European Union and EIB issues
(e.g. `EU000A1G0AA6`) — is missing, so `validateISIN` rejects those with `INVALID_COUNTRY` and
`isinRules` blocks the stock from being added. Narrow, but it is a legitimate ISIN a German
investor can hold.

### 1.4 — Low · `adapters/ui/validationAdapter.ts:259` · `isoDateRules` accepts impossible calendar dates

*Verified by execution* (`node -e "new Date('2024-02-31T00:00:00Z')"` → `2024-03-02`).

The second rule tests `!isNaN(new Date(v + "T00:00:00Z").getTime())`. JavaScript's ISO parser
range-checks the month but rolls the day over, so `2024-02-31`, `2024-02-30` and `2024-04-31`
all pass. The rule therefore only ever adds month `00`/`13` rejection on top of the regex.

The domain already has the correct check — `isValidISODate` (`utils/utils.ts:80`) walks
`parseISODateParts`, which computes the real days-in-month — and it is what the write path
uses. That asymmetry is what makes this worth recording: if such a value ever reached
`validateBooking`, `normalizeDate` would return `""` and the booking would be stored with a
**blank date** while the in-memory store kept the typed value.

Not currently reachable from the UI: both fields using this rule (`BookingForm.vue:146` and
`:198`) are `type="date"`, and a native date input never yields an out-of-range day. The
defect is that the rule does not enforce what it claims and does not reuse the domain
function that does.

### 1.5 — Info · `domain/utils/utils.ts:23` · `detectNumberFormat` misreads a German whole-thousands string

*Reasoned.*

`"1.234"` — one dot, no comma — hits the "exactly one dot, no comma: US decimal" branch
(lines 29-32) and parses as `1.234` instead of `1234`. The heuristic cannot do better without
a locale hint, and the doc comment is honest that these are heuristics.

Recorded because there is one caller that supplies no locale and reads from a German-language
source: `acheck.ts:114-115` calls `normalizeNumber(rangeMin, detectNumberFormat(rangeMin))`
on 52-week range values scraped from `m.aktiencheck.de`. A range endpoint printed without
decimals (`"1.234"`) would be read as `1.234`. Finance sites virtually always print two
decimals, which is why this is Info rather than a defect — re-examined in Round 4 against the
provider's actual output shape.

### Checked and found correct (Round 1)

These were examined closely because they are the kind of thing that is usually wrong, and
they are not:

- **`compareIsoDateDesc` / `isoSortKey`** (`utils.ts:294-325`) — avoids subtraction entirely,
  so two undated rows cannot reintroduce the `NaN`-comparator bug. Correct.
- **`calculateInvestByStockId`** (`logic.ts:128`) — sorts BUY lots **newest first** and
  consumes the held quantity from the top. That is the correct FIFO reading: under FIFO the
  shares still held are the most recently bought ones. Correct.
- **`round2`** (`utils.ts:166`) — the relative-epsilon nudge cannot cross a rounding boundary
  for any value in safe-integer range (`EPSILON * |scaled|` reaches 0.5 only past 2.2e15).
- **`CreditDebitFieldset` `:rules` binding** (`BookingForm.vue:223`) — the props look like
  they pass a rule that returns an *array* (which Vuetify would warn on and skip, exactly the
  shape of the round-43 `countRules` bug). They do not: `CreditDebitFieldset.vue:38-39` calls
  `props.rules[0](debit)` as a **factory**, and hands the resulting array to `CurrencyInput`,
  which maps each entry into a real Vuetify rule (`CurrencyInput.vue:40-48`). The
  counterpart's value is the `oneOfTwo` argument. Correct, if unusually shaped.
- **Credit/debit are real numbers in the store** — unlike `count` (round 42), the amount
  fields go through `CurrencyInput`, which emits `parseCurrency(...)`, a `number`. So
  `mapBookingFormToDb` writing `cCredit: data.credit` un-coerced is safe. Additionally every
  aggregate consuming them uses subtraction (`cCredit - cDebit`, `cFeeDebit - cFeeCredit`),
  which coerces, so even a stray string could not concatenate there.
- **`findReferentialIssues`** (`referentialIntegrity.ts:67`) — the `cStockID` truthiness guard
  correctly treats `0` as the "no stock" sentinel rather than a reference.
- **`validateBusinessRules`** (`importExport/validator.ts:319`) — the present-but-non-numeric
  check runs before the sign checks, so a string amount is flagged rather than slipping
  through a `< 0` comparison that is false for non-numbers.
- **`sanitizeExternalUrl`** (`utils/url.ts:161`) — scheme allowlist plus credential rejection,
  and deliberately does not route through `UrlUtils.parseUrl` (which would prepend `https://`
  and mask the schemes being rejected).

---

## Round 2 — `app/usecases/`

Files read in full: `accounts.ts`, `bookings.ts`, `bookingTypes.ts`, `stocks.ts`, `ports.ts`,
`portAdapters.ts`, `backup.ts`, `backup/{export,exportHelpers,import,importHelpers}.ts`,
`records/init.ts`. Cross-checked against `DeleteBookingType.vue`, `AddBookingType.vue`,
`BookingTypeForm.vue`, `useForms.ts`.

### 2.1 — Medium · **FIXED** · `usecases/bookingTypes.ts:60` · a role-carrying booking type can be deleted, disabling stock bookings for that account

> **Resolved.** `deleteBookingTypeUsecase` now reads the record it is about to
> delete (`repositories.bookingTypes.findById`, newly declared on
> `BookingTypeRepositoryPort` for the same account-scoping reason `findByAccount`
> was) and returns `{status: "roleProtected"}` for any `cRole` other than
> `other`. `DeleteBookingType.vue` surfaces it as a new
> `messages.roleProtected` string in both locales, which also names the recovery
> (toggle the account's depot option). `canDelete` still runs first, so
> "bookings are assigned" stays the answer when both apply.

*Verified.*

`deleteBookingTypeUsecase` delegates the whole precondition to the injected `canDelete`, and
its only caller supplies `canDeleteBookingType = (id) => !records.bookings.hasBookingType(id)`
(`DeleteBookingType.vue:32`). Nothing looks at `cRole`. So the account's **Buy**, **Sell** or
**Dividend** type can be deleted as long as no booking references it yet — which is exactly the
state a freshly created depot account is in.

Consequence, following the code from there:

- `resolveTypeIdByRole` (`domain/logic.ts:33`) returns `undefined` for the missing role.
- `mapBookingFormToDb`'s `isStockRelated(typeId)` is then false for every remaining type, so
  `cStockID` and `cCount` are forced to `0` on save (`formMapper.ts:150,165`).
- `BookingForm.vue` hides the stock picker and the count field outright (`v-if="isStockBookingType"`,
  lines 157 and 186).

The account still advertises itself as depot-enabled (the Company view stays reachable), but no
purchase can be recorded any more, and nothing tells the user why.

Recovery exists but is undiscoverable: the add form has **no role control** at all
(`BookingTypeForm.vue` renders only a name field), so a re-created type is always `other`
(`useForms.ts:166`). The only way back is to open the account, toggle `withDepot` off and on
again, which re-runs `createDefaultBookingTypes` for the missing roles
(`accounts.ts:250-298`).

The counterpart guard already exists on the other side of the same invariant:
`updateBookingTypeUsecase` refuses a role collision with `{status: "roleConflict"}`
(`bookingTypes.ts:100-110`) precisely because a role must stay resolvable. Deletion has no
equivalent.

### 2.2 — Medium · **FIXED** · `usecases/backup/import.ts:148` · the error handler can throw, replacing the real failure and skipping `onError`

> **Resolved.** The rollback `setStorage` is wrapped in its own `try/catch` that
> logs at `warn` and falls through, so `input.onError(errorMessage)` always runs
> with the *original* `err`. Covered by a regression test that rejects the
> rollback write while letting the happy-path write succeed.

*Verified.*

```text
} catch (err) {
    deps.settings.activeAccountId = originalActiveId;
    await deps.setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, originalActiveId);  // unguarded
    const errorMessage = …;
    await input.onError(errorMessage);
}
```

`setStorage` is awaited with no `try`. If that write rejects, the rejection propagates out of
`importDatabaseUsecase` and `input.onError(...)` never runs — the user gets no import-failure
message, and the original `err` (the actual reason the import failed) is discarded in favour of
a storage error.

This is not a theoretical failure mode in this function: a `setStorage` rejection is precisely
what `setActiveAccountIdPersisted` (`portAdapters.ts:76`) exists to handle, and it is one of the
paths that can land here in the first place. The same call one line earlier in the happy path is
wrapped; the one in the handler is not.

`deps.settings.activeAccountId = originalActiveId` on the line above already restored the
in-memory value, so a failed persist leaves memory and storage disagreeing until the next
successful write — separate from, and less serious than, losing the error.

### 2.3 — Low · `usecases/backup/exportHelpers.ts:69` · an empty database reports "export validation failed"

*Verified.*

`findExportConsistencyIssues` sets `noAccounts: input.accounts.length === 0`, and
`hasExportConsistencyIssues` treats it like a dangling reference, so `exportDatabaseUsecase`
throws `EXPORT_DATABASE.A` — *"Export validation failed"* (`export.ts:70-72`). Refusing to
export nothing is defensible; reporting it with the same message used for a genuinely
inconsistent database is not. A user who has just installed the extension and clicks Export is
told their data failed validation.

### 2.4 — Info · `usecases/bookingTypes.ts:22` · `addBookingTypeUsecase` has no role-conflict guard

*Verified — currently unreachable.*

`updateBookingTypeUsecase` checks role uniqueness per account; `addBookingTypeUsecase` does not.
Today that cannot be exploited: `BookingTypeForm.vue` exposes no role control, and
`createBookingTypeFormManager` hard-codes `role: BOOKING_TYPE_ROLE.OTHER`
(`useForms.ts:166`), so every user-created type is `other` and `other` is exempt from the rule.

Recorded because the asymmetry is invisible from the use case itself, and the guard's absence
becomes a live duplicate-role bug the moment a role selector is added to the add dialog — the
exact scenario the update path documents at length.

### Checked and found correct (Round 2)

- **`toRecordsPort`** (`portAdapters.ts:119`) — routes every store `add`/`update` through the
  same domain validator the repository uses, which is what stops the store and the DB
  diverging. `init` is deliberately unwrapped, and the reason given holds.
- **`addAccountUsecase`'s rollback** (`accounts.ts:166-192`) — undoes the in-memory add, the DB
  write and the wiped previous-account records, and rethrows the original error rather than a
  cleanup error. The ordering is right.
- **`updateAccountUsecase` / `updateBookingTypeUsecase` reading roles from the repository**
  rather than `records.bookingTypes.items` — correct, and correct for the stated reason: the
  store only ever holds the active account's types.
- **`addBookingUsecase` not calling `resetTeleport()`** — deliberate asymmetry, matches
  `AddBooking.vue` keeping its dialog open, and is commented at the use case.
- **`buildModernImportPlan`'s `Number()` coercion of `activeId`** (`import.ts:125`) — matches
  the `===` filter applied to normalized records, so a hand-edited backup with string ids
  cannot silently produce empty in-memory stores.
- **`import.ts` post-commit `try/catch`** (lines 142-147) — a failing success notification
  correctly does *not* fall through into the rollback path.

---

## Round 3 — `adapters/driven/database/`

Files read in full: `databaseAdapter.ts`, `connectionManager.ts`, `migrator.ts`,
`transactionManager.ts`, `batchOperations.ts`, `healthChecker.ts`, and all six
`repositories/*.ts`.

### 3.1 — Low · `connectionManager.ts:41` · an unhandled `versionchange` reloads the page and discards unsaved input

*Verified.*

`setupEventHandlers` installs `database.onversionchange`, which closes the connection and then:

```text
if (versionChangeHandler) versionChangeHandler();
else window.location.reload();          // default
```

`versionChangeHandler` is only ever set through `connection.onVersionChange(...)`, surfaced as
`databaseAdapter.onVersionChange`. Grepping the whole of `src/` finds **no caller** — the only
references are its own definition, the interface declaration in `domain/types/uiLayer/misc.ts:89`,
and tests. So the default branch is the only branch that ever runs in the shipping app.

Trigger: another connection requests a higher `INDEXED_DB.CURRENT_VERSION` — in practice an
extension update landing while an app tab is open. The tab then hard-reloads with no warning,
discarding whatever is typed into an open dialog. A registered handler could instead surface an
alert and let the user finish. Low because the trigger is rare and the reload is at least
functionally correct.

### 3.2 — Low · `adapters/driven/database/` · substantial API surface with no production caller

*Verified by grep across `src/` (excluding the database directory itself and type declarations).*

| Symbol | File | Only reached from |
|--------|------|-------------------|
| `transactionManager.executeMultiple` | `transactionManager.ts:170` | tests |
| `createBatchOperationBuilder` (~100 lines) + `batchService.createBuilder` + `databaseAdapter.batch()` | `batchOperations.ts:191` | tests |
| `databaseAdapter.batchOperations()` | `databaseAdapter.ts:219` | tests |
| `databaseAdapter.getTransactionManager()` / `getRepository()` | `databaseAdapter.ts:50,85` | tests |
| `accountRepository.findByIBAN` / `ibanExists` | `accountRepository.ts:54,62` | tests |
| `bookingRepository.findByDate` / `findByBookingType` / `findByStock` | `bookingRepository.ts` | tests |
| `countByAccount` (all three repositories) | `*Repository.ts` | tests |
| `repositoryFactory.clearCache` | `repositoryFactory.ts:69` | nothing |

Notable within that list: `countByAccount` was recently reworked to count through the index
rather than materializing rows (`baseRepository.countBy`, with a doc comment explaining the
win) — a correct optimization to a method no production code calls. And the builder's
`execute()` carries a careful concurrent-queue/`reset()` analysis for a class nothing
instantiates outside tests.

This is not "delete it" advice — a repository layer reasonably exposes a complete CRUD surface.
It is recorded so the cost is visible: these paths are maintained and audited round after round
while only tests exercise them.

`healthChecker`'s `performHealthCheck`/`repairDatabase` are **excluded** from the list above:
that module documents at its head that it is a deliberately unwired diagnostic surface, which
is a different thing from drift.

### 3.3 — Info · `migrator.ts:143` · the `oldVersion < 27` migration can hard-fail on legacy blank identifiers

*Reasoned — not reachable for any currently supported database.*

`migrateStocksAccountScopedUniqueness` creates `stocks_uk3`/`uk4` as `{unique: true}` composite
indexes over existing rows. IndexedDB indexes an explicit `""` as a real value, so a pre-v27
database holding two same-account stocks that both stored a blank `cISIN` (or `cSymbol`) makes
`createIndex` abort the version-change transaction — and every subsequent open repeats it, so
the database becomes permanently unopenable rather than degraded.

Not actionable today: `INDEXED_DB.MIN_SUPPORTED_VERSION` is 27 and the blank-identifier strip
now exists on both write paths (`stockRepository.save`, `stripBlankStockIdentifiers`), so no
database this code can still meet is in that state. Recorded because the migration is still
wired in permanently (`oldVersion < 27`) and carries this hazard for anyone restoring a very
old profile.

### Checked and found correct (Round 3)

- **`transactionManager.execute` attaching `waitForCompletion` before running the operation**
  (lines 113-122) — this is the auto-commit hazard handled correctly, including the
  `completion.catch(() => undefined)` that prevents a spurious unhandled rejection.
- **`Promise.all` of repository reads sharing one `tx`** (`databaseAdapter.ts:115`, `:160`,
  `:197`) — each `findAll`/`findBy` issues its `IDBRequest` synchronously before its first
  `await`, so all requests are queued within the same task and the transaction cannot
  auto-commit between them.
- **`baseRepository.runInTransaction`'s mode check** (lines 95-118) — correctly rejects a
  caller-supplied `versionchange` transaction, and correctly allows a `readwrite` tx to serve a
  `readonly` request but not the reverse.
- **`migrator.runMigrations` throwing when `tx` is absent** (lines 205-227) — the reasoning is
  right: the version bump commits regardless, so failing loudly is the only recoverable
  outcome.
- **`connectionManager`'s `abandoned` flag** (lines 83-122) — `onupgradeneeded` still runs
  after `onblocked` (correct: the versionchange transaction commits either way) while
  `onsuccess` refuses to adopt the connection and closes it.
- **`batchOperations` builder identity check** (`current !== queue`, line 256) — correctly
  distinguishes "queue we executed from" from a post-`reset()` replacement.
- **`healthChecker` classifying dangling stock/booking-type references as `invalid_references`
  rather than `orphaned_records`** — deliberately keeps them out of the delete-based repair.

---

## Round 4 — `adapters/driven/` (fetch stack + remaining adapters) and the DI containers

Files read in full: `fetchAdapter.ts`, `fetch/{httpClient,httpCache,providerUtils}.ts`, all six
`fetch/providers/*.ts`, `appAdapter.ts`, `browserAdapter.ts`, `alertAdapter.ts`,
`storageAdapter.ts`, `faviconAdapter.ts`, `taskAdapter.ts`, `importExportAdapter.ts`,
`driven/types.ts`, `container.ts`, `containerBackground.ts`, `context.ts`.
Cross-checked against `AppIndex.vue` and `InfoBar.vue` (the two consumers of what this layer
produces).

### 4.1 — Medium · **FIXED** · `adapters/container.ts:66` · the `storageAdapter` override is declared but silently ignored

> **Resolved.** `createAdapters` now binds `const storage = overrides.storageAdapter
> ?? storageAdapter` and uses that local in both places — the returned container
> and the `createAppAdapter` argument — matching the pattern every other adapter
> already followed and the one `containerBackground.ts` already got right.
> A new `tests/unit/adapters/container.test.ts` locks all three behaviours
> (returned container, pass-through to `createAppAdapter`, and the no-override
> fallback), so the documented escape hatch can no longer go inert unnoticed.

*Verified.*

`AdaptersOverrides` declares `storageAdapter: typeof storageAdapter` (line 61), and
`ARCHITECTURE.md` §8.1 states that `overrides` "accepts test doubles for **any** adapter,
enabling unit tests without real IndexedDB or network calls". But `createAdapters` never reads
it. Every other adapter follows the `overrides.x ?? createX()` pattern; `storageAdapter` is
used bare in both places it appears:

```text
const appAdapter = overrides.appAdapter ?? createAppAdapter({
    browserAdapter, storageAdapter, databaseAdapter, fetchAdapter   // module import
});
return { …, storageAdapter, … };                                    // module import
```

So `createAdapters({storageAdapter: fake})` type-checks, is accepted, and hands back the real
`browser.storage.local` wrapper — both in the container and inside `appAdapter`, whose Phase 1
(`initializeStorage`) is the one thing a storage double would exist to control.

Nothing passes it today (the entrypoints call `createAdapters()` with no arguments, and the
tests inject storage through `attachStoreDeps` instead), so there is no live misbehaviour. The
defect is that the escape hatch is advertised, type-checked, and inert — a future test written
against the documented contract would silently exercise real browser storage and appear to
pass. `containerBackground.ts:28` gets the same override right (`overrides.storageAdapter ??
storageAdapter`), which is what makes this look like an omission rather than a decision.

### 4.2 — Low · `driven/appAdapter.ts:675` · `getStatus` reports a storage error for a legitimately empty install

*Verified.*

```text
const storageOk = stores.settings.activeAccountId !== -1;
```

`-1` is not an error value — it is `BROWSER_STORAGE.ACTIVE_ACCOUNT_ID`'s shipped default
(`constants/core.ts:660`) and `INDEXED_DB.INVALID_ID`, the documented "no active account"
sentinel that `deleteActiveAccountUsecase` and the import path both deliberately write. So a
user who has just installed the extension, or who has deleted their last account, has storage
working perfectly and `getStatus()` reports `storage: "error"`.

Not currently visible: `AppIndex.vue:72-78` is the only caller and reads `status.fetch` only.
The `storage`/`db` fields exist for a status indicator that is not wired up. Recorded because
the accessor is public, is documented as *the* live status source, and would be wrong the day
something renders it.

### 4.3 — Info · `driven/fetchAdapter.ts:573` · quote fetches are unbounded-parallel per page

*Reasoned.*

`fetchMinRateMaxData` maps every ISIN on the page into a simultaneous `Promise.allSettled`, one
provider request each (two for `ard` and `wstreet`, which fetch a search page and then a detail
page). With `stocksPerPage` configurable up to 13, that is up to 26 requests to a single host
inside one tick, repeated per page refresh. No concurrency cap, no stagger.

Recorded rather than filed as a defect because it is bounded by the page size and the quote
cache absorbs repeats within `QUOTE_TTL_MS`. It is, however, the shape of traffic that bot
protection responds to — and `finanzen_net_akamai_403` is already a known instance of that on
this project's other endpoints.

### 4.4 — Info · Round 1.5 (`detectNumberFormat` in `acheck.ts`) resolved as a non-issue

*Verified against the provider.*

Round 1 flagged `acheck.ts:114-115`'s locale-free `detectNumberFormat(rangeMin)` as a possible
misread of a German whole-thousands value. Reading the provider settles it: the comment at
`acheck.ts:104-109` records that aktien-check.de renders the **52-week range table in
dot-decimal** (`"174.36"`) while the quote row is comma-decimal — which is exactly why
auto-detection is used there and `"de"` is hardcoded for the rate. A dot-decimal source never
produces the ambiguous `"1.234"` shape (its thousands form is `"1,234.56"`, which the
both-separators branch reads correctly). No defect.

### Checked and found correct (Round 4)

- **`httpCache.getCache` honouring `Math.min(entry.ttl, ttl)`** — a quote body written with the
  60 s TTL cannot be served stale by a reader asking with the 5-minute default.
- **`fetchWithRetry`'s single shared timeout budget** — the `controller.signal.reason ===
  timeoutReason` break correctly distinguishes caller cancellation (throw immediately) from
  timeout (stop retrying) and from a retryable HTTP status.
- **`fetchIsOk` treating any HTTP answer, including a 403, as proof of connectivity** — the
  right call given Akamai's blanket 403 to extension-origin requests, and `navigator.onLine ===
  false` is correctly used only as an authoritative negative.
- **`fetchDateData` returning `null` per failed entry and filtering it out** — keeps "lookup
  failed" distinguishable from "no dates exist", which is what stops a network blip erasing
  stored meeting/quarter dates.
- **Currency handling across all six providers** — every one substitutes `DEFAULT_CURRENCY`
  rather than `""` when no marker is found, which is required: an empty `cur` makes
  `useOnlineStockData` infer USD from the ISIN prefix. `wstreet.ts:199` even backstops it at
  the function exit, and `tgate` asserts EUR deliberately (German exchange).
- **`acheck` suppressing min/max for a non-EUR quote** (lines 100-102) — the range table
  carries no currency marker and is not in the quote's currency; reporting nothing beats
  reporting a mis-converted range.
- **`browserAdapter.writeBufferToFile`'s cleanup** — listener registered before the download
  starts, terminal-before-id-known set, `pagehide` handler and a 10-minute backstop timer.
  All three leak paths are closed.
- **`alertAdapter.feedbackConfirm` not being rate-limited and throwing on a missing sink** —
  "could not ask" must not collapse into "user said no"; both halves of that are handled.
- **`getUserLocale` matching on the language subtag** — `de-AT`/`de-CH` correctly get the
  German UI and therefore EUR number formatting.

---

## Round 5 — `adapters/ui/stores/` and `adapters/ui/plugins/`

Files read in full: `stores/{deps,recordsHub,accounts,bookings,bookingTypes,stocks,portfolio,accounting,runtime,settings,alerts}.ts`,
`plugins/{pinia,router,i18n,themeSync,components,vuetify}.ts`.

### 5.1 — Medium · **FIXED** · `plugins/i18n.ts:126` · the app runs vue-i18n in **Legacy mode**, and the locale assignment only works *because* of that

> **Resolved.** `i18nConfig` now declares `legacy: false as const` (the `as const`
> is load-bearing: `createI18n`'s return type branches on
> `(typeof options)["legacy"] extends false`, so a widened `boolean` lands on
> neither branch and yields `Composer | VueI18n`), and `vite.config.js` defines
> `__VUE_I18N_LEGACY_API__: false` so the legacy code is dropped from the bundle
> and the two answers cannot drift apart.
>
> Consequence (2) was handled at the same time rather than left as a trap: the
> assignment is now `i18nInstance.global.locale.value = …`.
>
> The switch found a **second, latent instance of the same hazard in the plugin's
> own test.** `numberFormats` is a plain object on Legacy's `VueI18n` and a
> `ComputedRef` on a Composer, so `i18n.global.numberFormats` started reading
> `undefined` — and the "defines the same number-format key set for every locale"
> assertion did not catch it, because comparing `[]` to `[]` passes. Only the two
> `toContain` assertions failed. The test now reads through one
> `numberFormatsOf()` helper plus an explicit non-emptiness guard, so an
> empty-key-set regression cannot pass silently again. Two further tests assert
> the mode (`i18n.mode === "composition"`) and that the browser adapter's locale
> is actually applied.
>
> Verified beyond the tests: no source file uses the Legacy global-injection
> forms (`$t`/`$n`/`$d`/`$tm`) — every component already went through
> `useI18n()`, which returned a Composer in either mode. `currencySync`'s
> `mergeNumberFormat` exists on the Composer. Full unit suite green.

*Verified against `node_modules/vue-i18n/dist/vue-i18n.mjs` (v11.1.11).*

`createI18n(i18nConfig)` is called without a `legacy` option, and `vite.config.js` defines no
`__VUE_I18N_LEGACY_API__` flag. vue-i18n's `initFeatureFlags()` therefore sets that flag to
`true`, and `createI18n` resolves `__legacyMode = true`. Two consequences:

1. **The app is on a removed-in-v12 API path.** Every component uses the Composition API
   (`useI18n()`), yet the instance runs in Legacy mode purely by omission. v11 emits a
   `DEPRECATE_LEGACY_MODE` warning in non-production builds, and `createVueI18n` is marked
   `@deprecated will be removed at vue-i18n v12`.

2. **The obvious "fix" for (1) silently breaks the locale.** The very next line is

   ```text
   i18nInstance.global.locale = browserAdapter.getUserLocale();
   ```

   In Legacy mode `i18n.global` is a `VueI18n` object whose `locale` is a real accessor pair
   (`get locale()` / `set locale(val) { composer.locale.value = val }`, dist lines 1320-1325),
   so this works. Setting `legacy: false` — or upgrading to v12, where composition mode is the
   only mode — makes `i18n.global` a **Composer**, whose `locale` is a `WritableComputedRef`.
   The bare assignment then *replaces the ref with a string* instead of setting it, the locale
   silently stays at the configured default `"en-US"`, and the correct form
   (`i18nInstance.global.locale.value = …`) is never reached.

The consequence of that second point is not just an English UI. `locale` also selects the
`numberFormats` block, where `de-DE.currency` is EUR and `en-US.currency` is USD — so a German
user's euro balances would render as `$1,234.56` across the title bar, bookings table and
accounting dialog. That is character-for-character the failure `getUserLocale`'s own doc comment
(`browserAdapter.ts:107-123`) describes having already been fixed once, arrived at by a
different route.

Recorded as Medium rather than Low because the trigger is a routine dependency upgrade or a
one-line deprecation cleanup, and the failure is silent — nothing throws, nothing logs, the app
just quietly formats money in the wrong currency.

### 5.2 — Low · `stores/settings.ts:247` · self-inflicted echo from the cross-context storage listener

*Verified.*

`browser.storage.onChanged` fires in **every** extension context, including the one that
performed the write. So each `updateSetting(...)` → `setStorage(...)` round trip comes back
through `applyStorageChange` and re-assigns the same ref in the same context.

Harmless today — the assignment is idempotent and every value is a primitive or a fresh clone —
but it means each local settings change runs the full 11-key change scan and re-assigns
`activeAccountId`, which is watched in `AppIndex.vue:38` and clears the stocks page cache. The
cache clear is correct either way; the duplicate path is not obvious from either side, and an
`onChange` callback with a side effect (the parameter exists, currently unused) would fire twice
for one user action.

### 5.3 — Low · `stores/deps.ts:130` · `getStoreTranslate` has no wiring guarantee, only a fallback

*Verified.*

`attachStoreTranslate` is a second, optional side-channel; both consumers
(`settings.errorTitle`, `alerts.defaultConfirmText`/`defaultCancelText`) fall back to hardcoded
English when it is absent. That is a reasonable design, but the fallback strings are the *only*
thing standing between a wiring omission and untranslated UI text — and because they read
plausibly ("Settings error", "Confirm", "Cancel"), a missing `attachStoreTranslate` in a new
entrypoint would never be noticed. Worth a startup assertion or a dev-mode log rather than a
silent English default.

### 5.4 — Low · `plugins/vuetify.ts:101` · `info` is yellow in all six themes, on near-white backgrounds

*Verified.*

Every theme sets `info: "yellow"` (the plain CSS keyword, `#FFFF00`) while five of the six use a
`#e0e0e0`/`#eeeeee` background. `info` is the most-used severity in the app — every
`alertAdapter.feedbackInfo` call, which is the default channel for all non-error feedback — and
`AlertOverlay` binds it straight to `v-alert :type`. Pure yellow on a light grey surface is
roughly 1.1:1 contrast for the text and border a tonal alert draws in that colour.

Same class of defect as the one this file's own header comment documents having already fixed:
`error` and `warning` both rendered orange, so two of four severities were not distinguishable.
That collision was resolved; the `info` legibility problem in the same palette was not.
Vuetify's stock `info` is blue (`#2196F3`) for exactly this reason.

### Checked and found correct (Round 5)

- **`portfolio.sumDepot` and `bookings.sumBookings` as plain computeds** — the
  `computed(() => () => …)` idiom is correctly reserved for parameterised getters; these two
  are memoized, which matters because `active` is O(stocks × bookings).
- **`portfolio.active`'s sort** — operates on the array returned by `filter().map()`, so it
  cannot mutate `stocks.items` in place.
- **`runtime`'s generation counters** (`bumpStocksPageGeneration` / `isStocksPageGenerationCurrent`)
  — correctly cover the case that per-caller `AbortController`s cannot: a response from caller A
  resolving after caller B started a newer fetch for the same page. `clearStocksPages` bumping
  every tracked page is what stops an in-flight write re-marking a page fresh after invalidation.
- **`runtime`'s ref-counted `isDownloading`/`isStockLoading`** — three overlapping call sites,
  and a plain boolean would be cleared by whichever finished first.
- **`settings.updateSetting`'s conditional rollback** (`if (refVar.value === value)`) — correctly
  refuses to clobber a newer, already-successful overlapping write.
- **`alerts.confirm` storing `resolve(false)` in the `reject` slot** — deliberate: cancel is an
  answer, so it resolves; only the "a dialog is already open" case rejects, and
  `isConfirmDialogBusyError` is what lets call sites tell that apart from a real failure.
- **`alerts.startAutoDismissTimer` firing only when an alert becomes current** — a queued
  alert's timer cannot expire before it has been shown.
- **`plugins/pinia.ts` taking `AdaptersInternal`** — the one place that legitimately needs
  `configureAlertSink`, kept off the `useAdapters()` surface.

---

## Round 6 — `adapters/ui/composables/` and `adapters/ui/entrypoints/`

Files read in full: `composables/{useDialogGuards,useForms,useOnlineStockData,useImportDialog,useExportDialog,useMenu,useHeaderBarActions,useFavicon,useUrl,useKeyboardShortcuts}.ts`,
`entrypoints/{app,background,options,errorHandling,singleTabGuard}.ts`.

### 6.1 — Low · `useMenu.ts:258` vs `useHeaderBarActions.ts:38` · two action tables over one union, each mostly dead, and they diverge on `updateQuote`

*Verified by tracing every dispatch site.*

Both files build an exhaustive `Record<MenuActionType, …>` over the same 23-member union, and each
is reachable from exactly one dispatcher:

- `useMenuAction.executeAction` is called only from `DotMenu.vue:43`, with `item.action` taken
  from `createHomeMenuItems` (updateBooking, deleteBooking) or `createCompanyMenuItems`
  (updateStock, deleteStock, showDividend, openLink). **6 of 23 handlers are reachable.**
- `useHeaderBarActions.onIconClick` resolves the id off the clicked element; `HeaderBar.vue`
  emits 16 of them. Its own comment already documents the 6 row-level entries it can never
  reach.

So each table carries the other's actions as unreachable duplicates, and only one of the two
files says so. The concrete cost is `updateQuote`, where the duplicates are not equivalent:

| | `useHeaderBarActions.updateQuote` (live) | `useMenu.updateQuote` (dead) |
|---|---|---|
| scope | `refreshAllOnlineData()` — every page | `refreshOnlineData(runtime.stocksPage)` — one page |
| row selection | n/a | positional slice, no `stockIds` |

The dead one is ~25 lines of non-trivial logic (AbortController supersession, ref-counted
loading flags, cache clear) maintained in parallel with the live one, and it uses the
*positional* page slice that `resolvePageStocks`'s own doc comment
(`useOnlineStockData.ts:72-83`) identifies as wrong once the user sorts the table — the exact
problem the `stockIds` parameter was added to fix, and which `CompanyContent.vue:289` does pass.
Wiring a per-row "update quote" control to it later would silently reintroduce that bug.

### 6.2 — Low · `useOnlineStockData.ts:136` · a stock with no ISIN still issues a quote request

*Verified.*

```text
isin.push({id, isin: stock.cISIN, min: "0", rate: "0", max: "0", cur: ""});
```

No guard on `stock.cISIN` being blank. `fetchMinRateMaxData` then builds `service.QUOTE + ""` —
the provider's search endpoint with an empty query — fetches it, fails to parse a rate, and the
provider throws. The ISIN then lands in `failedIsins`, and lines 154-161 raise a **non-dismissing**
alert (`{duration: null}`) naming the company, on every refresh of that page.

`isinRules` makes the add form require an ISIN, so this is reachable only through a backup
import (`validateStock` normalizes a missing `cISIN` to `""` and nothing rejects it) — but that
is precisely the path `StockDb.cISIN`'s optionality exists to support. Skipping blank-ISIN
stocks when building the request list would drop a useless request and a recurring alert.

### 6.3 — Info · **RE-VERIFIED after 5.1** · `entrypoints/app.ts:44` · `i18n.global.t` is passed unbound

*Verified against `vue-i18n.mjs` in both modes.*

`attachStoreTranslate(pinia, i18n.global.t)` detaches `t` from its object. This was recorded
alongside 5.1 as a second thing depending on the then-undeclared mode, with the note that any
move to composition mode should re-verify the call and not just the `locale` assignment.

That re-verification was done as part of fixing 5.1 and the call is **still safe**. It was safe
in Legacy mode because `VueI18n.t` is an object-literal method that closes over its composer and
calls `Reflect.apply(composer.t, composer, …)`, never reading `this`. It is safe in composition
mode for a stronger reason: the Composer's `t` is `function t(...args)` declared inside the
`createComposer` closure (dist line 556) and attached to the returned object afterwards, so it
has no `this` dependency to lose. Both entrypoints (`app.ts:44`, `options.ts:32`) are covered.

### Checked and found correct (Round 6)

- **`submitGuard`'s fail-closed validation gate** (`useDialogGuards.ts:287`) — the explicit
  `skipValidation` flag is what makes an accidental `undefined` `formRef` different from a
  deliberate omission, and `withLoading` wrapping the *entire* flow (not just `operation`) is
  what makes `:disabled="isLoading"` actually block a double-click during async validation.
- **`formRef` typed as `FormContract | null` rather than a `Ref`** — matches what `defineExpose`
  actually hands a parent (`proxyRefs` unwraps top-level refs). This was the round-33 bug.
- **`useOnlineStockData`'s generation re-check after the failed-ISIN alert**
  (lines 152 and 166) — the second check after the `await` is genuinely needed and easy to miss.
- **`mEuroChange` deliberately not written by the fetch path** — `portfolio.active` derives it,
  so a written value would be overwritten and could disagree.
- **`createRollbackPoint` reading `getAllRecords()` rather than the stores** — the stores hold
  only the active account's children while `restoreFromRollback` re-adds after a *global* clear.
  Snapshotting the stores would silently wipe every other account.
- **`askConfirmation` / `confirmDestructive` / `confirmLargeFile`** — all three narrow to
  `isConfirmDialogBusyError` rather than blanket-catching, so `SINK_UNAVAILABLE` still
  propagates instead of being read as "the user said no".
- **`useFavicon` retry state** — `AccountForm.vue:48` does `watch(domain, () => reset())`, so a
  changed domain restarts at the first provider rather than inheriting the previous domain's
  exhausted `retryCount`.
- **`useKeyboardShortcuts` wrapping handlers in `Promise.resolve(...).catch(...)`** — handlers
  are typed synchronous but several are async; OS key auto-repeat re-entering a confirmation
  would otherwise surface as an unhandled rejection.
- **`singleTabGuard.pickSurvivor` applied to the same candidate pool in all three call sites** —
  including the new tab in `closeDuplicateAppTab`'s pool is what makes agreement structural
  rather than dependent on tab ids being monotonic.
- **`app.ts`'s `renderBootstrapFailure`** — covers the pre-mount window that `AppIndex`'s own
  retry cannot, and correctly does *not* fire on the `ensureSingleAppTab` bow-out path (which
  returns rather than throws), where a retry button would invite defeating the guard.
- **`errorHandling.ts` using `console.error` directly** — installing `app.config.errorHandler`
  suppresses Vue's own reporting, so routing it through the debug-gated `log()` would make
  release builds silent.

---

## Round 7 — `adapters/ui/components/` (including `dialogs/` and `dialogs/forms/`)

Files read in full: all 29 `.vue` files under `components/` — `AlertOverlay`, `CheckboxGrid`,
`ContentCard`, `CreditDebitFieldset`, `CurrencyInput`, `DialogPort`, `DotMenu`, `DynamicList`,
`MenuItem`, `ServiceSelector`, `ThemeSelector`, the 15 `dialogs/*`, and the 5 `dialogs/forms/*`.

### 7.1 — Low · 5 call sites · `item-key` is a Vuetify 2 prop; Vuetify 3 ignores it, and `item-value` is never set

*Verified against `node_modules/vuetify` (no `itemKey` prop on `VDataTable` or `VSelect`).*

| File | Line | Component |
|------|------|-----------|
| `views/CompanyContent.vue` | 367 | `v-data-table item-key="cID"` |
| `views/HomeContent.vue` | 193 | `v-data-table item-key="cID"` |
| `dialogs/ShowAccounting.vue` | 172 | `v-data-table item-key="id"` |
| `dialogs/ShowDividend.vue` | 47 | `v-data-table item-key="id"` |
| `dialogs/FadeInStock.vue` | 89 | `v-select item-key="cID"` |

Vuetify 3 renamed this to **`item-value`**; `itemKey` does not exist on either component, so the
binding falls through as a plain DOM attribute and does nothing. None of the five sites sets
`item-value`, so `VDataTable` falls back to its default (`"id"`) — a property none of these row
types has (`cID`, not `id`, for stocks and bookings).

This is not speculative: it is the documented root cause of a bug this codebase already worked
around. `CompanyContent.vue:234` states it outright — *"`key` and `value` are no substitute:
both derive from the `item-value` prop, which this table does not set, so they are `undefined`
too"* — and `toStockIds` reaches for `.raw` to compensate. The `useOnlineStockData.ts:121`
comment records the symptom that produced: `[undefined × 10]` compared equal to the previous
`[undefined × 10]`, so page changes fetched nothing and later pages showed permanently blank
price columns.

Setting `item-value="cID"` (and `"id"` for the two dialog tables, which already matches their
row shape) would fix it at the source rather than at the consumer, and would also give Vue a
stable row key for list diffing instead of the positional fallback.

`ShowAccounting.vue:157` shows the same table's `v-select` using `item-value="id"` correctly
15 lines above the `v-data-table` that uses `item-key` — so the right prop is in the file.

### 7.2 — Low · `dialogs/ShowAccounting.vue:172` · the totals row is paginated with the data rows

*Verified.*

`accountEntries` appends the "Sum" row (plus, for a depot account, the Taxes and Fees rows) to
the same array the `v-data-table` paginates at `settings.sumsPerPage` (default 11). With more
booking types than fit on a page, the total moves to the last page — so the first page of an
accounting summary shows figures with no total, and the last shows a total with no context.

The two unshifted depot rows make it worse: they consume 2 of the 11 slots on page 1 while the
total they contribute to sits elsewhere.

### 7.3 — Low · `components/DialogPort.vue:47` · the OK button's `type="submit"` is inert

*Verified.*

The OK `v-btn` sits in `<v-card-actions>`, while the `<v-form>` lives inside the dialog
component rendered into `<v-card-text>` — so the button is a *sibling* of the form, not a
descendant, and `type="submit"` submits nothing. Every dialog's `<v-form>` also carries
`@submit.prevent`, and validation is in fact driven explicitly by `submitGuard` →
`formRef.validate()`.

Harmless, but the attribute states a mechanism that is not the one in use, and
`validate-on="submit"` on each form reads as though it pairs with it.

### Checked and found correct (Round 7)

- **`BaseDialogForm`'s error boundary** — replacing the slot with an alert would leave the
  `v-form` with no registered fields, so `validate()` would resolve `{valid: true}` and
  `submitGuard` would run the operation against a form the user never filled in. The hidden
  always-failing `v-input` closes that, and the reasoning is stated at the markup.
- **`UpdateBookingType`'s `bookingTypeRef.value?.edit`** — `defineExpose` unwraps top-level
  refs, so the parent correctly reads a boolean here. This is the round-33 lesson applied
  right, on the one component that exposes a ref.
- **The four "load current record or bail" guards** (`UpdateStock`, `UpdateBooking`,
  `UpdateAccount`, and `UpdateBookingType`'s deliberate *non*-prepopulation) — each explains
  precisely how a failed lookup would otherwise turn an update into an insert via the
  `data.id > 0` gate. All four are correct and consistent.
- **`AccountForm`'s IBAN duplicate check** passing `props.isUpdate ? accountFormData.id :
  undefined` — excludes the record being edited without weakening the check on add. Same
  pattern in `StockForm` for both ISIN and symbol.
- **`CheckboxGrid`'s exhaustive `switch` with a `null` default** — the previous
  `if (INDEXES) … return MATERIALS` shape made MATERIALS the fallback for *everything*, so an
  unrecognised type would have overwritten the user's saved materials selection.
- **`CheckboxGrid.setChecked` rolling back a single item rather than an array snapshot** —
  correct, because Vuetify's `v-model` write lands on `input`, before this `change` handler
  runs, so any "previous" array captured here is already post-mutation.
- **`DynamicList`'s `newItem: ref<string | null>`** — Vuetify's clearable text field resets the
  model to `null`, not `""`; typing it `string` was never contradicted because the v-model prop
  is `any`.
- **`DynamicList.removeByValue` using `lastIndexOf` rather than `pop()`/a captured index** —
  the cross-context storage listener can replace the whole array during the awaited write.
- **`AlertOverlay`'s `renderedAlert`/`renderedConfirmation` caches** — store state resets
  synchronously while Vuetify is still running the leave transition, so without the cache the
  text visibly flashes to blank mid-dismiss.
- **`AddBooking` and `AddBookingType` passing `rateLimitMs: 0`** — both dialogs stay open for
  repeated entry and every success message is a fixed string, so the adapter's default
  `kind|title|message` de-duplication would swallow the second confirmation.

---

## Round 8 — `adapters/ui/views/`

Files read in full: `AppIndex.vue`, `TitleBar.vue`, `HeaderBar.vue`, `HomeContent.vue`,
`CompanyContent.vue`, `InfoBar.vue`, `FooterBar.vue`, `HelpContent.vue`, `PrivacyContent.vue`,
`OptionsIndex.vue`, plus `views/README.md`.

### 8.1 — Medium · **FIXED** · `driven/browserAdapter.ts:264` · the system-notification icon path does not resolve

> **Resolved.** The path is now the named constant `NOTIFICATION_ICON_PATH =
> "adapters/ui/assets/icon64.png"` — the same prefix `manifest.json` uses in all
> three of its references — resolved through `browser.runtime.getURL(...)` at the
> call site, so it is absolute and cannot depend on the calling document's
> location. Re-checked against `build/`: that file exists, and there is still no
> `build/assets/` directory.

*Verified against the build output.*

```text
const notificationOption = {
    type: "basic",
    iconUrl: "assets/icon64.png",   // <- resolved relative to the CALLING document
    ...
};
await browser.notifications.create(notificationOption);
```

A relative `iconUrl` resolves against the calling page's URL. The only production caller is
`useImportDialog.ts:89`, running in **`app.html`**, which lives at
`adapters/ui/entrypoints/app.html` — so the icon resolves to
`.../adapters/ui/entrypoints/assets/icon64.png`.

That file does not exist. Checked in `build/`:

- the icon is at `build/adapters/ui/assets/icon64.png`, which is also what `manifest.json`
  references — three times, always with the full `adapters/ui/assets/` prefix;
- there is **no** `build/assets/` directory and no PNG at the build root — `vite.config.js`'s
  static-copy step copies only `icon16.png` to `.`;
- `find build -name "icon64.png"` returns exactly one path, and it is not the one requested.

The user-visible consequence depends on how Firefox handles an unresolvable `iconUrl`: either
the notification appears with a missing or substituted icon, or `notifications.create` rejects
outright ("Unable to load image"). I did not distinguish the two — that needs a live Firefox
run, which this analysis did not do. The second case matters, because the surrounding
`try/catch` logs and swallows the failure, and this notification is the **only** feedback the
import dialog gives for a rejected file — empty, over 64 MB, or not `.json`
(`useImportDialog.ts:63-73`). The file would then vanish from the picker with nothing said.

The fix is the path the manifest already uses — `adapters/ui/assets/icon64.png` — or
`browser.runtime.getURL(...)` for an absolute one that cannot depend on the caller's location.

### 8.2 — Low · `views/HomeContent.vue:191` · the bookings search cannot search the column it shows, and matches hidden numeric fields

*Verified against `node_modules/vuetify/lib/composables/filter.js:49,72`.*

The table binds `:search="search"` but sets no `filter-keys`. Vuetify's `useFilter` then does
`const filterKeys = keys || Object.keys(transformed)` — it filters across **every property of
the raw booking object**. Two consequences:

- **False positives.** Typing `5` matches any booking whose `cID`, `cStockID`,
  `cAccountNumberID`, `cSoliDebit`, `cTransactionTaxCredit`, … contains a 5. Most of those
  fields are not rendered anywhere in the table.
- **The visible booking-type column is not searchable.** The last column renders
  `records.bookingTypes.getNameById(item.cBookingTypeID)` — a name resolved at render time. The
  row itself carries only the numeric `cBookingTypeID`, so searching for "Dividende" matches
  nothing even though the word is on screen.

Binding `:filter-keys="['cBookDate','cDebit','cCredit','cDescription']"` addresses the first
half; the second needs the resolved name on the row, or a `custom-key-filter`.

### 8.3 — Low · `adapters/ui/style.css:24-32` · unscoped `tbody tr` rules make every table permanently light-themed

*Verified.*

```text
tbody tr:nth-of-type(even) { background-color: rgb(224,224,224); color: darkgray; }
tbody tr:nth-of-type(odd)  { background-color: rgb(248,248,248); color: darkgray; }
```

These are global element selectors in a stylesheet loaded by both `app.html` and
`options.html`, so they hit **every** `<tbody><tr>` in the extension — not only the two main
data tables they were written for, but `ShowAccounting`, `ShowDividend`, and anything added
later. They beat Vuetify's `.v-table { background: rgb(var(--v-theme-surface)) }`, which paints
the container and reaches rows only by inheritance.

Two consequences:

1. **The `dark` theme is visibly broken for tables.** The card around the table is `#23222B`
   while the rows inside it are near-white. `CompanyContent.vue:421-448` documents this state
   accurately, as the reason its `color-black` class is safe — so the coupling is known — but
   the appearance itself is not addressed anywhere.
2. **`color: darkgray` (`#A9A9A9`) on `rgb(248,248,248)` is roughly 2.4:1 contrast**, well under
   the 4.5:1 WCAG AA threshold for body text. Every table cell not explicitly overridden
   (`color-black`, `color-red`, `font-weight-bold`) renders at that ratio — including the
   description, ISIN, date and booking-type columns.

With **5.4** (`info: "yellow"`), this is the second low-contrast default in the theme layer.

### Checked and found correct (Round 8)

- **`TitleBar`'s `lastConfirmedAccountId` + `switchInFlight`** — the watcher correctly follows
  the *other three* writers of `settings.activeAccountId` while staying suspended during a
  switch, so a failed switch reverts to what was actually active rather than to the value read
  at component setup.
- **`TitleBar`'s `logoUrl` running through `sanitizeExternalUrl`** — the import path can set
  `cLogoUrl` to any string, and this renders it on every app load for the active account.
- **`TitleBar`'s connectivity probe** — `probeSeq` plus an `AbortController`, with the browser's
  `offline` event treated as authoritative and bumping the sequence first, so an in-flight probe
  cannot report "online" afterwards.
- **`TitleBar`'s account switcher gated on `accounts.items.length > 0`** rather than
  `activeAccountId > 0` — the old test hid the only control that can recover from "accounts
  exist, none active".
- **`HomeContent.onResetStorage`** — re-hydrates via `settings.load()` (deterministic, rather
  than waiting on the async storage-change listener) and adopts the first account instead of
  leaving the user on an unreachable sentinel.
- **The three date cells guarding with `isValidISODate` before `d()`** (`HomeContent`,
  `ShowDividend`, and `CompanyContent`'s own `isValidDate`) — `utcDate("")` is an Invalid Date
  and `Intl.DateTimeFormat.format()` throws `RangeError` on it, which would take out the whole
  table rather than one row.
- **`CompanyContent`'s `hasLoadedOnce` flag** — a dedicated flag rather than inferring "first
  emit" from the previous row set being empty, which is also true after an emit that rendered
  zero rows.
- **`CompanyContent`'s `stocksPerPage` watcher only invalidating** — it used to fetch as well,
  and raced `onCurrentItems`, which aborted it one tick later.

---

## Round 9 — locales, HTML shells, stylesheet, type shims, cross-cutting

Files read: `_locales/{de,en}/{gui,messages}.json`, `entrypoints/{app,options,background}.html`,
`adapters/ui/style.css`, `src/vue-shims.d.ts`, and the 10 `README.md` files under `src/`.
Cross-checked against `vite.config.js`, `manifest.json` and the `build/` output.

Automated checks run:

- `npm run lint:i18n` — passed.
- Key parity across both locale files — `gui.json` has 266 keys in each with no asymmetry in
  either direction; `messages.json` has 16 in each, likewise.
- Every `xx_*` key referenced anywhere in `src/` exists in `messages.json`, and every key in
  `messages.json` is referenced. No orphans in either direction.

### 9.1 — Low · `constants/core.ts:328` · the title-bar logo path is hand-rolled while the same component imports its sibling properly

*Verified against the build output.*

`COMPONENTS.TITLE_BAR.LOGO` is the raw string `"../assets/icon64.png"`, rendered by
`TitleBar.vue:328` as `<img :src="COMPONENTS.TITLE_BAR.LOGO"/>`. Because it lives in a TS
constant rather than an HTML attribute literal, Vite never sees it and never rewrites it — the
browser resolves it at runtime, relative to `app.html`.

It happens to work: `adapters/ui/entrypoints/app.html` plus `../assets/icon64.png` lands on
`adapters/ui/assets/icon64.png`, which exists because `vite.config.js` sets
`assetFileNames: "adapters/ui/assets/[name].[ext]"` — deliberately **without** a content hash.
So the string is correct only while three unrelated settings stay aligned: the entrypoint's
directory depth, `assetsDir`, and the absence of hashing.

`TitleBar.vue:17` already does it the Vite way for the other icon:
`import defaultIcon from "@/adapters/ui/assets/icon48.png"`. Two idioms for one job, one of them
unmanaged — and **8.1** is what the unmanaged idiom looks like when the alignment does not hold.

### 9.2 — High · **FIXED** · cross-cutting · the display currency is derived from the browser's UI language, and only fetched quotes are converted

> **Resolved.** Currency is now a property of the account (`AccountDb.cCurrency`, schema 29)
> with an app-level default (`BROWSER_STORAGE.CURRENCY`), combined by the single
> `resolveDisplayCurrency()` in `domain/logic.ts` that all three consumers read. The
> locale→currency derivation is gone, along with the `CURRENCIES.CODE` map it used, so it cannot
> be reintroduced by accident. Display formatting is patched through
> `plugins/currencySync.ts`, leaving the locale in charge of separators and symbol placement
> only. Consequence 3 (third currencies unconverted) is unchanged and remains deliberate.
> Booking amounts are still stored exactly as entered — see `ARCHITECTURE.md` §12.1 for why
> converting on write was rejected. Verified with `vue-tsc`, `eslint`, `lint:i18n` and 802
> passing unit tests (e2e not run, per the standing preference).

*Original finding, kept for the record:*


*Verified across `browserAdapter.ts:124`, `appAdapter.ts:409-433`,
`useOnlineStockData.ts:179-204`, `plugins/i18n.ts:126`, `stores/portfolio.ts:46`.*

A single input decides every currency question in the app, and it is the browser's UI language:

```text
browserAdapter.getUserLocale()  ->  "de-DE" | "en-US"      (matches on the LANGUAGE subtag only:
        |                                                   "de" -> de-DE, everything else -> en-US)
        |
        +- conversion target   useOnlineStockData.ts:182-200
        |     Intl.Locale(locale).region -> CURRENCIES.CODE.get(region) -> uiCur = EUR | USD
        |     divisor = (!stockCur || stockCur === uiCur) ? 1 : (curUsd | curEur)
        |     mMin / mValue / mMax = toNumber(data.x) / divisor
        |
        +- FX pairs fetched    appAdapter.ts:409-433
        |     getCurrencyFromLocale() -> basePairs ["EURUSD"] (de) or ["USDEUR"] (en)
        |
        +- display formatting  plugins/i18n.ts:126
              numberFormats["de-DE"].currency = EUR   ·   ["en-US"].currency = USD
```

There is no currency key in `BROWSER_STORAGE` and no control for it in `OptionsIndex`, so the
only way a user can change their currency is to change their browser's language. The three
consumers agree with each other, which is why nothing looks wrong in any single file — the
problem is the premise they share.

**Consequence 1 — every eurozone user whose browser is not German is put on USD.** The
language-subtag match correctly rescues `de-AT` and `de-CH` (that was a deliberate earlier fix,
documented at `browserAdapter.ts:107-123`), but `nl-NL`, `fr-FR`, `it-IT`, `es-ES` — and a
German user running an English-language Firefox, which is not unusual — all fall through to
`en-US`. Their EUR-quoted holdings are then divided by the USD/EUR rate and rendered with `$`.

**Consequence 2 — only *fetched* values are converted; *stored* values are not.** `mValue`,
`mMin` and `mMax` go through the divisor. `cDebit`/`cCredit` and everything derived from them
carry no currency at all and are simply formatted with the locale's symbol. The two mix in
`portfolio.active`:

```text
mEuroChange = (mValue ?? 0) * (mPortfolio ?? 0) - (mInvest ?? 0)
              \__ converted to uiCur __/          \__ raw booking amount __/
```

For a German browser both sides are EUR and the arithmetic is sound. For any `en-US` user
booking in euros it subtracts an unconverted EUR figure from a USD one — a wrong number, shown
silently, in a field whose own name asserts EUR.

The clearest symptom is TitleBar's two chips side by side: `sumBookings` (raw booking amounts,
never converted) and `sumDepot` (`calculateTotalDepotValue` over the converted `mValue`). One is
in the user's booking currency and the other in the locale currency, and both are labelled with
the same symbol.

**Consequence 3 — a third currency is not converted at all.** `providerUtils.parseCurrency`
correctly resolves `CAD`/`AUD`/`NZD`/`HKD`/`SGD` rather than mislabelling them USD, but the
divisor chain knows only `USD` and `EUR` and falls through to `1`. Those prices are shown
unconverted under the locale's symbol. This half **is** deliberate and is argued at
`providerUtils.ts:96-107` ("honest, but not a converted price" — proper support needs a rate
per currency), so it is recorded for completeness rather than as a defect.

**On the severity.** This is the register's only High, and it is placed there against this
document's own key — *"wrong financial figures, or a user-facing flow that fails silently"* —
rather than at Medium, because the trigger is not a narrow edge case: it is the default
experience of an entire user population, requires no unusual action, and produces wrong
monetary figures with nothing on screen to indicate it. Consequence 2 affects **any** `en-US`
user who books in euros, not only non-German-language ones.

Worth noting what this is *not*: the two-locale scope (`de`/`en`) is a reasonable decision for
this app. The questionable part is binding **currency** to **UI language**, which are
independent user properties. An explicit currency preference in `BROWSER_STORAGE` +
`OptionsIndex`, defaulting to the locale-derived value, would decouple them; converting stored
booking amounts (or recording a currency per account) is the larger, separate question that
Consequence 2 raises.

### Checked and found correct (Round 9)

- **Locale parity and coverage** — see the automated results above. `AlertOverlay`'s
  `pendingAlerts` count is keyed rather than hardcoded, and phrased with a trailing count so it
  needs no pluralization rules.
- **`app.html` / `options.html` asset links** — `../style.css` and `../assets/icon64.png` are
  HTML attribute literals, so Vite *does* rewrite them; the built output resolves correctly
  (`../../../adapters/ui/assets/style.css`).
- **`background.html`** — deliberately minimal, no stylesheet, matching the small-bundle intent
  `containerBackground.ts` documents.
- **`manifest.json` `host_permissions`** — one entry per provider host actually contacted, plus
  `fx-rate.net`; no wildcard beyond the necessary path suffix, and
  `data_collection_permissions: {required: ["none"]}` is declared.
- **`vue-shims.d.ts`** — standard `*.vue` module declaration, nothing unusual.
