# Add Account — File-by-File Walkthrough

This document traces what happens, file by file, when a user adds a bank account. It is
the more involved of the account flows: unlike a booking or a booking type, creating an
account can also seed default booking types and always switches the active account —
three writes coordinated as one operation.

See also: [Edit Account](edit-account.md) · [Delete Account](delete-account.md)

## Quick file map

| Layer                  | File                                                                                                   | Role                                                                                            |
|------------------------|--------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Entry point            | `/src/adapters/ui/views/HeaderBar.vue`                                                                 | Renders the **Add Account** toolbar button                                                      |
| Action wiring          | `/src/adapters/ui/composables/useHeaderBarActions.ts`                                                  | Opens the dialog (no active-account guard needed — this is how the first account gets created)  |
| Dialog host            | `/src/adapters/ui/components/DialogPort.vue`                                                           | Teleports the dialog into a `v-dialog`, owns OK/Cancel                                          |
| Dialog registration    | `/src/adapters/ui/plugins/components.ts`                                                               | Maps `"addAccount"` to `AddAccount.vue`                                                         |
| Dialog component       | `/src/adapters/ui/components/dialogs/AddAccount.vue`                                                   | Builds the payload, calls the usecase, shows feedback                                           |
| Form fields            | `/src/adapters/ui/components/dialogs/forms/AccountForm.vue`                                            | SWIFT, IBAN, currency, depot switch, logo URL (favicon auto-fill)                               |
| Form state             | `/src/adapters/ui/composables/useForms.ts` (`createAccountFormManager`)                                | Reactive `accountFormData`, seeded with the user's app-level default currency                   |
| Field-level validation | `/src/adapters/ui/validationAdapter.ts`                                                                | `swiftRules`, `ibanRules` (checksum + duplicate check on add)                                   |
| Form → DB mapping      | `/src/domain/mapping/formMapper.ts` (`mapAccountFormToDb`)                                             | Normalizes SWIFT/IBAN casing, trims the logo URL                                                |
| Usecase                | `/src/app/usecases/accounts.ts` (`addAccountUsecase`)                                                  | Transactional account + default-booking-types write, active-account switch, rollback on failure |
| Port adapter           | `/src/app/usecases/portAdapters.ts` (`toRecordsPort`, `toSettingsPort`, `setActiveAccountIdPersisted`) | Store validation + persisted active-account id                                                  |
| Repository             | `/src/adapters/driven/database/repositories/accountRepository.ts`                                      | Persists to IndexedDB; omits a blank IBAN rather than storing `""`                              |
| Record validation      | `/src/domain/validation/validators.ts` (`validateAccount`)                                             | Normalizes/whitelists the record                                                                |
| Pinia store            | `/src/adapters/ui/stores/accounts.ts` (`useAccountsStore`)                                             | In-memory reactive account list                                                                 |

## Step by step

### 1. Opening the dialog

`HeaderBar.vue`'s **Add Account** button dispatches to `useHeaderBarActions.ts`'s
`addAccount` handler:

```ts
addAccount: () => {
    openDialog("addAccount");
},
```

No `hasActiveAccount` guard here — unlike every other header-bar action for an
account-scoped entity, adding an account is exactly how a user with *zero* accounts gets
their first one.

### 2. The form — `AccountForm.vue`

Rendered with `:isUpdate="false"`. Notable fields:

- **Currency** — a plain `v-select` over `CURRENCIES.SUPPORTED`, seeded from
  `settings.currency` (the app-level default) rather than a hardcoded constant, so a new
  account starts on the currency the user actually uses. This is the currency the
  account's bookings are recorded in and its quotes are converted into — currency is
  account-scoped, never derived from locale, and booking amounts are never converted on
  write.
- **SWIFT** — `validationAdapter.swiftRules`, auto-uppercased and stripped of whitespace
  on every keystroke (`onUpdateSwift`), with a live grouped-4-character label suffix for
  readability.
- **IBAN** — same auto-clean/group treatment. On the **add** path only,
  `ibanRules` runs a checksum check *and* a duplicate check against every other stored
  account's IBAN (`records.accounts.isDuplicate`, backed by
  `domain/validation/duplicates.ts`'s `isDuplicateAccountIban`). This is the one dialog
  where that duplicate check runs at all — see [Edit Account](edit-account.md) for why
  it's absent there.
- **Logo URL** — a `search` field feeds `useUrl`/`useFavicon`, which resolves a favicon
  for the typed domain and writes it into `accountFormData.logoUrl` after a 400 ms debounce
  once it loads successfully.
- **Depot switch** (`withDepot`) — if on, three default booking types (Buy/Sell/Dividend)
  are created alongside the account (step 4).

### 3. Clicking OK

Same `submitGuard` shape as every other dialog (`errorContext: "ADD_ACCOUNT"`). Inside
`operation`:

```ts
const accountData = mapAccountFormToDb();
await addAccountUsecase(
    {databaseAdapter, repositories, records: toRecordsPort(records), settings: toSettingsPort(settings), runtime, setStorage},
    {
        accountData,
        withDepot: accountFormData.withDepot,
        bookingTypeLabels: {buy: t(...), sell: t(...), dividend: t(...)},
        initMessages: {title: t(...), message: t(...)}
    }
);
```

`mapAccountFormToDb` (`formMapper.ts`) uppercases/trims `cSwift` and `cIban`, trims
`cLogoUrl`, and carries `cCurrency`/`cWithDepot` straight through. The booking type *labels* are passed as localized
strings (translated at the call site, not inside the
usecase, since the usecase layer has no `t()`), because `addAccountUsecase` may need to
create Buy/Sell/Dividend-named types from scratch.

### 4. The usecase — `addAccountUsecase`

`/src/app/usecases/accounts.ts`'s `addAccountUsecase` is the most involved of the account
usecases. It runs in three phases:

**Phase 1 — one IndexedDB transaction** (`databaseAdapter.transactionManager.execute`,
spanning both the `accounts` and `bookingTypes` object stores):

1. `repositories.accounts.save(accountData, {tx})` — the new account.
2. If `withDepot`, `createDefaultBookingTypes(...)` seeds the account's Buy/Sell/Dividend
   types — each stamped with an explicit `cRole`, not left to auto-increment order, since
   role (not id or label) is what portfolio/invest/dividend calculations resolve against
   (see [Add Booking](add-booking.md) — a booking's role-conditional fields come from
   exactly this `cRole`). Both writes share the transaction so a mid-loop booking-type
   save failure can't leave the account persisted as depot-enabled with a partial,
   duplicable role set.

**Phase 2 — update in-memory stores** (outside the transaction, since Pinia state isn't
transactional):

3. `records.accounts.add({...accountData, cID: result.accountId})`.
4. `records.clean(false)` — clears whatever bookings/bookingTypes/stocks belonged to the *previously* active account,
   since they're about to be replaced by the new account's (empty) data.
5. Adds each created booking type to the store, then seeds the placeholder "no stock" row (`createPlaceholderStock`)
   that `BookingForm.vue`'s stock picker relies on for a blank
   option — every other populator of the stocks store (`initializeRecords`, used by
   switch/delete/import/boot) does the same seeding, so a booking added immediately after
   creating this account (before the next switch/reload) still has that blank entry to
   select.

**Phase 3 — switch the active account, with rollback on failure**:

6. `setActiveAccountIdPersisted(deps, result.accountId)` — writes the new account id to
   `browser.storage.local` (the display currency also follows the active account, since
   currency is account-scoped).
7. **If that persist fails**, the account and its default booking types are already
   committed to IndexedDB and the in-memory store — so the usecase actively unwinds both:
   removes the new account from `records.accounts`, calls `records.clean(false)` again,
   deletes it from IndexedDB (`deleteAccountRecords`), and re-initializes the record
   stores from whatever account *was* previously active (read fresh from IndexedDB,
   since step 4 already wiped it from memory). The original error is re-thrown after
   cleanup so the caller still sees the real failure.
8. On success, `runtime.resetTeleport()` closes the dialog.

### 5. Persisting — `accountRepository.ts` and `validateAccount`

`accountRepository.ts`'s `save` runs `validateAccount` (whitelists/normalizes the
record), then has one extra step beyond every other repository's `save`:

```ts
const toPersist: AccountDb = {...validated};
if (toPersist.cIban?.trim() === "") {
    delete toPersist.cIban;
}
```

`accounts_uk1` (the IBAN unique index) is **global**, not account-scoped — unlike the
stocks table's per-account unique indexes — and IndexedDB indexes an explicit `""` as a
real, colliding value. Persisting a blank IBAN as `""` for a second account would throw a
raw `ConstraintError`; omitting the key entirely (rather than storing an empty string)
keeps it out of the index altogether. `AccountForm`'s own `ibanRules` require a
checksum-valid IBAN on the add path, so this mainly matters for non-form callers (import)
and for the fact that `validateAccount` itself only *logs a warning* on a bad checksum
rather than rejecting it.

### 6. Store consistency

Exactly the pattern documented in [Add Booking](add-booking.md) §8: `toRecordsPort`
wraps `records.accounts.add`/`update` with a second `validateAccount` pass, so the
in-memory store can never diverge from what the repository actually wrote to IndexedDB.

## Sequence diagram

```mermaid
sequenceDiagram
    actor U as User
    participant HB as HeaderBar.vue
    participant DP as DialogPort.vue
    participant AA as AddAccount.vue
    participant AF as AccountForm.vue
    participant DG as submitGuard
    participant FM as formMapper
    participant UC as addAccountUsecase
    participant TX as IndexedDB transaction
    participant PA as toRecordsPort
    participant AccSt as accounts store
    participant BTSt as bookingTypes store
    participant Set as setActiveAccountIdPersisted

    U->>HB: click "Add Account"
    HB->>DP: setTeleport(addAccount)
    DP->>AA: mount <addAccount>
    U->>AF: fill SWIFT / IBAN / currency / withDepot
    U->>DP: click OK
    DP->>AA: onClickOk()
    AA->>DG: submitGuard({formRef, operation})
    DG->>AA: operation()
    AA->>FM: mapAccountFormToDb()
    AA->>UC: addAccountUsecase({accountData, withDepot, ...})
    UC->>TX: accounts.save(accountData)
    alt withDepot
        UC->>TX: createDefaultBookingTypes(Buy/Sell/Dividend)
    end
    TX-->>UC: {accountId, createdTypes}
    UC->>PA: accounts.add({...accountData, cID})
    PA->>AccSt: add(account)
    UC->>PA: clean(false) — clear stale bookings/types/stocks
    UC->>PA: bookingTypes.add(bt) for each created type
    PA->>BTSt: add(bt)
    UC->>PA: stocks.add(placeholderStock)
    UC->>Set: setActiveAccountIdPersisted(accountId)
    alt persist fails
        UC->>PA: accounts.remove(accountId); clean(false)
        UC->>UC: deleteAccountRecords(accountId)
        UC->>PA: init(previousAccountData)
        UC-->>AA: throw
    else success
        UC->>UC: runtime.resetTeleport()
        UC-->>AA: {accountId, createdBookingTypes}
    end
    AA->>U: success toast — dialog closes
```

## Related documents

- [Edit Account](edit-account.md) · [Delete Account](delete-account.md)
- [Add Booking Type](add-booking-type.md) — the same `createDefaultBookingTypes` helper
- [`/src/app/usecases/README.md`](/src/app/usecases/README.md) §2.1
- `/tests/e2e/dialog-actions.spec.ts` — `addAccount: creates a new account and switches to it`
