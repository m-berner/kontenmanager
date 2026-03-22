# Adapters Layer (`src/adapters/`)

This folder documents the **adapters layer** boundary, split into two sub-directories:

## `primary/` — UI-facing adapters

Vue components, stores, composables, plugins, entrypoints, assets, and locales that face the user interface.

## `secondary/` — Service-facing adapters

Infrastructure services that communicate with external systems:

- `src/adapters/secondary/services/database/*` (IndexedDB access)
- `src/adapters/secondary/services/browserService.ts` (WebExtension APIs)
- `src/adapters/secondary/services/storageAdapter.ts` (browser storage)
- `src/adapters/secondary/services/fetch.ts` (network IO — thin orchestrator; per-provider scrapers live in
  `src/adapters/secondary/services/fetch/providers/`)

Guidelines:

- Secondary adapters talk to external systems (browser APIs, IndexedDB, fetch).
- Keep secondary adapters side-effectful; business rules belong in `src/domain/`.
- Prefer exposing secondary adapters through DI (`src/adapters/secondary/services/container.ts`) and small ports (`src/app/usecases/ports.ts`).
