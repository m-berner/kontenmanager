/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {storageAdapter} from "@/adapters/driven/storageAdapter";
import {BROWSER_STORAGE} from "@/domain/constants";

describe("storageAdapter", () => {
    let browserMock: {
        storage: {
            local: {
                get: ReturnType<typeof vi.fn>;
                set: ReturnType<typeof vi.fn>;
                clear: ReturnType<typeof vi.fn>;
            };
            onChanged: {
                addListener: ReturnType<typeof vi.fn>;
                removeListener: ReturnType<typeof vi.fn>;
            };
        };
    };

    beforeEach(() => {
        browserMock = {
            storage: {
                local: {
                    get: vi.fn().mockResolvedValue({}),
                    set: vi.fn().mockResolvedValue(undefined),
                    clear: vi.fn().mockResolvedValue(undefined)
                },
                onChanged: {
                    addListener: vi.fn(),
                    removeListener: vi.fn()
                }
            }
        };
        vi.stubGlobal("browser", browserMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("getStorage() forwards keys and returns the raw result", async () => {
        browserMock.storage.local.get.mockResolvedValue({sSkin: "ocean"});
        const adapter = storageAdapter();

        const result = await adapter.getStorage(["sSkin"]);

        expect(browserMock.storage.local.get).toHaveBeenCalledWith(["sSkin"]);
        expect(result).toEqual({sSkin: "ocean"});
    });

    it("getStorage() wraps a rejected browser API call in an AppError", async () => {
        browserMock.storage.local.get.mockRejectedValue(new Error("quota exceeded"));
        const adapter = storageAdapter();

        await expect(adapter.getStorage()).rejects.toThrow();
    });

    it("setStorage() writes the key/value pair", async () => {
        const adapter = storageAdapter();

        await adapter.setStorage("sSkin", "night");

        expect(browserMock.storage.local.set).toHaveBeenCalledWith({sSkin: "night"});
    });

    it("setStorage() wraps a rejected browser API call in an AppError", async () => {
        browserMock.storage.local.set.mockRejectedValue(new Error("write failed"));
        const adapter = storageAdapter();

        await expect(adapter.setStorage("sSkin", "night")).rejects.toThrow();
    });

    it("clearStorage() clears local storage", async () => {
        const adapter = storageAdapter();

        await adapter.clearStorage();

        expect(browserMock.storage.local.clear).toHaveBeenCalled();
    });

    it("clearStorage() wraps a rejected browser API call in an AppError", async () => {
        browserMock.storage.local.clear.mockRejectedValue(new Error("clear failed"));
        const adapter = storageAdapter();

        await expect(adapter.clearStorage()).rejects.toThrow();
    });

    it("installStorageLocal() only backfills keys missing from existing storage", async () => {
        browserMock.storage.local.get.mockResolvedValue({
            [BROWSER_STORAGE.SERVICE.key]: "tgate"
        });
        const adapter = storageAdapter();

        await adapter.installStorageLocal();

        const [updates] = browserMock.storage.local.set.mock.calls[0];
        expect(updates).not.toHaveProperty(BROWSER_STORAGE.SERVICE.key);
        expect(updates).toHaveProperty(BROWSER_STORAGE.SKIN.key, BROWSER_STORAGE.SKIN.value);
        expect(updates).toHaveProperty(
            BROWSER_STORAGE.EXCHANGES.key,
            BROWSER_STORAGE.EXCHANGES.value
        );
    });

    it("installStorageLocal() copies array defaults instead of sharing the constant's reference", async () => {
        browserMock.storage.local.get.mockResolvedValue({});
        const adapter = storageAdapter();

        await adapter.installStorageLocal();

        const [updates] = browserMock.storage.local.set.mock.calls[0];
        expect(updates[BROWSER_STORAGE.EXCHANGES.key]).toEqual(BROWSER_STORAGE.EXCHANGES.value);
        expect(updates[BROWSER_STORAGE.EXCHANGES.key]).not.toBe(BROWSER_STORAGE.EXCHANGES.value);
    });

    it("installStorageLocal() writes nothing when every key already exists", async () => {
        const seeded: Record<string, unknown> = {};
        for (const entry of Object.values(BROWSER_STORAGE)) {
            seeded[entry.key] = entry.value;
        }
        browserMock.storage.local.get.mockResolvedValue(seeded);
        const adapter = storageAdapter();

        await adapter.installStorageLocal();

        expect(browserMock.storage.local.set).not.toHaveBeenCalled();
    });

    it("addStorageChangedListener() only forwards changes from the 'local' area", () => {
        const adapter = storageAdapter();
        const callback = vi.fn();

        adapter.addStorageChangedListener(callback);
        const registered = browserMock.storage.onChanged.addListener.mock.calls[0][0];

        registered({sSkin: {newValue: "night"}}, "sync");
        expect(callback).not.toHaveBeenCalled();

        registered({sSkin: {newValue: "night"}}, "local");
        expect(callback).toHaveBeenCalledWith({sSkin: {newValue: "night"}}, "local");
    });

    it("addStorageChangedListener() returns an unsubscribe function", () => {
        const adapter = storageAdapter();
        const unsubscribe = adapter.addStorageChangedListener(vi.fn());

        unsubscribe();

        expect(browserMock.storage.onChanged.removeListener).toHaveBeenCalled();
    });
});