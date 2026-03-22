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

test("background smoke (firefox): registers listeners and initializes storage defaults", async ({page, browserName}) => {
  expect(browserName).toBe("firefox");

  const repoRoot = process.cwd();
  const buildDir = path.join(repoRoot, ADDON_ID);
  const backgroundHtmlPath = path.join(buildDir, "entrypoints", "background.html");

  await expect(async () => fs.access(backgroundHtmlPath)).resolves.toBeUndefined();

  const server = await startStaticServer(buildDir);
  try {
    await page.addInitScript(() => {
      type Listener = (...args: unknown[]) => unknown;

      const installedListeners: Listener[] = [];
      const clickedListeners: Listener[] = [];

      const calls = {
        storageSet: [] as Array<Record<string, unknown>>,
        tabsCreate: 0,
        tabsQuery: 0,
        tabsUpdate: 0,
        windowsUpdate: 0,
        tabsRemove: [] as number[]
      };

      const storage = new Map<string, unknown>();

      const state = {
        tabsQueryResult: [] as Array<{id?: number; windowId?: number}>
      };

      (window as unknown as {__kmTest: unknown}).__kmTest = {
        installedListeners,
        clickedListeners,
        calls,
        state,
        fireInstalled: async () => {
          for (const cb of installedListeners) {
            await cb(undefined);
          }
        },
        fireClicked: async () => {
          for (const cb of clickedListeners) {
            await cb({id: 1, windowId: 1});
          }
        }
      };

      (window as unknown as {browser: unknown}).browser = {
        i18n: {getMessage: (key: string) => key},
        runtime: {
          getURL: (p: string) => p,
          getManifest: () => ({manifest_version: 3, name: "KontenManager", version: "0.0.0"}),
          onInstalled: {
            addListener: (cb: Listener) => installedListeners.push(cb),
            removeListener: () => undefined
          },
          openOptionsPage: async () => undefined
        },
        action: {
          onClicked: {
            addListener: (cb: Listener) => clickedListeners.push(cb),
            removeListener: () => undefined
          }
        },
        tabs: {
          create: async () => {
            calls.tabsCreate += 1;
            return {id: 1, windowId: 1};
          },
          query: async () => {
            calls.tabsQuery += 1;
            return state.tabsQueryResult as unknown[];
          },
          update: async () => {
            calls.tabsUpdate += 1;
            return {id: 1, windowId: 1};
          },
          remove: async (tabId: number) => {
            calls.tabsRemove.push(tabId);
          }
        },
        windows: {
          update: async () => {
            calls.windowsUpdate += 1;
            return {id: 1};
          }
        },
        notifications: {create: async () => undefined},
        downloads: {
          download: async () => 1,
          onChanged: {addListener: () => undefined, removeListener: () => undefined}
        },
        storage: {
          local: {
            get: async (keys?: unknown) => {
              if (keys == null) {
                const out: Record<string, unknown> = {};
                for (const [k, v] of storage.entries()) out[k] = v;
                return out;
              }
              const arr = Array.isArray(keys) ? keys : [keys];
              const out: Record<string, unknown> = {};
              for (const k of arr) out[String(k)] = storage.get(String(k));
              return out;
            },
            set: async (items: Record<string, unknown>) => {
              calls.storageSet.push({...items});
              for (const [k, v] of Object.entries(items)) storage.set(k, v);
            },
            remove: async () => undefined,
            clear: async () => undefined
          },
          onChanged: {addListener: () => undefined, removeListener: () => undefined}
        }
      };
    });

    await page.goto(`${server.baseUrl}/entrypoints/background.html`, {waitUntil: "domcontentloaded"});

    await page.waitForFunction(() => {
      const t = (window as unknown as {__kmTest?: {installedListeners: unknown[]; clickedListeners: unknown[]}}).__kmTest;
      return !!t && t.installedListeners.length === 1 && t.clickedListeners.length === 1;
    });

    // Simulate install/update event: storageAdapter.installStorageLocal should set defaults.
    await page.evaluate(async () => {
      const t = (window as unknown as {__kmTest: {fireInstalled: () => Promise<void>}}).__kmTest;
      await t.fireInstalled();
    });

    const storageSetCalls = await page.evaluate(() => {
      const t = (window as unknown as {__kmTest: {calls: {storageSet: Array<Record<string, unknown>>}}}).__kmTest;
      return t.calls.storageSet;
    });

    expect(storageSetCalls.length).toBeGreaterThan(0);
    expect(storageSetCalls.some((c) => Object.prototype.hasOwnProperty.call(c, "sActiveAccountId"))).toBe(true);

    // Simulate toolbar click: no tabs -> create a new one.
    await page.evaluate(() => {
      const t = (window as unknown as {__kmTest: {state: {tabsQueryResult: unknown[]}}}).__kmTest;
      t.state.tabsQueryResult = [];
    });
    await page.evaluate(async () => {
      const t = (window as unknown as {__kmTest: {fireClicked: () => Promise<void>}}).__kmTest;
      await t.fireClicked();
    });
    const createCount = await page.evaluate(() => {
      const t = (window as unknown as {__kmTest: {calls: {tabsCreate: number}}}).__kmTest;
      return t.calls.tabsCreate;
    });
    expect(createCount).toBe(1);

    // Now simulate existing tabs: first is focused, remaining are closed.
    await page.evaluate(() => {
      const t = (window as unknown as {__kmTest: {state: {tabsQueryResult: Array<{id?: number; windowId?: number}>}}}).__kmTest;
      t.state.tabsQueryResult = [
        {id: 10, windowId: 1},
        {id: 11, windowId: 1}
      ];
    });
    await page.evaluate(async () => {
      const t = (window as unknown as {__kmTest: {fireClicked: () => Promise<void>}}).__kmTest;
      await t.fireClicked();
    });

    const calls = await page.evaluate(() => {
      const t = (window as unknown as {__kmTest: {calls: unknown}}).__kmTest;
      return t.calls as {
        tabsUpdate: number;
        windowsUpdate: number;
        tabsRemove: number[];
      };
    });
    expect(calls.windowsUpdate).toBeGreaterThan(0);
    expect(calls.tabsUpdate).toBeGreaterThan(0);
    expect(calls.tabsRemove).toContain(11);
  } finally {
    await server.close();
  }
});

