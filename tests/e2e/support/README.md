# Test Harness (`tests/e2e/support/`)

Shared setup used by every E2E spec, imported via relative path (`./support/harness` or `../support/harness`).
Everything below lives in the single file [`harness.ts`](harness.ts).

## Boot & Network

- `getBuildDir()`: absolute path to the built extension folder (`test-app/kontenmanager@gmx.de/`), where
  `build:dev`'s `EXTENSIONS_DIR` override lands it — see the function's own doc comment for why it's not directly
  at the repo root.
- `blockExternalRequests(page, baseUrl)`: aborts every request not served by the local static server. **Must be
  called before `page.goto`** in any test that boots the app — app boot's Phase 3 external-data fetches ignore
  `sService` entirely and hit the real network unconditionally, so without this every `header.v-app-bar` wait is
  effectively an internet-connectivity test (see the function's doc comment, and `tests/README.md`'s "App boot
  must never touch the real network" section, for the full story).
- `startStaticServer(rootDir)`: serves a built extension folder over plain HTTP so a normal Playwright page can
  load `app.html` like any other static site. Returns `{baseUrl, close}`.
- `stubBrowser()`: minimal `browser.*` stub (storage, downloads, tabs, i18n, runtime, …), passed to
  `page.addInitScript`. Runs *inside* the page context — it can't close over anything from this module, since
  functions aren't structured-cloneable across `addInitScript`'s boundary.
- `bootWithFixtureImported(page, repoRoot, baseUrl)`: the composed one-call boot most specs use — stubs the
  browser, blocks external requests, boots the app, imports `fixtures/backup.modern.min.json`, sets the imported
  account active with `sService: "none"`, and leaves the app on the Home view with alert overlays dismissed.

## Dialog Interaction

- `clickDialogOk(page)`: clicks the OK action of the top-most open dialog, by position (icon-only buttons have no
  accessible name — see the function's doc comment for why `button[type="submit"]` no longer works).
- `confirmImportDialog(page, timeout?)`: confirms the ImportDatabase dialog specifically — waits for a *second*
  dialog to exist first, because the import's async rollback-snapshot read races the confirmation dialog's
  appearance (see the function's doc comment).
- `confirmDestructiveDialog(page, timeout?)`: confirms a row-menu delete's `AlertOverlay` confirmation. Distinct
  from `confirmImportDialog` — there's only ever one dialog on screen here, so waiting for a second would hang.
- `closeAllAlerts(page)`: dismisses any visible Vuetify alert overlays that would otherwise block subsequent
  clicks.
- `waitForDialogsClosed(page, timeout?)`: waits until no Vuetify dialog (`.v-dialog[role="dialog"]`) is left open.

## Assertions

- `readStore<T>(page, storeName)`: reads all rows of an IndexedDB object store directly inside the page context,
  to assert on persisted state without depending on UI rendering.

## Directory Structure

### Files

- `harness.ts`: ADDON_ID, getBuildDir, blockExternalRequests, startStaticServer, stubBrowser, closeAllAlerts,
  clickDialogOk, confirmImportDialog, confirmDestructiveDialog, waitForDialogsClosed, bootWithFixtureImported,
  readStore
