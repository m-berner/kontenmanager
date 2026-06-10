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
- `domain/importExport/`: Domain-level import/export helpers (`transformer.ts`, `validator.ts`).
- `domain/logic.ts`: Pure domain calculations (e.g., depot totals).
- `domain/mapping/`: Data mapping helpers (`formMapper.ts`).
- `domain/types/`: Layer-focused type modules:
    - `domain.ts` — persisted domain records.
    - `adapter.ts` — adapter/repository/DB-payload types.
    - `backup.ts` — legacy and modern backup file shapes.
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

### `adapters/driven/` — Service-facing adapters

- `adapters/driven/database/`: IndexedDB persistence engine with connection management, transaction orchestration,
  migration logic, and per-entity repositories under `database/repositories/`.
- `adapters/driven/fetch/`: Network I/O layer with per-provider scrapers under `fetch/providers/`, shared HTTP
  utilities (`httpClient.ts`, `httpCache.ts`), and provider helpers (`providerUtils.ts`).
- `adapters/driven/*Adapter.ts`: Individual adapter implementations (app, alert, browser, favicon, importExport,
  storage, task, validation).

## How Things Fit Together

- UI (`adapters/ui/views/`, `adapters/ui/components/`) reads/writes state via `adapters/ui/stores/`,
  uses `adapters/ui/composables/` for UI helpers, and calls `app/usecases/` for multistep workflows.
- `adapters/driven/` adapters perform I/O (IndexedDB, network, file download, etc.) and call into `domain/` for
  rules/validation.
- `domain/` defines stable rules and helper logic (including `AppError` + `ERROR_DEFINITIONS`).
- All adapters are wired via `adapters/container.ts` / `adapters/containerBackground.ts` and exposed to Vue via
  `adapters/context.ts`.

## Useful Commands (from repo root)

- TypeScript: `npm run test:typescript`
- Unit tests: `npm run test:logic`
- Lint: `npm run lint`
- Build: `npm run build:dev` / `npm run build:prod`