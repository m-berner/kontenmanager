/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {createAppAdapter} from "@/adapters/driven/appAdapter";
import type {AppStores} from "@/adapters/driven/appAdapter";

function createStores(overrides: {
    settings?: Partial<AppStores["settings"]>;
} = {}): AppStores {
    return {
        records: {
            init: vi.fn().mockResolvedValue(undefined),
            $reset: vi.fn()
        },
        settings: {
            init: vi.fn(),
            activeAccountId: 1,
            exchanges: ["EURUSD"],
            service: "wstreet",
            ...overrides.settings
        },
        runtime: {
            curUsd: 0,
            curEur: 0,
            infoExchanges: new Map<string, number>(),
            infoIndexes: new Map<string, number>(),
            infoMaterials: new Map<string, number>(),
            resetTeleport: vi.fn(),
            clearStocksPages: vi.fn()
        }
    };
}

describe("appAdapter", () => {
    let mockGetStorage: ReturnType<typeof vi.fn>;
    let storageAdapterDep: ReturnType<typeof vi.fn>;
    let browserAdapterDep: {getUserLocale: ReturnType<typeof vi.fn>};
    let databaseAdapterDep: {
        connect: ReturnType<typeof vi.fn>;
        getAccountRecords: ReturnType<typeof vi.fn>;
        isConnected: ReturnType<typeof vi.fn>;
    };
    let fetchAdapterDep: {
        fetchExchangesData: ReturnType<typeof vi.fn>;
        fetchIndexData: ReturnType<typeof vi.fn>;
        fetchMaterialData: ReturnType<typeof vi.fn>;
    };
    let adapter: ReturnType<typeof createAppAdapter>;

    beforeEach(() => {
        mockGetStorage = vi.fn().mockResolvedValue({});
        storageAdapterDep = vi.fn(() => ({getStorage: mockGetStorage}));
        browserAdapterDep = {getUserLocale: vi.fn().mockReturnValue("de-DE")};
        databaseAdapterDep = {
            connect: vi.fn().mockResolvedValue(undefined),
            getAccountRecords: vi.fn().mockResolvedValue({
                accountsDB: [],
                bookingsDB: [],
                bookingTypesDB: [],
                stocksDB: []
            }),
            isConnected: vi.fn().mockReturnValue(true)
        };
        fetchAdapterDep = {
            fetchExchangesData: vi
                .fn()
                .mockResolvedValueOnce([
                    {key: "EURUSD", value: 1.1},
                    {key: "EUREUR", value: 1.0}
                ])
                .mockResolvedValueOnce([{key: "EURUSD", value: 1.05}]),
            fetchIndexData: vi.fn().mockResolvedValue([{key: "dax", value: 15000}]),
            fetchMaterialData: vi.fn().mockResolvedValue([{key: "au", value: 2000}])
        };

        adapter = createAppAdapter({
            browserAdapter: browserAdapterDep as any,
            storageAdapter: storageAdapterDep as any,
            databaseAdapter: databaseAdapterDep as any,
            fetchAdapter: fetchAdapterDep as any
        });
    });

    it("runs all three phases successfully and populates runtime market data", async () => {
        const stores = createStores();

        const status = await adapter.initializeApp(stores, {});

        expect(status).toEqual({
            storage: "ok",
            db: "ok",
            fetch: {exchanges: true, indexes: true, materials: true}
        });
        expect(stores.settings.init).toHaveBeenCalledWith({});
        expect(databaseAdapterDep.connect).toHaveBeenCalled();
        expect(databaseAdapterDep.getAccountRecords).toHaveBeenCalledWith(1);
        expect(stores.records.init).toHaveBeenCalled();
        expect(stores.runtime.curUsd).toBe(1.1);
        expect(stores.runtime.curEur).toBe(1.0);
        expect(stores.runtime.infoExchanges.get("EURUSD")).toBe(1.05);
        expect(stores.runtime.infoIndexes.get("dax")).toBe(15000);
        expect(stores.runtime.infoMaterials.get("au")).toBe(2000);
    });

    it("throws when storage initialization fails and never reaches the database phase", async () => {
        mockGetStorage.mockRejectedValueOnce(new Error("storage unavailable"));
        const stores = createStores();

        await expect(adapter.initializeApp(stores, {})).rejects.toThrow();
        expect(databaseAdapterDep.connect).not.toHaveBeenCalled();
    });

    it("throws when database connect fails and never reaches the external-fetch phase", async () => {
        databaseAdapterDep.connect.mockRejectedValueOnce(new Error("db down"));
        const stores = createStores();

        await expect(adapter.initializeApp(stores, {})).rejects.toThrow();
        expect(fetchAdapterDep.fetchExchangesData).not.toHaveBeenCalled();
    });

    it("throws when a currency cannot be derived from the locale, before connecting to the database", async () => {
        browserAdapterDep.getUserLocale.mockReturnValue("xx-XX");
        const stores = createStores();

        await expect(adapter.initializeApp(stores, {})).rejects.toThrow();
        expect(databaseAdapterDep.connect).not.toHaveBeenCalled();
    });

    it("resolves with an aborted status without touching storage or the database when the signal is already aborted", async () => {
        const controller = new AbortController();
        controller.abort();
        const stores = createStores();

        const status = await adapter.initializeApp(stores, {}, controller.signal);

        expect(status).toEqual({
            storage: "aborted",
            db: "aborted",
            fetch: {exchanges: false, indexes: false, materials: false}
        });
        expect(mockGetStorage).not.toHaveBeenCalled();
        expect(databaseAdapterDep.connect).not.toHaveBeenCalled();
    });

    it("skips all external fetch calls when the selected provider is 'none', while storage/db still succeed", async () => {
        const stores = createStores({settings: {service: "none"}});

        const status = await adapter.initializeApp(stores, {});

        expect(status.storage).toBe("ok");
        expect(status.db).toBe("ok");
        expect(status.fetch).toEqual({exchanges: false, indexes: false, materials: false});
        expect(fetchAdapterDep.fetchExchangesData).not.toHaveBeenCalled();
    });

    it("tolerates a partial external-fetch failure without throwing", async () => {
        fetchAdapterDep.fetchMaterialData.mockRejectedValueOnce(new Error("materials down"));
        const stores = createStores();

        const status = await adapter.initializeApp(stores, {});

        expect(status.fetch.materials).toBe(false);
        expect(status.fetch.indexes).toBe(true);
        expect(status.fetch.exchanges).toBe(true);
    });

    it("reset() resets teleport, clears stocks pages, and resets the records store", async () => {
        const stores = createStores();

        await adapter.reset(stores);

        expect(stores.runtime.resetTeleport).toHaveBeenCalled();
        expect(stores.runtime.clearStocksPages).toHaveBeenCalled();
        expect(stores.records.$reset).toHaveBeenCalled();
    });

    it("getStatus() returns the snapshot captured by the last initializeApp call", async () => {
        const stores = createStores();
        const status = await adapter.initializeApp(stores, {});

        expect(adapter.getStatus(stores)).toBe(status);
    });

    it("getStatus() derives a live snapshot from store state when initializeApp has not run yet", () => {
        const stores = createStores();
        stores.runtime.infoExchanges.set("EURUSD", 1.1);
        databaseAdapterDep.isConnected.mockReturnValue(true);

        const status = adapter.getStatus(stores);

        expect(status).toEqual({
            storage: "ok",
            db: "ok",
            fetch: {exchanges: true, indexes: false, materials: false}
        });
    });

    it("getStatus() derives an error snapshot when the database is not connected and nothing has been fetched", () => {
        const stores = createStores();
        databaseAdapterDep.isConnected.mockReturnValue(false);

        const status = adapter.getStatus(stores);

        expect(status).toEqual({
            storage: "error",
            db: "error",
            fetch: {exchanges: false, indexes: false, materials: false}
        });
    });
});