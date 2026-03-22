# Source Root (`src/`)

This folder contains the full WebExtension application: Vue UI, domain logic, infrastructure services, and localized
strings.

The project uses the `@` path alias for `src/` (example: `@/adapters/secondary/alert`).

## Layout

The source is organized into three layers:

### `domain/` — Pure business logic

- `domain/`: Business logic, validation, mapping, and error definitions.
- `domain/constants/`: Static configuration and stable identifiers used across layers.
- `domain/constants.ts`: Barrel re-export for constants.
- `domain/types/`: Layer-focused type modules (`domain`, `infra`, `backup`).
- `domain/types.d.ts`: Public type surface (re-exports) used via `@/domain/types`.

### `app/` — Application orchestration

- `app/usecases/`: Multi-step workflows called by dialogs and views.
- `adapters/primary/stores/`: Pinia state stores.

### `adapters/primary/` — UI-facing adapters

- `adapters/primary/components/`: Reusable UI components and dialogs.
- `adapters/primary/views/`: Top-level screens (route targets and layout shells).
- `adapters/primary/composables/`: Vue composables for UI-facing orchestration.
- `adapters/primary/stores/`: Pinia state stores.
- `adapters/primary/plugins/`: Vue plugin setup (Vuetify, Pinia, Router, i18n, themeSync, global components).
- `adapters/primary/entrypoints/`: HTML + TS entry points for app/options/background.
- `adapters/primary/assets/`: Static assets bundled by Vite.
- `adapters/primary/_locales/`: Translations (`messages.json` for WebExtension i18n, `gui.json` for Vue i18n).
- `adapters/primary/style.css`: Global styles.

### `adapters/secondary/` — Service-facing adapters

- `adapters/secondary/services/`: Side-effectful infrastructure (IndexedDB, fetch, browser APIs, import/export, alerts).

## How Things Fit Together

- UI (`adapters/primary/views/`, `adapters/primary/components/`) reads/writes state via `adapters/primary/stores/`,
  uses `adapters/primary/composables/` for UI helpers, and calls `app/usecases/` for multi-step workflows.
- `adapters/secondary/services/` perform I/O (IndexedDB, network, file download, etc.) and call into `domain/` for
  rules/validation.
- `domain/` defines stable rules and helper logic (including `AppError` + `ERROR_DEFINITIONS`).

## Useful Commands (from repo root)

- TypeScript: `npm run test:typescript`
- Unit tests: `npm run test:logic`
- Lint: `npm run lint`
- Build: `npm run build:dev` / `npm run build:prod`
