/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {createBrowserAdapter} from "@/adapters/driven/browserAdapter";

describe("browserAdapter.writeBufferToFile", () => {
    let onChangedListeners: Array<(_change: {id: number; state?: {current: string}}) => void>;
    let downloadMock: ReturnType<typeof vi.fn>;
    let revokeObjectURLMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        onChangedListeners = [];
        downloadMock = vi.fn().mockResolvedValue(42);

        (globalThis as unknown as {browser: unknown}).browser = {
            downloads: {
                download: downloadMock,
                onChanged: {
                    addListener: vi.fn((cb: (typeof onChangedListeners)[number]) => {
                        onChangedListeners.push(cb);
                    }),
                    removeListener: vi.fn((cb: (typeof onChangedListeners)[number]) => {
                        onChangedListeners = onChangedListeners.filter((l) => l !== cb);
                    })
                }
            }
        };

        vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
        revokeObjectURLMock = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {
        });
    });

    afterEach(() => {
        delete (globalThis as unknown as {browser?: unknown}).browser;
        vi.restoreAllMocks();
    });

    it("ignores onChanged events for other downloads", async () => {
        const adapter = createBrowserAdapter();
        await adapter.writeBufferToFile("{}", "backup.json");

        expect(onChangedListeners).toHaveLength(1);

        // An unrelated download (different id) completing must not revoke
        // this call's blob URL.
        onChangedListeners[0]({id: 999, state: {current: "complete"}});

        expect(revokeObjectURLMock).not.toHaveBeenCalled();
        expect(onChangedListeners).toHaveLength(1);
    });

    it("revokes the blob URL and removes the listener once its own download completes", async () => {
        const adapter = createBrowserAdapter();
        await adapter.writeBufferToFile("{}", "backup.json");

        expect(downloadMock).toHaveBeenCalledTimes(1);
        onChangedListeners[0]({id: 42, state: {current: "complete"}});

        expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:mock-url");
        expect(onChangedListeners).toHaveLength(0);
    });
});

describe("browserAdapter.isAppTabUrl", () => {
    const APP_URL = "moz-extension://abc123/adapters/ui/entrypoints/app.html";

    beforeEach(() => {
        (globalThis as unknown as {browser: unknown}).browser = {
            runtime: {
                getURL: (path: string) => (path === "adapters/ui/entrypoints/app.html" ? APP_URL : path)
            }
        };
    });

    afterEach(() => {
        delete (globalThis as unknown as {browser?: unknown}).browser;
    });

    it("returns true for the app page's own URL", () => {
        const adapter = createBrowserAdapter();
        expect(adapter.isAppTabUrl(APP_URL)).toBe(true);
    });

    it("returns false for an unrelated URL", () => {
        const adapter = createBrowserAdapter();
        expect(adapter.isAppTabUrl("https://example.com/")).toBe(false);
    });

    it("returns false when the URL is undefined (e.g. a brand-new tab whose navigation hasn't committed yet)", () => {
        const adapter = createBrowserAdapter();
        expect(adapter.isAppTabUrl(undefined)).toBe(false);
    });

    // The router uses createWebHashHistory(), so an app tab's URL gains a
    // "#/route" fragment the moment the user navigates. A strict equality check
    // failed for every app tab except a freshly-loaded one, silently disabling
    // background.ts's tabs.onCreated fast path — the thing that closes a native
    // "Duplicate Tab" result immediately instead of waiting for it to boot.
    it("returns true for a navigated app tab carrying a hash-router fragment", () => {
        const adapter = createBrowserAdapter();
        expect(adapter.isAppTabUrl(`${APP_URL}#/`)).toBe(true);
        expect(adapter.isAppTabUrl(`${APP_URL}#/company`)).toBe(true);
        expect(adapter.isAppTabUrl(`${APP_URL}#/help`)).toBe(true);
    });

    it("still rejects a different extension page that merely shares the prefix", () => {
        const adapter = createBrowserAdapter();
        expect(
            adapter.isAppTabUrl("moz-extension://abc123/adapters/ui/entrypoints/options.html")
        ).toBe(false);
        expect(
            adapter.isAppTabUrl("moz-extension://abc123/adapters/ui/entrypoints/app.html.other")
        ).toBe(false);
    });
});
