### Skill: Add Missing Tests (Vitest unit + Playwright e2e)

#### Purpose
Find source code and user-facing workflows that have no automated test coverage, and add unit
tests (Vitest) and/or e2e tests (Playwright) that follow this repo's existing conventions.

#### When to Use
- After adding a new file under `src/domain/`, `src/app/usecases/`, `src/adapters/ui/stores/`,
  `src/adapters/ui/composables/`, or `src/adapters/driven/` that has no matching test.
- After adding a new user-facing action (a new HeaderBar button, dialog, or view) that no
  Playwright spec exercises.
- Periodically, to close gaps that accumulated because a script/composable/store was extended
  without extending its test.
- **Not** for chasing 100% coverage on trivial re-exports, pure type files, or thin DI plumbing —
  see "What NOT to test" below.

---

### Scope

- **Unit tests**: `tests/unit/**/*.test.ts`, run via `npm run test:logic` (Vitest, `happy-dom`
  environment, globals enabled — see `vite.config.js` `test` block and `vitest-setup.js`).
- **E2E tests**: `tests/e2e/*.spec.ts`, run via `npm run test:e2e` (builds `build:dev` first, then
  Playwright against Firefox — see `playwright.config.js`).
- Unit tests mirror `src/` 1:1: `src/adapters/ui/stores/accounts.ts` →
  `tests/unit/adapters/ui/stores/accounts.test.ts`. Always place a new test at the mirrored path.

---

### What NOT to Test

Skip these — writing tests for them is busywork, not coverage:

- Pure type/interface files (`domain/types/**`, `*.d.ts`, `app/usecases/ports.ts`).
- Barrel re-export files (`domain/constants.ts`, `domain/types.d.ts`, `adapters/driven/types.ts`).
- Static constant tables with no logic (`domain/constants/**`).
- Trivial DI plumbing with no branching (`adapters/ui/stores/deps.ts`).
- `adapters/container.ts` / `containerBackground.ts` — composition roots; they're exercised
  indirectly by every other test that uses their outputs, and by e2e.
- Generated/build files, `.vue` files that are pure presentation with no conditional logic in
  `<script setup>` (a template-only wrapper around a store getter needs no dedicated test).

If a file surfaces as "missing a test" by the automation snippets below, triage it against this
list before writing anything.

---

### Conventions and Style

- **Test runner**: Vitest with `describe`/`it`/`expect`/`vi` imported explicitly from `"vitest"`
  (globals are enabled in config, but this repo imports explicitly anyway — match existing files).
- **File header**: every test file starts with the MPL license block (copy from any existing test
  file, e.g. `tests/unit/app/usecases/accounts.test.ts`).
- **Pinia stores/composables that touch stores**: call `setActiveTestPinia()` from `@test/pinia`
  in `beforeEach`. It creates a fresh Pinia, attaches mocked `storageAdapter`/`alertAdapter` store
  deps, and sets it active.
- **Use cases**: use the mock factories in `@test/usecases`
  (`createRepositoriesPortMock`, `createRecordsPortMock`, `createRuntimePortMock`,
  `createSettingsPortMock`, `createSetStorageMock`, `createDatabaseAccountsPortMock`,
  `createTransactionManagerMock`, `makeAccountDb`/`makeBookingDb`/`makeStockDb`/`makeBookingTypeDb`).
  Extend this file with a new factory only if a genuinely new port type needs one — don't
  duplicate an inline mock that a factory already covers.
- **`@test/*` is test-only**: ESLint (`eslint.config.js`) blocks importing `@test/*` from
  `src/**`. Never import test helpers from runtime code.
- **Composables/components that call `useAdapters()`**: mock the DI bridge directly —
  `vi.mock("@/adapters/context", () => ({ useAdapters: () => ({ ... }) }))` — or, for composables
  that accept deps as a parameter (like `useDialogGuards(t, deps)`), just pass a plain deps object
  (see `tests/unit/adapters/ui/composables/useDialogGuards.test.ts`).
- **Components/dialogs that touch `browser.*`**: stub the global with
  `vi.stubGlobal("browser", { storage: { local: { get, set } }, runtime: {...}, i18n: {...}, ... })`
  (see `tests/unit/adapters/ui/components/dialogs/ImportDatabase.test.ts`). Vuetify's `useTheme` is
  already globally mocked in `vitest-setup.js` — don't re-mock it per file.
- **Dialog/component tests in this repo test logic, not full DOM rendering** — see the
  `ImportDatabase.test.ts` pattern (`describe("... Logic Test")`): validate the data
  transformations and guard conditions a component's script relies on, rather than mounting the
  full Vuetify tree. Reserve full mount/interaction testing for Playwright.
- **Respect `tests/unit/architecture.test.ts`**: it enforces that UI code doesn't import
  `@/adapters/driven/*` directly (except `types`), that only `entrypoints/`/`driven/`/`container.ts`
  import the DI container, and that `app/usecases/**` never imports `vue`/`pinia`/stores. If a new
  test needs to violate one of these to reach what it's testing, that's a signal to mock the
  boundary instead of importing across it — never loosen the architecture test to make a new test
  pass.
- **E2E specs**: Playwright + Firefox only (`playwright.config.js` has one `firefox` project).
  Specs serve the built `kontenmanager@gmx.de/` folder via a tiny static HTTP server and inject a
  minimal `browser.*` stub via `page.addInitScript` (functions must be defined *inside* the init
  script — they can't be passed in from Node). Prefer stable selectors: the `id="..."` attributes
  on `HeaderBar.vue` action buttons (`#addAccount`, `#addBooking`, `#exportDatabase`, …), or
  `page.getByRole(...)` with locale-agnostic regex label matching (see the ISIN-field example in
  `happy-path.spec.ts`) since the UI is bilingual (de/en).
- **Both existing e2e specs duplicate the same static-server + browser-stub boilerplate.** If
  you're adding a third spec, consider extracting `startStaticServer` and the `browser.*` stub
  into a `tests/e2e/support/` helper instead of copy-pasting a third time — but don't do this
  refactor silently as a side effect of an unrelated test addition; call it out separately.

---

### Standard Templates

#### Unit test — pure domain function
```ts
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {someFunction} from "@/domain/someModule";

describe("domain/someModule", () => {
    it("does X for typical input", () => {
        expect(someFunction(/* ... */)).toBe(/* ... */);
    });

    it("handles the edge case Y", () => {
        expect(someFunction(/* ... */)).toBe(/* ... */);
    });
});
```

#### Unit test — use case (port mocks)
```ts
import {describe, expect, it, vi} from "vitest";
import {someUsecase} from "@/app/usecases/someModule";
import {
    createRecordsPortMock,
    createRepositoriesPortMock,
    createRuntimePortMock
} from "@test/usecases";

describe("usecases/someModule", () => {
    it("persists before mutating the store (DB-first ordering)", async () => {
        const save = vi.fn().mockResolvedValue(1);
        const records = createRecordsPortMock();
        const runtime = createRuntimePortMock();

        await someUsecase(
            {repositories: createRepositoriesPortMock({accounts: {save}}), records, runtime},
            {/* input */}
        );

        expect(save).toHaveBeenCalled();
        expect(records.accounts.update).toHaveBeenCalled();
        expect(runtime.resetTeleport).toHaveBeenCalled();
    });
});
```

#### Unit test — Pinia store
```ts
import {beforeEach, describe, expect, it} from "vitest";
import {setActiveTestPinia} from "@test/pinia";
import {useSomeStore} from "@/adapters/ui/stores/someStore";

describe("Some Store", () => {
    beforeEach(() => {
        setActiveTestPinia();
    });

    it("adds an item", () => {
        const store = useSomeStore();
        store.add({/* ... */});
        expect(store.items).toHaveLength(1);
    });
});
```

#### Unit test — composable with injected deps
```ts
import {describe, expect, it} from "vitest";
import {useSomeComposable} from "@/adapters/ui/composables/useSomeComposable";

describe("useSomeComposable", () => {
    const deps = {
        alertAdapter: {feedbackInfo: async () => undefined /* ... */},
        browserAdapter: {getMessage: (k: string) => k}
    };

    it("does the thing", async () => {
        const {doTheThing} = useSomeComposable(deps);
        await doTheThing();
        // assert on deps calls or returned reactive state
    });
});
```

#### E2E test — new workflow (Playwright/Firefox)
Copy the static-server + `browser.*` stub setup from `tests/e2e/happy-path.spec.ts`. Skeleton for
the interaction itself once the app is loaded:
```ts
await page.goto(`${server.baseUrl}/adapters/ui/entrypoints/app.html`, {waitUntil: "load"});
await expect(page.locator("header.v-app-bar").first()).toBeVisible({timeout: 30_000});

await page.locator("#addBooking").click();
await page.getByRole("textbox", {name: /(Description|Beschreibung)/i}).fill("Test booking");
await page.locator(".v-dialog .v-card-actions button").first().click();

await page.waitForFunction(
    () => document.querySelectorAll('.v-dialog[role="dialog"]').length === 0,
    null,
    {timeout: 10_000}
).catch(() => undefined);

// Prefer asserting via IndexedDB directly when UI assertions would be flaky
// under alert overlays (see the ISIN-lookup pattern in happy-path.spec.ts).
```

---

### Update Playbook (Step-by-Step)

1. **Inventory testable source files.** Run the "missing unit test" PowerShell snippet below
   against `src/domain`, `src/app/usecases`, `src/adapters/ui/stores`,
   `src/adapters/ui/composables`, `src/adapters/driven`. Triage each hit against "What NOT to
   Test" before adding it to your work list.

2. **Inventory untested user-facing actions.** Run the "missing e2e coverage" snippet below to
   diff `HeaderBar.vue` action ids against what the existing `tests/e2e/*.spec.ts` files exercise.
   Cross-check against `src/WORKFLOWS.md`, which documents every intended user flow in detail —
   use its "Processing" sections to know what a correct flow actually does before asserting on it.

3. **Write unit tests first** for domain/usecase/store/composable gaps — they're fast, don't need
   a build, and de-risk the logic before you write a slower e2e test around it.

4. **Write e2e tests for gaps in user-facing flows** — one Playwright test per HeaderBar action
   that has none, following the existing two-spec pattern. Reuse `tests/e2e/fixtures/backup.modern.min.json`
   to get to a populated state instead of manually creating accounts/stocks in every spec.

5. **Run the full local gate** before considering the work done:
   ```powershell
   npm run test:logic
   npm run test:typescript
   npm run lint
   npm run test:e2e
   ```
   `test:e2e` rebuilds (`build:dev`) first, so it will catch a build break your new test's setup
   introduced.

6. **Do not weaken `tests/unit/architecture.test.ts`** to make a new test pass. If you hit one of
   its rules, mock the adapter/store boundary in the test instead of loosening the rule.

---

### Automation Snippets (Windows PowerShell)

Find source files under logic-bearing directories with no mirrored `*.test.ts` (validated against
this repo — currently surfaces candidates in `domain/validation`, `app/usecases/backup`,
`adapters/ui/stores` aggregation stores, several composables, and most of `adapters/driven`; triage
each against "What NOT to Test" before acting):
```powershell
$srcRoots = @(
  "src/domain",
  "src/app/usecases",
  "src/adapters/ui/stores",
  "src/adapters/ui/composables",
  "src/adapters/driven"
)
$excludePattern = '\\types\\|/types/|\\types\.d\.ts$|constants|\.d\.ts$|\\deps\.ts$|\\ports\.ts$'

$missing = @()
foreach ($root in $srcRoots) {
  Get-ChildItem -Recurse -Path $root -Include *.ts -File | ForEach-Object {
    $rel = $_.FullName.Substring((Resolve-Path .).Path.Length + 1) -replace '\\','/'
    if ($rel -match $excludePattern) { return }
    $testPath = "tests/unit/" + ($rel -replace '^src/','') -replace '\.ts$','.test.ts'
    if (-not (Test-Path $testPath)) {
      $missing += [pscustomobject]@{src=$rel; expected=$testPath}
    }
  }
}
$missing | Format-Table -AutoSize
Write-Host "TOTAL: $($missing.Count)"
```

Find `HeaderBar.vue`-style action ids with no e2e coverage (checks whether `#<id>` is referenced
anywhere in `tests/e2e/*.spec.ts`):
```powershell
$ids = Select-String -Path "src/adapters/ui/views/*.vue" -Pattern 'id="([a-zA-Z][\w-]*)"' -AllMatches |
  ForEach-Object { $_.Matches } | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique

$specFiles = Get-ChildItem -Recurse "tests/e2e" -Filter *.spec.ts
$specText = ($specFiles | ForEach-Object { Get-Content -Raw $_.FullName }) -join "`n"

foreach ($id in $ids) {
  if ($specText -notmatch [regex]::Escape("#$id")) {
    Write-Host "[NO E2E COVERAGE] #$id"
  }
}
```

Optional deeper pass — line/branch coverage (requires installing a coverage provider first; not
currently a project dependency, so this is opt-in, not part of the default playbook):
```powershell
npm install --no-save @vitest/coverage-v8
npx vitest run --coverage
```

---

### Quality Checklist
- [ ] New test file lives at the path that mirrors its source file under `tests/unit/`.
- [ ] File starts with the MPL license header, matching existing test files.
- [ ] Pinia-touching tests call `setActiveTestPinia()` in `beforeEach`.
- [ ] Use-case tests use `@test/usecases` factories, not ad-hoc inline mocks that duplicate them.
- [ ] No `@test/*` import leaked into `src/**`.
- [ ] `tests/unit/architecture.test.ts` still passes unmodified.
- [ ] New e2e specs reuse the static-server/browser-stub pattern and prefer `id="..."` /
      locale-agnostic role selectors over brittle text matches.
- [ ] `npm run test:logic`, `npm run test:typescript`, `npm run lint` all pass.
- [ ] `npm run test:e2e` passes if e2e specs were added or changed.

---

### Tips
- Read the target source file fully before writing its test — this repo's domain/usecase layer
  has narrow, deliberate behaviors (e.g. DB-first ordering, FIFO cost-basis prorating) that a
  superficial test can assert incorrectly. When in doubt, check `src/WORKFLOWS.md` and
  `src/ARCHITECTURE.md` for the documented intent.
- Favor several small `it()` cases over one large one — easier to see which behavior regressed.
- For fetch providers (`adapters/driven/fetch/providers/*.ts`), test the pure parsing/normalization
  functions against captured sample HTML/JSON fixtures rather than making real network calls.
- If a "missing test" candidate turns out to be trivial once you open it, skip it and note why —
  don't pad the suite with a test that just re-asserts a mock returned what you told it to return.

---

### Maintenance
- Re-run this skill whenever a new file lands under a logic-bearing `src/` directory, or a new
  `HeaderBar` action / dialog / view ships without an accompanying e2e assertion.
- If `@vitest/coverage-v8` (or `-istanbul`) becomes an actual project dependency later, prefer it
  over the structural mirroring snippet above for finding *low-coverage* existing files, not just
  *missing* ones — update this skill to make the coverage pass the primary method at that point.