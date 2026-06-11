# Adapters Layer (`src/adapters/`)

This folder documents the **adapters layer** boundary, split into two subdirectories:

## `primary/` — UI-facing adapters

Vue components, stores, composables, plugins, entrypoints, assets, and locales that face the user interface.

## `secondary/` — Service-facing adapters

Infrastructure adapters that communicate with external systems:

- `src/adapters/driven/database/*` (IndexedDB access)
- `src/adapters/driven/browserAdapter.ts` (WebExtension APIs)
- `src/adapters/driven/storageAdapter.ts` (browser storage)
- `src/adapters/driven/fetchAdapter.ts` (network IO — thin orchestrator; per-provider scrapers live in
  `src/adapters/driven/fetch/providers/`)

Guidelines:

- Secondary adapters talk to external systems (browser APIs, IndexedDB, fetch).
- Keep secondary adapters side-effectful; business rules belong in `src/domain/`.
- Prefer exposing secondary adapters through DI (`src/adapters/container.ts`) and small ports (
  `src/app/usecases/ports.ts`).

## Directory Structure

### Directories

- `driven/`
- `ui/`

### Files

- `container.ts`: Adapters, AdaptersOverrides, createAdapters
- `containerBackground.ts`: BackgroundAdapters, BackgroundAdaptersOverrides, createBackgroundAdapters
- `context.ts`: provideAdapters, useAdapters

