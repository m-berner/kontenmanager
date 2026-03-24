# Adapters Layer (`src/adapters/`)

This folder documents the **adapters layer** boundary, split into two subdirectories:

## `primary/` — UI-facing adapters

Vue components, stores, composables, plugins, entrypoints, assets, and locales that face the user interface.

## `secondary/` — Service-facing adapters

Infrastructure adapters that communicate with external systems:

- `src/adapters/secondary/database/*` (IndexedDB access)
- `src/adapters/secondary/browserAdapter.ts` (WebExtension APIs)
- `src/adapters/secondary/storageAdapter.ts` (browser storage)
- `src/adapters/secondary/fetchAdapter.ts` (network IO — thin orchestrator; per-provider scrapers live in
  `src/adapters/secondary/fetch/providers/`)

Guidelines:

- Secondary adapters talk to external systems (browser APIs, IndexedDB, fetch).
- Keep secondary adapters side-effectful; business rules belong in `src/domain/`.
- Prefer exposing secondary adapters through DI (`src/adapters/container.ts`) and small ports (`src/app/usecases/ports.ts`).
