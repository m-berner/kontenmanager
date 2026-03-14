# Source Root (`src/`)

This folder contains the full WebExtension application: Vue UI, domain logic, infrastructure services, and localized
strings.

The project uses the `@` path alias for `src/` (example: `@/services/alert`).

## Layout

- `assets/`: Static assets bundled by Vite.
- `_locales/`: Translations (`messages.json` for WebExtension i18n, `gui.json` for Vue i18n).
- `entrypoints/`: HTML + TS entry points for app/options/background.
- `plugins/`: Vue plugin setup (Vuetify, Pinia, Router, i18n, global components).
- `views/`: Top-level screens (route targets and layout shells).
- `components/`: Reusable UI components and dialogs.
- `composables/`: Vue composables that orchestrate UI workflows.
- `stores/`: Pinia state stores.
- `services/`: Side-effectful infrastructure (IndexedDB, fetch, browser APIs, import/export, alerts).
- `domains/`: Business logic, validation, mapping, and error definitions.
- `constants.ts`: Central constants (`INDEXED_DB`, `ERROR_CATEGORY`, `BROWSER_STORAGE`, etc.).
- `types.d.ts`: Shared TypeScript types.
- `style.css`: Global styles.

## How Things Fit Together

- UI (`views/`, `components/`) reads/writes state via `stores/` and uses `composables/` for workflows.
- `services/` perform I/O (IndexedDB, network, file download, etc.) and call into `domains/` for rules/validation.
- `domains/` define stable rules and helper logic (including `AppError` + `ERROR_DEFINITIONS`).
- `constants.ts` is the central place for static configuration and stable identifiers used across layers.

## Useful Commands (from repo root)

- TypeScript: `npm run test:typescript`
- Unit tests: `npm run test:logic`
- Lint: `npm run lint`
- Build: `npm run build:dev` / `npm run build:prod`
