# Usecases Layer

This directory contains the application-layer workflows (multi-step operations) used by dialogs and views.

Usecases:

- coordinate multiple repositories/services/stores
- enforce ordering/atomicity (transactions, rollback, confirmations)
- keep UI components thin (UI does mapping + guards + calls a usecase)

## Principles

- No Vue imports: usecases should not depend on `inject()`, refs, or component lifecycle.
- Depend on small ports, not concrete Pinia stores/services:
    - ports live in [`ports.ts`](./ports.ts)
    - UI adapts DI-provided services/stores to these ports
- Keep domain rules in `src/domain/*`. Usecases orchestrate, they do not own calculations/validation rules.

## Entry Points

Typical call site (from a dialog/view):

```ts
import {useServices} from "@/adapters/secondary/context";
import {useRecordsStore} from "@/adapters/primary/stores/records";
import {useRuntimeStore} from "@/adapters/primary/stores/runtime";
import {useSettingsStore} from "@/adapters/primary/stores/settings";
import {toRecordsPort, toSettingsPort} from "@/app/usecases/portAdapters";
import {addAccountUsecase} from "@/app/usecases/accounts";

const {databaseService, repositories, alertService, storageAdapter} = useServices();
const {setStorage} = storageAdapter();

const res = await addAccountUsecase(
    {
        databaseService,
        repositories,
        records: toRecordsPort(useRecordsStore()),
        runtime: useRuntimeStore(),
        settings: toSettingsPort(useSettingsStore()),
        setStorage
    },
    {
        accountData,
        withDepot,
        bookingTypeLabels,
        success: {title, message}
    }
);
```

Most concrete types (`repositories`, `runtime`, `databaseService`) satisfy their port interfaces
structurally and can be passed directly. `records` and `settings` require the thin adapter wrappers
from `src/app/usecases/portAdapters.ts` to preserve Pinia reactivity.

## Backup Usecases

Backup import/export lives under `src/app/usecases/backup/*` with pure helper functions for unit testing. The public
surface
is re-exported from [`backup.ts`](./backup.ts).

