import {test, expect} from "@playwright/test";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";

const ADDON_ID = "kontenmanager@gmx.de";

async function startStaticServer(rootDir: string): Promise<{baseUrl: string; close: () => Promise<void>}> {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      const pathname = decodeURIComponent(url.pathname);

      // Basic path traversal guard.
      const rel = pathname.replace(/^\/+/, "");
      const filePath = path.join(rootDir, rel);
      const normalizedRoot = path.resolve(rootDir) + path.sep;
      const normalizedFile = path.resolve(filePath);
      if (!normalizedFile.startsWith(normalizedRoot)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      const stat = await fs.stat(normalizedFile).catch(() => null);
      if (!stat) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const toServe = stat.isDirectory() ? path.join(normalizedFile, "index.html") : normalizedFile;
      const data = await fs.readFile(toServe);
      const ext = path.extname(toServe).toLowerCase();
      const contentType =
        ext === ".html" ? "text/html; charset=utf-8" :
        ext === ".js" ? "application/javascript; charset=utf-8" :
        ext === ".css" ? "text/css; charset=utf-8" :
        ext === ".json" ? "application/json; charset=utf-8" :
        ext === ".png" ? "image/png" :
        "application/octet-stream";

      res.writeHead(200, {"content-type": contentType});
      res.end(data);
    } catch (e) {
      res.writeHead(500);
      res.end(String(e));
    }
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address();
  if (!addr || typeof addr === "string") throw new Error("Failed to bind server");
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  return {
    baseUrl,
    close: async () => {
      await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
    }
  };
}

test("happy path (firefox): import backup and see Company content", async ({page, browserName}) => {
  expect(browserName).toBe("firefox");

  const repoRoot = process.cwd();
  const buildDir = path.join(repoRoot, ADDON_ID);
  const manifestPath = path.join(buildDir, "manifest.json");
  const appHtmlPath = path.join(buildDir, "entrypoints", "app.html");

  await expect(async () => fs.access(manifestPath)).resolves.toBeUndefined();
  await expect(async () => fs.access(appHtmlPath)).resolves.toBeUndefined();

  const server = await startStaticServer(buildDir);
  try {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    // Provide a minimal `browser.*` stub so the extension code can run in a normal web page.
    // Must be created inside the page context (functions can't be passed as structured data).
    await page.addInitScript(() => {
      type Listener = (...args: unknown[]) => unknown;

      const storage = new Map<string, unknown>();
      const makeEvent = () => {
        const listeners = new Set<Listener>();
        return {
          addListener(cb: Listener) {
            listeners.add(cb);
          },
          removeListener(cb: Listener) {
            listeners.delete(cb);
          },
          hasListener(cb: Listener) {
            return listeners.has(cb);
          },
          _emit(...args: unknown[]) {
            for (const cb of listeners) {
              try {
                cb(...args);
              } catch {
                /* ignore */
              }
            }
          }
        };
      };

      const downloadsChanged = makeEvent();
      const storageChanged = makeEvent();

      // The ambient `browser` type (webext typings) is huge; for this E2E test we only need a runtime stub.
      (window as unknown as {browser: unknown}).browser = {
        i18n: {getMessage: (key: string) => key},
        action: {onClicked: makeEvent()},
        runtime: {
          getURL: (p: string) => p,
          getManifest: () => ({manifest_version: 3, name: "KontenManager", version: "0.0.0"}),
          onInstalled: makeEvent(),
          openOptionsPage: async () => undefined
        },
        tabs: {
          create: async () => ({id: 1, windowId: 1}),
          query: async () => ([]),
          update: async () => ({id: 1, windowId: 1}),
          remove: async () => undefined
        },
        windows: {
          update: async () => ({id: 1})
        },
        notifications: {
          create: async () => undefined
        },
        downloads: {
          download: async () => 1,
          onChanged: downloadsChanged
        },
        storage: {
          local: {
            get: async (keys: unknown) => {
              const out: Record<string, unknown> = {};
              if (keys == null) {
                for (const [k, v] of storage.entries()) out[k] = v;
                return out;
              }
              const arr = Array.isArray(keys) ? keys : [keys];
              for (const k of arr) {
                const key = String(k);
                out[key] = storage.get(key);
              }
              return out;
            },
            set: async (items: unknown) => {
              const changes: Record<string, {oldValue: unknown; newValue: unknown}> = {};
              for (const [k, v] of Object.entries(items as Record<string, unknown>)) {
                const oldValue = storage.get(k);
                storage.set(k, v);
                changes[k] = {oldValue, newValue: v};
              }
              storageChanged._emit(changes, "local");
            },
            remove: async (keys: unknown) => {
              const arr = Array.isArray(keys) ? keys : [keys];
              const changes: Record<string, {oldValue: unknown; newValue: unknown}> = {};
              for (const k of arr) {
                const key = String(k);
                if (!storage.has(key)) continue;
                const oldValue = storage.get(key);
                storage.delete(key);
                changes[key] = {oldValue, newValue: undefined};
              }
              storageChanged._emit(changes, "local");
            },
            clear: async () => {
              const changes: Record<string, {oldValue: unknown; newValue: unknown}> = {};
              for (const [k, v] of storage.entries()) {
                changes[k] = {oldValue: v, newValue: undefined};
              }
              storage.clear();
              storageChanged._emit(changes, "local");
            }
          },
          onChanged: storageChanged
        }
      };
    });

    await page.goto(`${server.baseUrl}/entrypoints/app.html`, {waitUntil: "domcontentloaded"});

    // Wait for the main header to render, then switch to "Home" so the import icon is visible
    // (`importDatabase` is hidden in the Company view).
    await page.waitForSelector("#home", {timeout: 10_000}).catch(async (e) => {
      const appHtml = await page.locator("#app").innerHTML().catch(() => "");
      throw new Error(
        [
          `App did not render HeaderBar (#home not found): ${String(e)}`,
          `pageErrors: ${pageErrors.join(" | ") || "(none)"}`,
          `consoleErrors: ${consoleErrors.join(" | ") || "(none)"}`,
          `#app innerHTML (first 500): ${appHtml.slice(0, 500) || "(empty)"}`
        ].join("\n")
      );
    });
    await page.locator("#home").click();

    // Open Import dialog via HeaderBar icon id.
    await page.locator("#importDatabase").click();

    // Upload backup file fixture.
    const fixturePath = path.join(repoRoot, "tests", "e2e", "fixtures", "backup.modern.min.json");
    await page.locator('input[type="file"]').setInputFiles(fixturePath);

    // Confirm import (OK button).
    await page.locator('button[type="submit"]').click();

    // Import flow shows a confirmation dialog (via alertService.feedbackConfirm).
    // Click the confirmation button (last button) on the top-most dialog.
    const dialogs = page.getByRole("dialog");
    await dialogs.last().getByRole("button").last().click();

    // Wait for dialogs to close (ImportDatabase dialog closes via `runtime.resetTeleport()`).
    await page.waitForFunction(
      () => document.querySelectorAll('.v-dialog[role=\"dialog\"]').length === 0,
      null,
      {timeout: 30_000}
    );

    // Import flow also shows an info alert overlay after success (via alertService.feedbackInfo).
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
    await expect(page.getByText("AAPL")).toBeVisible();
    await expect(page.getByText("US0378331005")).toBeVisible();
  } finally {
    await server.close();
  }
});
