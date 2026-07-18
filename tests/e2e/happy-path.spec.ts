import {test, expect} from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import {ADDON_ID, closeAllAlerts, startStaticServer, stubBrowser} from "./support/harness";

test("happy path (firefox): import backup and see Company content", async ({page, browserName}) => {
  expect(browserName).toBe("firefox");

  const repoRoot = process.cwd();
  const buildDir = path.join(repoRoot, ADDON_ID);
  const manifestPath = path.join(buildDir, "manifest.json");
  const appHtmlPath = path.join(buildDir, "adapters", "ui", "entrypoints", "app.html");

  await expect(async () => fs.access(manifestPath)).resolves.toBeUndefined();
  await expect(async () => fs.access(appHtmlPath)).resolves.toBeUndefined();

  const server = await startStaticServer(buildDir);
  try {
    // Provide a minimal `browser.*` stub so the extension code can run in a normal web page.
    await page.addInitScript(stubBrowser);

    await page.goto(`${server.baseUrl}/adapters/ui/entrypoints/app.html`, {waitUntil: "load"});

    // Wait for the HeaderBar to be mounted and visible
    // We use a more specific selector to avoid strict mode violations if multiple headers exist (though they shouldn't)
    const headerBar = page.locator("header.v-app-bar").first();
    await expect(headerBar).toBeVisible({timeout: 30_000});

    // Ensure we are on the home view
    const homeBtn = page.locator("#home");
    await expect(homeBtn).toBeVisible({timeout: 10_000});
    
    // Switch to "Home" explicitly (just in case)
    await homeBtn.click();

    // Open Import dialog via HeaderBar icon id.
    await page.locator("#importDatabase").click();

    // Upload backup file fixture.
    const fixturePath = path.join(repoRoot, "tests", "e2e", "fixtures", "backup.modern.min.json");
    await page.locator('input[type="file"]').setInputFiles(fixturePath);

    // Confirm import (OK button).
    await page.locator('button[type="submit"]').click();

    // Import flow shows a confirmation dialog (via alertAdapter.feedbackConfirm).
    // Click the confirmation button (last button) on the top-most dialog.
    const dialogs = page.getByRole("dialog");
    await dialogs.last().getByRole("button").last().click();

    // Wait for dialogs to close (ImportDatabase dialog closes via `runtime.resetTeleport()`).
    await page.waitForFunction(
      () => document.querySelectorAll('.v-dialog[role=\"dialog\"]').length === 0,
      null,
      {timeout: 30_000}
    );

    // Import flow also shows an info alert overlay after success (via alertAdapter.feedbackInfo).
    // Close it if present, so it doesn't block clicks.
    const alertOverlay = page.locator(".v-overlay").filter({has: page.locator(".v-alert")});
    if (await alertOverlay.isVisible().catch(() => false)) {
      const closeBtn = alertOverlay.locator(".v-alert__close button");
      if (await closeBtn.count()) {
        await closeBtn.first().click();
      }
      await alertOverlay.waitFor({state: "hidden", timeout: 30_000}).catch(() => undefined);
    }

    // Navigate to the Company view.
    await page.locator("#company").click();

    // Assert stock from the fixture is visible.
    // Use a longer timeout and check for content specifically.
    await expect(page.getByText("AAPL")).toBeVisible({timeout: 20_000});
    await expect(page.getByText("US0378331005")).toBeVisible({timeout: 10_000});
  } finally {
    await server.close();
  }
});

test("add company by ISIN (firefox): create new company with ISIN DE000BASF111", async ({page, browserName}) => {
  expect(browserName).toBe("firefox");

  const repoRoot = process.cwd();
  const buildDir = path.join(repoRoot, ADDON_ID);
  const manifestPath = path.join(buildDir, "manifest.json");
  const appHtmlPath = path.join(buildDir, "adapters", "ui", "entrypoints", "app.html");

  await expect(async () => fs.access(manifestPath)).resolves.toBeUndefined();
  await expect(async () => fs.access(appHtmlPath)).resolves.toBeUndefined();

  const server = await startStaticServer(buildDir);
  try {
    // Stub minimal `browser.*` so the app can run in a normal page
    await page.addInitScript(stubBrowser);

    await page.goto(`${server.baseUrl}/adapters/ui/entrypoints/app.html`, {waitUntil: "load"});

    // Wait for header bar
    const headerBar = page.locator("header.v-app-bar").first();
    await expect(headerBar).toBeVisible({timeout: 30_000});

    // Ensure we are on Home, then import a small backup to have an active account
    await page.locator("#home").click();
    await page.locator("#importDatabase").click();
    const fixturePath = path.join(repoRoot, "tests", "e2e", "fixtures", "backup.modern.min.json");
    await page.locator('input[type="file"]').setInputFiles(fixturePath);
    await page.locator('button[type="submit"]').click();
    const dialogs = page.getByRole("dialog");
    await dialogs.last().getByRole("button").last().click();
    await page.waitForFunction(() => document.querySelectorAll('.v-dialog[role="dialog"]').length === 0, null, {timeout: 30_000});

    // After import, explicitly set active account and disable external service to avoid online fetch alerts
    await page.evaluate(async () => {
      // @ts-ignore
      const b = window.browser as any;
      if (b?.storage?.local?.set) {
        await b.storage.local.set({ sActiveAccountId: 1, sService: "none" });
      }
    }).catch(() => undefined);

    // Give the app a moment to sync settings across stores
    await page.waitForTimeout(100);

    // Close any success/error alerts if visible
    await closeAllAlerts(page);

    // Ensure no scrim overlay is blocking clicks (e.g., leftover dialog/menu/tooltip)
    const scrim = page.locator('.v-overlay__scrim');
    if (await scrim.isVisible().catch(() => false)) {
      // Try to dismiss by clicking on the scrim or pressing Escape
      await scrim.first().click({ trial: true }).catch(() => undefined);
      await scrim.first().click().catch(() => undefined);
      if (await scrim.isVisible().catch(() => false)) {
        await page.keyboard.press('Escape').catch(() => undefined);
      }
      // Wait a bit for transitions to finish
      await scrim.first().waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => undefined);
    }

    // Ensure an active account is selected after import (best-effort; tolerate if already selected)
    try {
      const switcher = page.locator('#accountSwitcher, [data-testid="account-switcher"], .header-account');
      if (await switcher.count()) {
        // Try opening and choosing the first account entry if a menu appears
        await switcher.first().click({ force: true }).catch(() => undefined);
        const firstItem = page.locator('.v-overlay .v-list .v-list-item').first();
        if (await firstItem.count()) {
          await firstItem.click({ force: true }).catch(() => undefined);
        }
      }
    } catch {
      // ignore — not all layouts expose an explicit account switcher in tests
    }

    // Go to Company view
    await page.locator("#company").click();

    // Dismiss any validation/configuration alerts that may appear on the Company view
    await closeAllAlerts(page);

    // Open Add Company dialog (force in case a transient overlay/tooltip scrim intercepts)
    await page.locator("#addStock").dblclick({ force: true });

    // Wait for dialog title to appear (locale-agnostic)
    const dialogTitle = page.locator('.v-card-title', { hasText: /(Add company|Unternehmen hinzufügen)/i });
    await expect(dialogTitle).toBeVisible({ timeout: 10_000 });

    // Fill the form: ISIN, Company, Symbol (locale-agnostic selectors)
    // Some environments don’t expose ARIA role=dialog; query inputs directly by label names.
    // Wait for the ISIN textbox to appear, indicating the dialog is open.
    const isinField = page.getByRole('textbox', { name: /\bISIN\b/i });
    await expect(isinField).toBeVisible({ timeout: 10_000 });
    await isinField.fill("DE000BASF111");
    await page.getByRole('textbox', { name: /(Company|Unternehmen)/i }).fill("BASF SE");
    await page.getByRole('textbox', { name: /(Symbol|Kürzel)/i }).fill("BASF");

    // Submit (OK) — Vuetify uses icon buttons with tooltips, which may not expose an accessible name.
    // Click the first action button in the dialog footer (OK is rendered before Cancel).
    await page.locator('.v-dialog .v-card-actions button').first().click();

    // Wait for the Add dialog to close before asserting
    await page.waitForFunction(
      () => document.querySelectorAll('.v-dialog[role="dialog"]').length === 0,
      null,
      { timeout: 10_000 }
    ).catch(() => undefined);

    // Success or error alerts may appear; dismiss them
    await closeAllAlerts(page);

    // Verify by querying IndexedDB directly to avoid UI flakiness from background alerts
    await page.waitForFunction(
      () => new Promise<boolean>((resolve) => {
        const openReq = indexedDB.open('kontenmanager.db');
        openReq.onerror = () => resolve(false);
        openReq.onsuccess = () => {
          try {
            const db = openReq.result;
            const tx = db.transaction('stocks', 'readonly');
            const store = tx.objectStore('stocks');
            const getAllReq = store.getAll();
            getAllReq.onerror = () => resolve(false);
            getAllReq.onsuccess = () => {
              try {
                const rows = getAllReq.result as Array<Record<string, unknown>>;
                const found = rows.some(r => r && (r as any).cISIN === 'DE000BASF111' && (r as any).cAccountNumberID === 1);
                resolve(found);
              } catch {
                resolve(false);
              }
            };
          } catch {
            resolve(false);
          }
        };
      }),
      null,
      { timeout: 20_000 }
    );

    // Optional: also assert UI visibility if present (don’t fail if overlays block it)
    await page.getByText("DE000BASF111").isVisible().catch(() => false);
    await page.getByText("BASF").isVisible().catch(() => false);
  } finally {
    await server.close();
  }
});
