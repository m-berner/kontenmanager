# IndexedDB ↔ Repositories ↔ Stores ↔ "memory copies"

How persistence and reactive state relate in this codebase, from lowest to highest layer.

## 1. IndexedDB — the actual persistence

The browser's on-disk database. Nothing in the app touches it directly except the
database adapter layer in `src/adapters/driven/database/`:

- `connectionManager.ts` opens/closes the raw `IDBDatabase` connection.
- `migrator.ts` (`setupDatabase`) creates object stores and indexes on version upgrade
  (accounts, bookings, bookingTypes, stocks — see `INDEXED_DB.STORE.*`).
- `transactionManager.ts` wraps `IDBTransaction` with timeout/progress handling.
- `databaseAdapter.ts` (`createDatabaseAdapter`) is the facade over all of the above,
  exposed via DI as `useAdapters().databaseAdapter`.

IndexedDB is the single source of truth for everything that must survive a reload.

## 2. Repositories — typed CRUD over IndexedDB

`src/adapters/driven/database/repositories/` (`accountRepository.ts`,
`bookingRepository.ts`, `bookingTypeRepository.ts`, `stockRepository.ts`, all built on
`baseRepository.ts`'s `createBaseRepository`).

- One repository per IndexedDB object store ("entity").
- Each wraps raw `IDBObjectStore`/`IDBIndex` calls (`get`, `getAll`, `put`, `add`,
  `delete`, cursor scans) behind `findById`, `findAll`, `findBy`, `save`, `delete`,
  `count`, `countBy`.
- Every operation runs inside a transaction, either one it opens itself via
  `transactionManager.execute`, or a caller-supplied `tx` (so several repository calls
  can share one atomic IndexedDB transaction — see `addAccountUsecase` writing both
  `accounts` and `bookingTypes` under one `tx`).
- Repositories are stateless: they hold no data between calls, only the
  `storeName`/`indexes` they were built for. Every call reads or writes IndexedDB fresh.

This is the "database" layer proper — it never touches Pinia.

## 3. Stores (Pinia) — the reactive "memory copy"

`src/adapters/ui/stores/` (`accounts.ts`, `bookings.ts`, `bookingTypes.ts`, `stocks.ts`,
plus `settings.ts`, `runtime.ts`, `alerts.ts`, and the derived `accounting.ts` /
`portfolio.ts`, orchestrated by `recordsHub.ts`).

- Hold the **in-memory, reactive copy** of whatever the active account's data looks
  like — plain arrays/objects wrapped in Pinia reactivity, not a cache with its own
  invalidation logic. Components read and render from stores, never from IndexedDB
  directly.
- A leaf store's mutators (`add`, `update`, `remove`, `init`, `clean`) only ever change
  the in-memory array — they contain **no IndexedDB calls themselves**.
- Aggregation stores (`accounting`, `portfolio`) hold no persistent state of their own;
  they're pure `computed`-style derivations over the leaf stores (e.g. portfolio value
  from `stocks` + `bookings` + `settings`).
- Hydration: `recordsHub.init(...)` → `initRecordsUsecase` (`src/app/usecases/records/init.ts`)
  → `initializeRecords` (domain logic) fills the leaf stores from a `RecordsDbData`
  snapshot that was read out of IndexedDB via the repositories/database adapter
  (`getAccountRecords`). This happens on app boot and on every account switch/delete.

## 4. Usecases — the layer that keeps the two in sync

`src/app/usecases/*.ts` is where repositories and stores actually meet. A store never
calls a repository, and a repository never touches a store — usecases are the only
place both are injected together (see `AddAccountUsecaseDeps` etc. in
`src/app/usecases/accounts.ts`).

The pattern, e.g. `addAccountUsecase`:

1. Open one IndexedDB transaction via `databaseAdapter.transactionManager.execute`.
2. Call one or more `repositories.<entity>.save(...)` inside it — this is the durable
   write.
3. Only **after** the transaction resolves, call the matching `deps.records.<entity>.add/
   update/remove(...)` — this updates the Pinia "memory copy" so the UI reflects it
   immediately, without a re-read from IndexedDB.
4. On failure after the DB write but before the store update (or vice versa), the
   usecase explicitly rolls back both sides (see the `try/catch` in
   `addAccountUsecase` that removes the just-added account from both the store and
   IndexedDB on a later failure).

So "memory copy" = the Pinia store's reactive state, deliberately kept a step behind
IndexedDB writes by construction (DB commit happens first, store mutation second,
same call) rather than being derived from it live. Nothing subscribes to IndexedDB
changes — the only way the store and the DB can disagree is a bug in one of these
usecases forgetting to update both, or two tabs writing independently (which is why
the app enforces a single app tab — see memory `audit_progress_2026_07.md`).

## Summary diagram

```
Component (Vue)
     │ reads/renders
     ▼
Pinia store (accounts.ts, bookings.ts, ...)   <-- reactive "memory copy"
     ▲ add/update/remove (in-memory only)
     │
Usecase (src/app/usecases/*.ts)               <-- the only layer touching both
     │ save/delete (awaited first)
     ▼
Repository (accountRepository.ts, ...)        <-- typed CRUD, stateless
     │ IDBTransaction / IDBRequest
     ▼
IndexedDB                                     <-- durable source of truth
```