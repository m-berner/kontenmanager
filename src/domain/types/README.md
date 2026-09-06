# Types

The project uses the stable import path `@/domain/types` for shared TypeScript types, but the definitions are split into
smaller, layer-focused modules under `src/domain/types/`.

## Files

- [`domain.ts`](domain.ts): Domain-level data structures (persisted records).
- [`adapter.ts`](adapter.ts): Adapter-facing types (repositories, batch operations, storage typing, DB payloads).
- [`backup.ts`](backup.ts): Backup file type and validation result types.
- [`ui.ts`](ui.ts): UI-facing form/alert option shapes (Vue/Vuetify boundary).
- [`uiLayer.ts`](uiLayer.ts): UI/store/component type surface, split into modules under [`uiLayer/`](uiLayer).
- `src/domain/types.d.ts`: Public re-export surface for `@/domain/types`.

## Conventions

- Prefer importing from `@/domain/types` in most code.
- Add new types to the closest module (domain/infra/backup) and re-export via `src/domain/types.d.ts`.
- Keep domain types independent of Vue/Pinia and runtime services.
- Keep backup types explicit; avoid "intersection" hacks.

## Directory Structure

### Directories

- `uiLayer/`

### Files

- `adapter.ts`: QueryOptions, RecordOperation, BatchOperationDescriptor, RecordsDbData, RepairResult, ...
- `backup.ts`: BackupMetadata, ModernBackupData, BackupData, BackupValidationResult
- `domain.ts`: AccountDb, BookingDb, BookingTypeDb, StockDb, ...
- `ui.ts`: AccountFormData, BookingFormData, BookingTypeFormData, StockFormData, HandleUserAlertOptions, ...
- `uiLayer.ts`

