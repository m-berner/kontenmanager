# App Layer (`src/app/`)

This folder documents the **application layer** boundary.

In this codebase, the app layer is primarily implemented in:

- `src/app/usecases/` (orchestration workflows via ports)
- `src/app/usecases/portAdapters.ts` (composition boundary: wiring concrete runtime objects into usecase ports)
- `src/adapters/secondary/appAdapter.ts` (bootstrap/orchestration adapter used by entrypoints)

Guidelines:

- App layer coordinates domain + infra, but should not contain UI framework code (Vue/Pinia).
- Prefer depending on `src/app/usecases/ports.ts` shapes instead of importing concrete stores/services.
- Keep pure domain rules in `src/domain/`.
