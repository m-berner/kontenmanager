/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {Page} from "@playwright/test";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";

export const ADDON_ID = "kontenmanager@gmx.de";

/**
 * Serves the built extension folder (`kontenmanager@gmx.de/`) over plain HTTP so a
 * normal Playwright page can load `app.html` like any other static site.
 */
export async function startStaticServer(rootDir: string): Promise<{baseUrl: string; close: () => Promise<void>}> {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      const pathname = decodeURIComponent(url.pathname);

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

/**
 * Provides a minimal `browser.*` stub so the extension code can run in a normal
 * web page. Must run *inside* the page context — functions can't be passed as
 * structured data via `addInitScript`'s argument — so `page.addInitScript(stubBrowser)`
 * re-defines everything from scratch in-page rather than closing over anything
 * from this module.
 */
export function stubBrowser(): void {
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
  const openOptionsPageCalls: number[] = [];
  const downloadCalls: Array<{url: string; filename: string}> = [];

  // The ambient `browser` type (webext typings) is huge; for E2E we only need a runtime stub.
  (window as unknown as {
    browser: unknown;
    __openOptionsPageCalls: number[];
    __downloadCalls: Array<{url: string; filename: string}>;
  }).browser = {
    i18n: {getMessage: (key: string) => key},
    action: {onClicked: makeEvent()},
    runtime: {
      getURL: (p: string) => p,
      getManifest: () => ({manifest_version: 3, name: "KontenManager", version: "0.0.0"}),
      onInstalled: makeEvent(),
      openOptionsPage: async () => {
        openOptionsPageCalls.push(Date.now());
      }
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
      download: async (opts: {url: string; filename: string}) => {
        downloadCalls.push({url: opts.url, filename: opts.filename});
        return downloadCalls.length;
      },
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
  (window as unknown as {__openOptionsPageCalls: number[]}).__openOptionsPageCalls = openOptionsPageCalls;
  (window as unknown as {__downloadCalls: Array<{url: string; filename: string}>}).__downloadCalls = downloadCalls;
}

/** Dismisses any visible Vuetify alert overlays that would otherwise block subsequent clicks. */
export async function closeAllAlerts(page: Page): Promise<void> {
  for (let i = 0; i < 5; i++) {
    const overlay = page.locator(".v-overlay").filter({has: page.locator(".v-alert")});
    if (await overlay.isVisible().catch(() => false)) {
      const closeBtn = overlay.locator(".v-alert__close button");
      if (await closeBtn.count()) {
        await closeBtn.first().click().catch(() => undefined);
      }
      await overlay.waitFor({state: "hidden", timeout: 10_000}).catch(() => undefined);
      await page.waitForTimeout(100);
      continue;
    }
    break;
  }
}

/** Waits until no Vuetify dialog is left open. */
export async function waitForDialogsClosed(page: Page, timeout = 15_000): Promise<void> {
  await page.waitForFunction(
    () => document.querySelectorAll('.v-dialog[role="dialog"]').length === 0,
    null,
    {timeout}
  );
}

/**
 * Boots the app against the built extension, imports the standard fixture backup
 * (one account, one booking type "BUY", one stock AAPL, one booking), and leaves
 * the app on the Home view with the alert overlay dismissed. Returns the page
 * ready for the test's own interactions.
 */
export async function bootWithFixtureImported(
  page: Page,
  repoRoot: string,
  baseUrl: string
): Promise<void> {
  await page.addInitScript(stubBrowser);
  await page.goto(`${baseUrl}/adapters/ui/entrypoints/app.html`, {waitUntil: "load"});

  await page.locator("header.v-app-bar").first().waitFor({state: "visible", timeout: 45_000});
  await page.locator("#home").click();
  await page.locator("#importDatabase").click();

  const fixturePath = path.join(repoRoot, "tests", "e2e", "fixtures", "backup.modern.min.json");
  await page.locator('input[type="file"]').setInputFiles(fixturePath);
  await page.locator('button[type="submit"]').click();

  const dialogs = page.getByRole("dialog");
  await dialogs.last().getByRole("button").last().click();
  await waitForDialogsClosed(page, 30_000);

  await closeAllAlerts(page);

  // Ensure the imported account is active and the online service is disabled so
  // no test makes real network calls or gets blocked on account-switch alerts.
  await page.evaluate(async () => {
    const b = (window as unknown as {browser: {storage: {local: {set: (_i: unknown) => Promise<void>}}}}).browser;
    await b.storage.local.set({sActiveAccountId: 1, sService: "none"});
  }).catch(() => undefined);
  await page.waitForTimeout(100);
  await closeAllAlerts(page);
}

/** Reads all rows of an IndexedDB object store. Runs inside the page context. */
export async function readStore<T>(page: Page, storeName: string): Promise<T[]> {
  return page.evaluate((name) => new Promise<unknown[]>((resolve, reject) => {
    const openReq = indexedDB.open("kontenmanager.db");
    openReq.onerror = () => reject(openReq.error);
    openReq.onsuccess = () => {
      const db = openReq.result;
      const tx = db.transaction(name, "readonly");
      const store = tx.objectStore(name);
      const getAllReq = store.getAll();
      getAllReq.onerror = () => reject(getAllReq.error);
      getAllReq.onsuccess = () => resolve(getAllReq.result as unknown[]);
    };
  }), storeName) as Promise<T[]>;
}
