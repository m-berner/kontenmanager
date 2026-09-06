# Kontenmanager

A modern WebExtension for private account management and stock portfolio tracking.

## Overview

Kontenmanager is a powerful browser extension (primarily targeting Firefox) designed to help users manage their private accounts and investments. It provides a sophisticated user interface for tracking financial records, managing companies/accounts, and viewing detailed accounting and dividend analytics.

Key features include:
- **Multi-Account Management:** Track different bank accounts or portfolios separately.
- **Stock Portfolio Tracking:** Real-time market data integration (via external services).
- **Accounting Tools:** Automated calculation of balances, taxes, and fees.
- **Data Privacy:** All data is stored locally in your browser using IndexedDB.
- **Data Portability:** Robust JSON-based import and export system for backups.

## Stack

- **Language:** [TypeScript](https://www.typescriptlang.org/) (Strictly typed)
- **Framework:** [Vue 3](https://vuejs.org/) (Composition API)
- **UI Component Framework:** [Vuetify 3](https://vuetifyjs.com/) (Material Design)
- **State Management:** [Pinia](https://pinia.vuejs.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Database:** [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (via DI-provided `databaseAdapter`)
- **Package Manager:** [npm](https://www.npmjs.com/) (v11.12.0, pinned via `packageManager` in `package.json`)

## Requirements

- **Node.js:** v24.0.0 or later
- **Package Manager:** npm v11.12.0 or later

## Quick Start

### Installation

```powershell
npm install
```

### Build (Development package)

```powershell
npm run build:dev
```

> Note: `.env.development` / `.env.production` are optional in the sense that `vite.config.js`
> falls back to defaults (`BUILD_DIR=build`, `EXTENSIONS_DIR=..`, `RELEASE_DIR=extensions`)
> so a build won't hard-fail without one. Without an `.env` file the built extension ends up at
> `kontenmanager@gmx.de/` in the repo root (`..` relative to `build.outDir`, which
> `vite-plugin-static-copy` resolves the `dest` against). In this repo `.env.development`/
> `.env.production` are still meant to be kept: `EXTENSIONS_DIR` is set to an *absolute* path — a
> local Firefox profile's `extensions/` folder (without a trailing `kontenmanager@gmx.de` segment —
> `vite.config.js` appends that itself) — so a build is copied straight there instead, and
> `.env.production`'s `RELEASE_DIR` is what makes the release `.xpi` land in `releases/firefox/`,
> which `npm run lint:addon` depends on (`addons-linter ./releases/firefox/kontenmanager@gmx.de.xpi`
> is a fixed path). Removing `.env.production` would silently break `lint:addon`.
>
> `npm run test:e2e` doesn't rely on either fallback: it forces
> `EXTENSIONS_DIR=../test-app` for its `build:dev` step (via `cross-env` in `package.json`),
> landing the build at `<repo-root>/test-app/kontenmanager@gmx.de/`. Every e2e spec resolves that
> path through `getBuildDir()` in `tests/e2e/support/harness.ts` rather than hardcoding it — update
> that one helper if the e2e build location ever moves again.

What this does:
- Runs Vue SFC/TypeScript checks (`vue-tsc`).
- Bundles the extension with Vite.
- Copies static assets and creates a ready-to-load extension under `EXTENSIONS_DIR/kontenmanager@gmx.de/`
  (a local Firefox profile's `extensions/` folder if `.env.development` sets one, otherwise the repo
  root).
- Produces a zipped `.xpi` in `releases/` when environment variables are provided (see `vite.config.js`).

Build production package:

```powershell
npm run build:prod
```

Load the `kontenmanager@gmx.de/` folder (under `EXTENSIONS_DIR`) as a temporary addon in Firefox (about:debugging → This Firefox → Load Temporary Add-on... → select any file within that folder). With `.env.development` pointing at your Firefox profile's `extensions/` folder, Firefox picks up the build there automatically instead.

### Test

```powershell
npm run test:unit
```

Type-check with Vue/TypeScript:

```powershell
npm run test:typescript
```

### Lint i18n

```powershell
npm run lint:i18n
```

## Project Structure

The project follows a hexagonal (ports & adapters) architecture. Dependencies point inward:
`adapters → app → domain`. See [src/README.md](src/README.md) for the full layer breakdown.

- `src/`: Core source code.
  - [**`domain/`**](src/domain/README.md): The "Brain" — pure business logic, financial calculations, validation, and data mapping. No framework dependencies.
  - [**`app/usecases/`**](src/app/usecases/README.md): Application-layer workflows (multistep operations used by dialogs/views), expressed against port interfaces.
  - [**`adapters/ui/`**](src/adapters/ui/README.md): Vue-facing layer.
    - [`components/`](src/adapters/ui/components/README.md): Reusable UI components, dialogs, and form fragments.
    - [`views/`](src/adapters/ui/views/README.md): Main screen layouts and route targets.
    - [`composables/`](src/adapters/ui/composables/README.md): Vue composition functions bridging UI to stores/adapters.
    - [`stores/`](src/adapters/ui/stores/README.md): Pinia state management (Records, Settings, Runtime, Alerts).
    - [`plugins/`](src/adapters/ui/plugins/README.md): Vue plugin configurations (Vuetify, i18n, Router, Pinia).
    - [`entrypoints/`](src/adapters/ui/entrypoints/README.md): HTML/TS entry points for the extension (App, Background, Options).
    - `_locales/`: Translations (`messages.json` for WebExtension i18n, `gui.json` for Vue i18n).
  - [**`adapters/driven/`**](src/adapters/driven/README.md): Infrastructure adapters — [`database/`](src/adapters/driven/database/README.md) (IndexedDB), `fetch/` (market data providers), plus browser, storage, alert, favicon, app, and task adapters.
  - `adapters/container.ts` / `containerBackground.ts`: Composition roots — the only files allowed to import concrete adapter implementations.
- `build/`: Raw Vite build output (JS bundles, manifest, `_locales/`, assets) at a fixed,
  in-repo path (`BUILD_DIR`, default `build`). This is the stable location every other build
  step reads from: `emptyOutDir` safely wipes and rebuilds it on every run (it's inside the
  project, so Vite's overwrite-protection doesn't kick in), and `zipPack` reads from it to
  produce the release `.xpi`. Not loadable by Firefox directly — it's missing the
  addon-ID-named folder Firefox expects.
- `kontenmanager@gmx.de/`: A copy of `build/`'s contents, written by a `vite-plugin-static-copy`
  step to `EXTENSIONS_DIR/kontenmanager@gmx.de/` (folder named after the addon's Gecko ID from
  `manifest.json`). Where `EXTENSIONS_DIR` points depends on context:
  - **Local dev** (`.env.development` sets an absolute path): a local Firefox profile's
    `extensions/` folder, so Firefox picks up new builds automatically.
  - **Plain `npm run build:dev` / `build:prod` with no `.env` present**: the repo root (`..`
    default).
  - **`npm run test:e2e`**: `EXTENSIONS_DIR` is forced to `../test-app`
    (via `cross-env`, regardless of any `.env`), so the build lands at
    `test-app/kontenmanager@gmx.de/` — which is where `getBuildDir()` in
    `tests/e2e/support/harness.ts` expects to find it to serve over HTTP for Playwright.

  Kept as a separate copy step (rather than pointing Vite's `outDir` straight at
  `EXTENSIONS_DIR`) because `EXTENSIONS_DIR` can be an absolute path *outside* the repo (a
  Firefox profile). Letting Vite's `emptyOutDir` wipe that directly would be one config typo
  away from deleting unrelated files outside the project.
- `releases/`: Packaged `.xpi` files for distribution.

## Documentation

- Architecture guide: [src/README.md](src/README.md#architecture)
- Detailed workflows: [src/app/usecases/README.md](src/app/usecases/README.md#workflows)

## Architecture & Data Flow

1. **User Interaction:** Vue components in `src/adapters/ui/views/` or `src/adapters/ui/components/` capture user input.
2. **Application Workflows:** Multi-step operations live in `src/app/usecases/` (dialogs/views call usecases).
3. **State Management:** UI and usecases interact with **Pinia Stores** (`src/adapters/ui/stores/`).
4. **Persistence:** Data is persisted via DI-provided **Adapters** and **Repositories** (`src/adapters/driven/`, `src/adapters/driven/database/`) to **IndexedDB** and **Browser Storage** (`storageAdapter`).
5. **Browser Integration:** WebExtension API access is abstracted behind DI-provided adapters (for example `browserAdapter`).

## Development Workflow

1. Make changes in `src/`.
2. Run tests locally to validate logic:
   - Unit tests focus on domain utilities and Pinia stores.
3. Build the extension with `npm run build:dev` (or `npm run build:prod`).
4. Reload the temporary addon in Firefox and verify behavior in the Browser Console.

## Development Conventions

### Architecture

Firefox WebExtension (Manifest V3) using a hexagonal (ports & adapters) architecture.

- **Domain logic**: `src/domain/` — pure functions, no framework dependencies
- **Use cases**: `src/app/usecases/` — orchestrate domain + adapters
- **UI adapters**: `src/adapters/ui/` — Vue 3 components, Pinia stores, composables
- **Driven adapters**: `src/adapters/driven/` — IndexedDB, fetch, browser APIs

Three isolated JS contexts: **app** (popup), **background** (service worker), **options page**.

### Critical Conventions

#### DB-first ordering in use cases

**All IndexedDB writes must complete before Pinia store mutations.**

```ts
// CORRECT
await deps.repositories.bookings.save(booking);
deps.records.bookings.update(booking);

// WRONG — if the DB write fails, the store is desynchronised
deps.records.bookings.update(booking);          // store mutated
await deps.repositories.bookings.save(booking); // DB might fail
```

This applies to every use case operation: add, update, delete. The same rule applies in
composables that call repositories directly (e.g. `useMenu.ts`).

**Rationale**: A failed DB write cannot be easily rolled back from Pinia. DB-first means
a failure leaves the store in the old (still-correct) state, and the error surfaces to
the user before the UI reflects phantom data.

#### Always await `records.init()`

`records.init()` is **async** — it calls `initRecordsUsecase` which sorts and hydrates all
Pinia stores. Forgetting the `await` leaves stores unpopulated when the next line runs.

```ts
// CORRECT
await deps.records.init(storesDB, messages);

// WRONG — stores not yet populated when execution continues
deps.records.init(storesDB, messages);
```

#### AbortSignal propagation

Every long-running fetch operation must accept and forward an `AbortSignal` so it can be
canceled on component unmount or user navigation.

- `loadOnlineData(page, {signal})` — always pass the signal from the calling context
- `refreshOnlineData(page, {signal})` — same
- Callers that own the AbortController must abort it in `onBeforeUnmount` / `onUnmounted`

Pattern used in `CompanyContent.vue`:

```ts
runtime.beginDownload();
runtime.beginStockLoading();
const signal = startOnlineLoad(); // aborts previous, returns new signal
try {
    await loadRequiredPages(startPage, signal);
} catch (err) {
    if (!isAbortError(err)) await alertAdapter.feedbackError(/* ... */);
} finally {
    runtime.endStockLoading();
    runtime.endDownload();
}
```

#### Loading-state guards use ref-counting, not a signal check

`runtime.isStockLoading` / `runtime.isDownloading` are backed by ref counters
(`stockLoadingRefCount`, `downloadRefCount` in `stores/runtime.ts`), not a plain boolean.
Multiple independent callers (header-bar refresh, per-row quote update, a page's own
`onBeforeMount` sweep) can each have a fetch in flight at once; a plain boolean would let
whichever call finishes first clear the flag while another is still running, making the
spinner disappear prematurely.

Always pair `beginStockLoading()`/`beginDownload()` with exactly one matching
`endStockLoading()`/`endDownload()`, called **unconditionally** in a `finally` block — no
`if (!signal.aborted)` guard is needed or correct here, since decrementing the counter (rather
than assigning a boolean) is what already makes overlapping callers safe. A stale write from a
superseded fetch is instead prevented one layer down, by `runtime.stocksPageGeneration` (see
`useOnlineStockData.loadOnlineData`'s generation check before it writes fetched data back).

### IndexedDB

- Managed via `connectionManager` → `transactionManager` → `baseRepository`
- `connectingPromise` in `connectionManager` serialises concurrent `connect()` calls
- `atomicImport` in `batchOperations` writes multiple stores in one transaction (ACID)
- Schema migrations live in `migrator.ts`; every migration is guarded with
  `if (oldVersion < N)` and `if (!store.indexNames.contains(...))` to be idempotent

### FIFO Investment Calculation

`calculateInvestByStockId` in `logic.ts` computes cost basis under FIFO by iterating
BUY bookings **newest-first** (as stored in Pinia after `initializeRecords` sorts them
by `cBookDate` DESC) and prorating the boundary lot:

```ts
sort((a, b) => compareIsoDateDesc(a.cBookDate, b.cBookDate))
.reduce((acc, entry) => {
    const prev = runningCount;
    runningCount += entry.cCount;
    if (prev >= totalPortfolio || entry.cCount === 0) return acc;
    const used = Math.min(entry.cCount, totalPortfolio - prev);
    return acc + (used / entry.cCount) * entry.cDebit;
}, 0);
```

The explicit `.sort()` makes the function correct regardless of input order. It calls the dedicated
`compareIsoDateDesc` comparator (`domain/utils/utils.ts`) rather than the more obvious
`utcMs(b.cBookDate) - utcMs(a.cBookDate)`: `utcMs("")` is `NaN` (a blank `cBookDate` reaches here via
backup import — `normalizeDate` deliberately yields `""` for a missing/malformed date rather than
inventing one), and a comparator that can return `NaN` doesn't just misplace that one row — it makes
the sort order of the *entire array* engine-dependent and arbitrary, silently attributing the FIFO
cost basis to the wrong lots.

## Tests

The project uses [Vitest](https://vitest.dev/) for unit testing, focusing on domain logic and store state.

To run the tests:

```powershell
npm run test:unit
```

## Linting & Formatting

- ESLint with TypeScript and Vue rules (`eslint.config.js`).
- i18n dictionaries are verified via custom scripts under `scripts/`.

Use:

```powershell
npm run lint
```

## Packaging & Verification

- The Vite config supports copying built artifacts into the extension directory and optionally zipping a release.
- To verify a packaged Firefox extension, run:

```powershell
npm run lint:addon
```

This uses Mozilla's `addons-linter` against `./releases/firefox/kontenmanager@gmx.de.xpi`.

### Known Addons-Linter Warnings

`addons-linter` may report `UNSAFE_VAR_ASSIGNMENT` for `innerHTML` assignments in the generated bundle (currently `style.js` inside the packaged `.xpi`).

- Scope: This is build output, not source (`src/`). The line numbers can change between builds.
- Why it happens: some runtime/style injection code writes HTML (commonly emitted by bundlers/frameworks/UI libs).
- Action: treat this as a release checklist item and confirm that no untrusted user input can reach the injected HTML.
- Action: if you want the warning to go away, you need to change the generated output by adjusting the upstream source (e.g. framework/plugin behavior) or the build pipeline. There is nothing actionable to "fix" in `src/` if it is purely emitted code.

## npm Scripts

- `npm run build:dev`: Build extension in development mode.
- `npm run build:prod`: Build extension in production mode.
- `npm run lint`: Run ESLint for `src/` (`.ts` and `.vue`).
- `npm run lint:i18n`: Lint i18n dictionaries.
- `npm run test:unit`: Run Vitest unit tests.
- `npm run test:typescript`: Run Vue/TypeScript type checks.
- `npm run test:e2e`: Build (`build:dev`) and run Playwright E2E tests (all specs, one config).
- `npm run test:e2e:headed` / `test:e2e:ui`: Run Playwright E2E tests headed / in UI mode (reuses the existing build, no rebuild).
- `npm run lint:addon`: Run Mozilla addons linter for the packaged `.xpi`.

## Developer Information

- [MDN WebExtensions Documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [Vue 3 Documentation](https://vuejs.org/guide/introduction.html)
- [Vuetify 3 Documentation](https://vuetifyjs.com/en/introduction/why-vuetify/)

## License

This project is licensed under the **Mozilla Public License 2.0**. See the [LICENSE](LICENSE) file for details.

## Troubleshooting

- Tests cannot resolve `@/...` imports: ensure Vite alias is configured (already set in `vite.config.js`).
- DOM-related tests: use the `happy-dom` environment provided by Vitest config.
- Duplicate BookingType detection: names are normalized (trimmed, collapsed whitespace) via `normalizeBookingTypeName` in `src/domain/validation/validators.ts`.
