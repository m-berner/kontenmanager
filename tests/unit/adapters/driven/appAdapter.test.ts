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
            // `clean`, not `$reset`: useRecordsStore is a Pinia setup store and
            // setup stores do not implement $reset() — calling it throws.
            clean: vi.fn()
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
            // Keyed on the requested codes, so the same pair always yields the
            // same rate. The previous mock returned EURUSD as 1.1 to the base
            // call and 1.05 to the info call — two different rates for one
            // currency pair, which was only observable because the two calls
            // issued the SAME request twice. That duplication is now removed,
            // so a per-call mock would encode behavior the code no longer has.
            fetchExchangesData: vi.fn(async (codes: string[]) =>
                codes.map((key) => ({key, value: key === "EURUSD" ? 1.1 : 1.0}))
            ),
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
        // Seeded directly, not fetched: for a de-DE install the "EUR base pair"
        // is EUREUR, a currency against itself, whose rate is always 1.
        expect(stores.runtime.curEur).toBe(1.0);
        expect(stores.runtime.infoExchanges.get("EURUSD")).toBe(1.1);
        expect(stores.runtime.infoIndexes.get("dax")).toBe(15000);
        expect(stores.runtime.infoMaterials.get("au")).toBe(2000);
    });

    it("does not request the self-pair or re-request a configured base pair", async () => {
        // settings.exchanges defaults to ["EURUSD"], which for a de-DE install
        // IS the base USD pair — so the base and info calls used to request the
        // same URL, concurrently and without any in-flight cache sharing.
        return adapter.initializeApp(createStores(), {}).then(() => {
            const calls = fetchAdapterDep.fetchExchangesData.mock.calls;
            expect(calls).toHaveLength(2);

            // Base list: EURUSD only. EUREUR (the self-pair) is gone.
            expect(calls[0][0]).toEqual(["EURUSD"]);
            // Info list: empty, because its only entry is already covered above.
            expect(calls[1][0]).toEqual([]);
        });
    });

    it("still fetches configured exchanges that the base pair does not cover", async () => {
        const stores = createStores({settings: {exchanges: ["EURUSD", "EURGBP"]}});

        await adapter.initializeApp(stores, {});

        const calls = fetchAdapterDep.fetchExchangesData.mock.calls;
        expect(calls[0][0]).toEqual(["EURUSD"]);
        expect(calls[1][0]).toEqual(["EURGBP"]);

        // The de-duplicated pair still reaches infoExchanges, copied from the
        // base result, so InfoBar does not render it blank.
        expect(stores.runtime.infoExchanges.get("EURUSD")).toBe(1.1);
        expect(stores.runtime.infoExchanges.get("EURGBP")).toBe(1.0);
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

    // An unmappable locale no longer blocks startup. initializeDatabase used to
    // compute the currency purely to throw when it came back empty, then never
    // used the value — failing the *critical* database phase for something only
    // the *non-critical* external-fetch phase needs, which already degrades
    // gracefully on its own. The coupling was backwards.
    it("still initializes the database when no currency can be derived, degrading only the fetch phase", async () => {
        browserAdapterDep.getUserLocale.mockReturnValue("xx-XX");
        const stores = createStores();

        const status = await adapter.initializeApp(stores, {});

        expect(databaseAdapterDep.connect).toHaveBeenCalled();
        expect(status.db).toBe("ok");
        expect(status.fetch).toEqual({exchanges: false, indexes: false, materials: false});
        expect(fetchAdapterDep.fetchExchangesData).not.toHaveBeenCalled();
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

    it("reset() resets teleport, clears stocks pages, and clears the records store", async () => {
        const stores = createStores();

        await adapter.reset(stores);

        expect(stores.runtime.resetTeleport).toHaveBeenCalled();
        expect(stores.runtime.clearStocksPages).toHaveBeenCalled();
        // Calls clean(), not $reset(): the records store is a Pinia setup store,
        // which does not implement $reset() — the old call would have thrown.
        expect(stores.records.clean).toHaveBeenCalled();
    });

    // Derived live, NOT returned from the boot-time snapshot. The old body
    // computed the live values and then returned `lastStatusSnapshot ?? derived`
    // — and since the snapshot is assigned on every exit path of initializeApp
    // (success, abort AND catch), it was always set after boot and `derived` was
    // always discarded. Wired to a status indicator that would have frozen at
    // boot-time status and could never reflect a later DB disconnect, which
    // connectionManager explicitly performs on onversionchange.
    it("getStatus() reflects a disconnect that happened after a successful boot", async () => {
        const stores = createStores();
        databaseAdapterDep.isConnected.mockReturnValue(true);
        const bootStatus = await adapter.initializeApp(stores, {});
        expect(bootStatus.db).toBe("ok");

        databaseAdapterDep.isConnected.mockReturnValue(false);

        expect(adapter.getStatus(stores).db).toBe("error");
    });

    // The one thing the snapshot still contributes. An aborted phase is
    // indistinguishable from a failed one when observed live (both are simply
    // "not ok"), so a remembered "aborted" is preferred over a live "error" —
    // but never over a live "ok", since a phase that works now works now.
    it("getStatus() prefers a remembered 'aborted' over a live 'error'", async () => {
        const stores = createStores();
        const controller = new AbortController();
        controller.abort();

        const bootStatus = await adapter.initializeApp(stores, {}, controller.signal);
        expect(bootStatus.db).toBe("aborted");

        databaseAdapterDep.isConnected.mockReturnValue(false);

        expect(adapter.getStatus(stores).db).toBe("aborted");
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

    // storage and db are independent subsystems (browser.storage.local vs
    // IndexedDB). getStatus used to derive BOTH from the database connection
    // flag, so a disconnected DB claimed storage was broken too.
    it("getStatus() reports a db error without claiming storage also failed", () => {
        const stores = createStores(); // activeAccountId 1 => settings.init() ran
        databaseAdapterDep.isConnected.mockReturnValue(false);

        const status = adapter.getStatus(stores);

        expect(status).toEqual({
            storage: "ok",
            db: "error",
            fetch: {exchanges: false, indexes: false, materials: false}
        });
    });

    it("getStatus() reports a storage error when settings were never initialized", () => {
        // -1 is the documented "no active account" sentinel, i.e. settings.init()
        // never successfully populated the store.
        const stores = createStores({settings: {activeAccountId: -1}});
        databaseAdapterDep.isConnected.mockReturnValue(false);

        const status = adapter.getStatus(stores);

        expect(status).toEqual({
            storage: "error",
            db: "error",
            fetch: {exchanges: false, indexes: false, materials: false}
        });
    });
});