# Types

The project uses the stable import path `@/types` for shared TypeScript types, but the definitions are split into
smaller, layer-focused modules under `src/domain/types/`.

## Files

- [`domain.ts`](./domain.ts): Domain-level data structures (persisted records and legacy formats).
- [`infra.ts`](./infra.ts): Infrastructure-facing types (repositories, batch operations, storage typing, DB payloads).
- [`backup.ts`](./backup.ts): Backup file types (legacy vs modern) and validation result types.
- [`ui.ts`](./ui.ts): UI-facing form/alert option shapes (Vue/Vuetify boundary).
- [`uiLayer.ts`](./uiLayer.ts): UI/store/component type surface, split into modules under [`uiLayer/`](./uiLayer/).
- `src/domain/types.d.ts`: Public re-export surface for `@/types` (kept for compatibility across the codebase).

## Conventions

- Prefer importing from `@/types` in most code.
- Add new types to the closest module (domain/infra/backup) and re-export via `src/domain/types.d.ts`.
- Keep domain types independent of Vue/Pinia and runtime services.
- Keep backup types explicit: legacy and modern formats are different shapes; avoid "intersection" hacks.
