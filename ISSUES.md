# Audit round — 2026-09-09

## Scope & method

Full `src/` tree (165 `.ts`/`.vue` files) split into 4 roughly file-count-balanced slices and
audited by 4 parallel subagents, each instructed to read every file in its slice fully (not by
grep) and report only findings with a concrete, currently-verified failure scenario:

- **Slice 1 — `domain/` + `app/usecases/`** (48 files)
- **Slice 2 — `adapters/driven/`** (32 files, including `database/**` and `fetch/**`)
- **Slice 3 — `adapters/ui/components/**` + `adapters/ui/composables/**`** (47 files, including
  all dialogs and forms)
- **Slice 4 — `adapters/ui/stores/**` + `adapters/ui/views/**` + `adapters/ui/entrypoints/**` +
  `adapters/ui/plugins/**`** (33 files)

Locale files (`src/adapters/ui/_locales/**`) checked directly (not delegated): `npm run lint:i18n`
passed; a supplementary script confirmed `gui.json` and `messages.json` have identical `de`/`en`
key sets (0 keys only-in-one-locale for either file) and matching placeholder/interpolation tokens
per key (0 mismatches for `{name}`-style tokens in `gui.json` and `$1`/`$NAME$`-style tokens plus
`placeholders` object keys in `messages.json`).

This codebase has already been through numerous full-coverage audit rounds (see project memory);
the low finding count here is consistent with it being at or near the ceiling of what static
reading alone can find, not a sign of a shallow pass — each slice's own agent independently noted
extensive pre-existing in-code documentation of previously-found-and-fixed bugs of exactly the
classes this audit looks for.

## Findings

### Low — `runtime.ts` `clearStocksPages()`: page-generation Map grew one permanent entry per
page number ever seen in a session
**File**: `src/adapters/ui/stores/runtime.ts:156-162` (pre-fix)
**Issue**: `clearStocksPages()` cleared `loadedStocksPages`/`loadedStocksPagesAt` but only
*iterated and bumped* `stocksPageGeneration`'s existing keys, so every distinct page number the
user ever visited stayed a permanent key in that `Map` for the life of the session.
**Failure scenario**: A long-lived session where the user changes `stocksPerPage` a few times and
browses many pages across several accounts adds one Map entry per distinct (page-size, page-number)
combination, forever. Bounded in realistic use (small relative to `ITEMS_PER_PAGE_OPTIONS.length ×
plausible max page count`) and never affects correctness — `isStocksPageGenerationCurrent` only
compares against the specific page it's asked about — so this was a structural unbounded-growth
pattern rather than anything user-visible.
**Fix**: Changed `clearStocksPages()` to `stocksPageGeneration.value.clear()` instead of
iterate-and-bump. This is strictly equivalent for invalidation purposes: an in-flight fetch's stale
generation number can never equal `undefined` (what `.get(page)` now returns for a cleared page),
so its write-back is discarded exactly as before — but the Map itself stops accumulating entries
across clears instead of growing by however many distinct pages were tracked at each clear.
**Status**: Fixed. Test `clearStocksPages should invalidate the generation of every tracked page…`
(`tests/unit/adapters/ui/stores/runtime.test.ts`) re-verified against the new implementation
(assertions were already behavior-level, not internals-level, so only the title needed updating).

### Low — `useExportDialog.ts`: displayed export filename could disagree with the actually-downloaded
file across a midnight rollover
**File**: `src/adapters/ui/composables/useExportDialog.ts:37-46` (pre-fix)
**Issue**: `dialogText` (the read-only preview text in `ExportDatabase.vue`'s textarea) was built
once from `buildFilename()` at composable-creation time (dialog open) and never changed afterward.
`run()` (triggered by clicking OK) independently calls `buildFilename()` again to name the file it
actually writes — correctly, per an existing comment explaining a *previously fixed* bug where the
written file itself carried a stale date. That fix left the *display* frozen as a side effect.
**Failure scenario**: User opens the Export Database dialog at 23:59; the preview shows
`…2026-09-08_30_kontenmanager.json`. They click Download at 00:01 the next day → the file actually
saved is `…2026-09-09_30_kontenmanager.json`, silently different from what was shown moments
earlier. No data is wrong (this only affects the on-screen filename), but it's a cosmetic
correctness gap in an otherwise-deliberately-hardened code path.
**Fix**: Made `dialogText` a `computed` driven by a `ref<string>` (`displayFilename`) that
re-derives via `buildFilename()` on a 60s `setInterval`, cleared with `onUnmounted` (matching this
codebase's established composable-cleanup convention — see `useMenu.ts`/`useKeyboardShortcuts.ts`/
`useHeaderBarActions.ts`). `run()`'s independent re-derivation is untouched. Updated
`export-database.md` to describe the preview as reactive rather than a one-time snapshot, and added
a regression test using `vi.useFakeTimers()`/`vi.setSystemTime()` to simulate a day rollover while
the dialog stays "open".
**Status**: Fixed. 974/974 unit tests pass (973 prior + 1 new), `vue-tsc --noEmit` and `eslint`
clean.

## Suspected, unconfirmed (per the audit's rigor rule — not fixed, no concrete failure scenario)

Reported by the slice agents but traced out (by the agents themselves, or by a follow-up check
this session) to be either unreachable through any current write path or already safe:

1. **`exportHelpers.ts:96` `findExportConsistencyIssues` doesn't check duplicate booking-type
   roles**, unlike import's `validateDataIntegrity`. Traced: every current write path
   (`addBookingTypeUsecase`, `updateBookingTypeUsecase`, `createDefaultBookingTypes`,
   `migrator.ts`'s `backfillBookingTypeRoles`) already prevents the live DB from reaching the state
   export would mishandle. Real gap, but not reachable except via out-of-band IndexedDB tampering.
2. **`bookingTypes.ts:123` `updateBookingTypeUsecase`'s role-conflict read-then-write isn't wrapped
   in one transaction**, unlike `updateAccountUsecase`'s equivalent guard. No current UI path calls
   it twice concurrently for the same account (only one teleported dialog can be open at a time), so
   no reachable TOCTOU today — worth a defensive fix only if this usecase ever gets a second caller.
3. **`AlertOverlay.vue:115` dismiss button reads `currentAlert?.id` while the visible content comes
   from a cached `renderedAlert`**. Checked this session against `alerts.ts`'s `dismissAlert`: it
   no-ops (logs a warning, returns) for any `id` not found in `alertQueue` — including the `-1`
   sentinel `currentAlert` resets to once the queue empties. Also confirmed `renderedAlert` and
   `currentAlert.id` never actually diverge for a live alert-to-alert transition (the watcher updates
   `renderedAlert` synchronously whenever `next.id > -1`, and `showOverlay` doesn't toggle between
   two real alerts, so there's no leave-transition window where stale content and a stale id coexist
   on screen). Confirmed safe, not a bug.
4. **`DynamicList.vue`'s `:key="item"` on `exchanges`/`markets`** assumed possibly non-unique.
   Checked this session: `addItem` already blocks duplicates via a normalized `.includes()` check
   before persisting, and `src/app/usecases/backup/**` never touches `exchanges`/`markets` at all (a
   grep found zero references) — so there is no import/restore path that could inject a duplicate
   past the component's own guard. Confirmed safe, not a bug.
5. **`CheckboxGrid.vue`'s `:key="item"`** — confirmed safe without further investigation: its keys
   are `Object.keys()` of the static `SETTINGS.INDEXES`/`SETTINGS.MATERIALS` maps, unique by
   construction.

## Checked and confirmed correct (selected highlights; each slice's own report has the full list)

- IndexedDB connection lifecycle (`connectionManager.ts`), transaction manager, and batch-operation
  builder's concurrent add/reset handling — all previously-audited and re-verified sound.
- All four `migrator.ts` migrations — idempotent, correctly gated by `oldVersion`, per-cursor error
  handlers present.
- `httpCache.ts` TTL/eviction and `httpClient.ts` retry/timeout/abort-reason disambiguation.
- Every fetch provider's currency detection, allowlisted URL resolution, and mid-quote averaging.
- FIFO cost-basis algorithm, currency/FX divisor re-seeding, booking role-invariant gating,
  backup export/import round trip (byte-length helper, number-format detection) — all re-traced.
- The historical "Vuetify `type="number"` passes a raw string" bug class: grepped for every
  `type="number"` field in the UI slice: only `BookingForm.vue`'s count field, which already has
  both the mapper (`toNumber()`) and rule fixes from prior rounds. No new instance found.
- Single-tab-guard / background-tab dedup tie-break logic, currency-divisor watcher lifecycle,
  account-switch sequencing (`TitleBar.vue`'s `accountUpdateSeq`/`switchInFlight`), settings-store
  rollback comparisons, ref-counted loading flags (`beginDownload`/`endDownload` pairing) — all
  re-traced across the stores/views/entrypoints/plugins slice with no new issue found.
- Off-by-layer check: no file in `domain/`, `app/usecases/`, or any UI slice imports a concrete
  `adapters/driven/*` implementation directly, or reaches for Vue/Pinia/browser/i18n from
  `domain/`/`app/usecases/`.

## Coverage gaps / caveats

- Each slice agent's "checked correct" conclusions about code *outside* its own slice (e.g., the UI
  slices trusting `formMapper.ts`/`domain/logic.ts` outputs without re-reading those files
  themselves) rest on this session's memory of prior rounds and in-code comments, not a first-hand
  re-read this round — by design, per the slicing.
- `test:unit`, `test:typescript`, `lint`, and `lint:i18n` all run and pass this round.
  `test:e2e` was **not** run, per standing user preference against running it unprompted during
  audit passes (an explicit ask overrides this default, but none was made this round); neither fix
  touches a DB migration, and the export-dialog fix is a display-only reactivity change with no
  behavioral change to `run()`'s write path, so the risk of a regression only e2e would catch is
  low.
- Two Low findings fixed; zero High or Medium findings this round.
