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
    accounts?: AppStores["records"]["accounts"]["items"];
} = {}): AppStores {
    return {
        records: {
            init: vi.fn().mockResolvedValue(undefined),
            // `clean`, not `$reset`: useRecordsStore is a Pinia setup store and
            // setup stores do not implement $reset() — calling it throws.
            clean: vi.fn(),
            // Phase 3 reads this to resolve the display currency, which decides
            // which FX pairs it asks for. Defaults to a EUR account so the
            // existing expectations (base pair "EURUSD") still describe the
            // same scenario they did when the currency came from the locale.
            accounts: {items: overrides.accounts ?? [{cID: 1, cCurrency: "EUR"}]}
        },
        settings: {
            init: vi.fn(),
            activeAccountId: 1,
            exchanges: ["EURUSD"],
            service: "wstreet",
            currency: "EUR",
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
    let browserAdapterDep: { getUserLocale: ReturnType<typeof vi.fn> };
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

    // materials and indexes were two independently-selectable data sources
    // (settings.materialsService / settings.indexesService) before being
    // merged into one settings.marketDataService on request: they must
    // always use the SAME provider, never two different ones. These pin
    // that fetchExternalData resolves it once and passes the identical
    // value to both fetchIndexData and fetchMaterialData.
    describe("marketDataService (shared by materials and indexes)", () => {
        it("passes the configured provider to both fetchIndexData and fetchMaterialData", async () => {
            const stores = createStores({settings: {marketDataService: "wstreet"}});

            await adapter.initializeApp(stores, {});

            expect(fetchAdapterDep.fetchIndexData).toHaveBeenCalledWith(expect.anything(), "wstreet");
            expect(fetchAdapterDep.fetchMaterialData).toHaveBeenCalledWith(expect.anything(), "wstreet");
        });

        it("defaults both to fnet when marketDataService is unset", async () => {
            const stores = createStores();

            await adapter.initializeApp(stores, {});

            expect(fetchAdapterDep.fetchIndexData).toHaveBeenCalledWith(expect.anything(), "fnet");
            expect(fetchAdapterDep.fetchMaterialData).toHaveBeenCalledWith(expect.anything(), "fnet");
        });

        it("falls back to fnet for an unrecognized value rather than silently switching data sources", async () => {
            // Mirrors syncFromStorage's own fallback contract: an unset or
            // unrecognized value must not be treated as "wstreet" by accident.
            const stores = createStores({settings: {marketDataService: "bogus"}});

            await adapter.initializeApp(stores, {});

            expect(fetchAdapterDep.fetchIndexData).toHaveBeenCalledWith(expect.anything(), "fnet");
            expect(fetchAdapterDep.fetchMaterialData).toHaveBeenCalledWith(expect.anything(), "fnet");
        });
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

    // The "no currency could be derived" case is gone along with the derivation.
    // Currency is no longer parsed out of the UI locale (which could fail to map,
    // and which was the wrong input anyway) — it is the active account's
    // `cCurrency`, with the app-level default as a fallback, so it always
    // resolves. These two tests pin the replacement behaviour.
    it("fetches the FX pairs for the ACTIVE ACCOUNT's currency, not the browser locale's", async () => {
        // An English-language browser holding a USD account. Under the old
        // locale-derived rule these agreed by accident; the interesting case is
        // that the ACCOUNT is what decides, so make the locale disagree with it.
        browserAdapterDep.getUserLocale.mockReturnValue("de-DE");
        const stores = createStores({
            accounts: [{cID: 1, cCurrency: "USD"}],
            settings: {currency: "EUR"}
        });

        await adapter.initializeApp(stores, {});

        const calls = fetchAdapterDep.fetchExchangesData.mock.calls;
        // Base list is USD-relative: USDUSD is the self-pair and dropped, so only
        // USDEUR is requested, and curUsd is seeded to 1 rather than fetched.
        expect(calls[0][0]).toEqual(["USDEUR"]);
        expect(stores.runtime.curUsd).toBe(1);
    });

    it("falls back to the app-level default currency when no account is active", async () => {
        const stores = createStores({
            accounts: [],
            settings: {activeAccountId: -1, currency: "USD"}
        });

        await adapter.initializeApp(stores, {});

        expect(fetchAdapterDep.fetchExchangesData.mock.calls[0][0]).toEqual(["USDEUR"]);
    });

    // `curUsd`/`curEur` are the divisors every quote is converted by, and they
    // used to have exactly one writer: Phase 3, reachable only from
    // initializeApp, which runs once at mount. The pairs it fetches come from
    // the currency active AT BOOT and the self-pair is seeded to 1 — so
    // switching to an account with the other cCurrency left one divisor a stale
    // rate and the other a 1 that was no longer correct, and a EUR-quoted stock
    // displayed its EUR price verbatim as USD (or the mirror image), silently.
    describe("refreshExchangeRates", () => {
        it("re-fetches the pairs for the CURRENT display currency, not the boot one", async () => {
            const stores = createStores();

            await adapter.initializeApp(stores, {});
            expect(fetchAdapterDep.fetchExchangesData.mock.calls[0][0]).toEqual(["EURUSD"]);
            expect(stores.runtime.curUsd).toBe(1.1);
            expect(stores.runtime.curEur).toBe(1);

            // The user switches to a USD-denominated account.
            stores.records.accounts.items = [{cID: 2, cCurrency: "USD"}];
            stores.settings.activeAccountId = 2;
            fetchAdapterDep.fetchExchangesData.mockClear();

            await adapter.refreshExchangeRates(stores);

            expect(fetchAdapterDep.fetchExchangesData).toHaveBeenCalledTimes(1);
            expect(fetchAdapterDep.fetchExchangesData.mock.calls[0][0]).toEqual(["USDEUR"]);
            // Both divisors now describe USD: the self-pair is 1, and the other
            // is freshly fetched. Before the fix curEur was still the 1 seeded
            // for EUR at boot, so a EUR-quoted stock was left unconverted.
            expect(stores.runtime.curUsd).toBe(1);
            expect(stores.runtime.curEur).toBe(1.0);
        });

        it("resets both divisors to 1 when the fetch fails, rather than keeping the previous currency's rate", async () => {
            const stores = createStores();
            await adapter.initializeApp(stores, {});
            expect(stores.runtime.curUsd).toBe(1.1);

            stores.records.accounts.items = [{cID: 2, cCurrency: "USD"}];
            stores.settings.activeAccountId = 2;
            fetchAdapterDep.fetchExchangesData.mockRejectedValueOnce(new Error("offline"));

            const ok = await adapter.refreshExchangeRates(stores);

            expect(ok).toBe(false);
            // 1 shows the quote unconverted — the same choice useOnlineStockData
            // and InfoBar already make for a missing rate. Leaving 1.1 would
            // convert USD prices by the old EUR account's rate.
            expect(stores.runtime.curUsd).toBe(1);
            expect(stores.runtime.curEur).toBe(1);
        });

        it("does not re-fetch indexes or materials, which are currency-independent", async () => {
            const stores = createStores();
            await adapter.initializeApp(stores, {});
            fetchAdapterDep.fetchIndexData.mockClear();
            fetchAdapterDep.fetchMaterialData.mockClear();

            await adapter.refreshExchangeRates(stores);

            expect(fetchAdapterDep.fetchIndexData).not.toHaveBeenCalled();
            expect(fetchAdapterDep.fetchMaterialData).not.toHaveBeenCalled();
        });

        it("skips the network entirely when the provider is disabled", async () => {
            const stores = createStores({settings: {service: "none"}});

            const ok = await adapter.refreshExchangeRates(stores);

            expect(ok).toBe(false);
            expect(fetchAdapterDep.fetchExchangesData).not.toHaveBeenCalled();
        });

        // No test for the `basePairs.length === 0` branch: with
        // CURRENCIES.SUPPORTED = ["EUR", "USD"] one of the two derived codes is
        // always a real pair, so it is unreachable. It is a guard for a future
        // single-currency configuration, not live behaviour, and a test that
        // set it up would be asserting against a mock rather than the code.

        it("does not write anything once the signal is aborted", async () => {
            const stores = createStores();
            const controller = new AbortController();
            controller.abort();

            const ok = await adapter.refreshExchangeRates(stores, controller.signal);

            expect(ok).toBe(false);
            expect(fetchAdapterDep.fetchExchangesData).not.toHaveBeenCalled();
        });
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

        // Storage has genuinely not been read yet at this point — nothing has
        // called initializeApp — so "error" is the honest answer. It used to
        // report "ok" here purely because the fixture's activeAccountId is 1.
        expect(status).toEqual({
            storage: "error",
            db: "ok",
            fetch: {exchanges: true, indexes: false, materials: false}
        });
    });

    // storage and db are independent subsystems (browser.storage.local vs
    // IndexedDB). getStatus used to derive BOTH from the database connection
    // flag, so a disconnected DB claimed storage was broken too.
    it("getStatus() reports a db error without claiming storage also failed", async () => {
        const stores = createStores();
        await adapter.initializeApp(stores, {title: "t", message: "m"});
        databaseAdapterDep.isConnected.mockReturnValue(false);

        const status = adapter.getStatus(stores);

        expect(status.storage).toBe("ok");
        expect(status.db).toBe("error");
    });

    it("getStatus() reports storage ok for an empty install, where no account is active", async () => {
        // THE REGRESSION. `-1` is not an error value: it is
        // BROWSER_STORAGE.ACTIVE_ACCOUNT_ID's shipped default and
        // INDEXED_DB.INVALID_ID, the documented "no active account" sentinel
        // that deleteActiveAccountUsecase and the import path both deliberately
        // write. getStatus inferred storage health from
        // `activeAccountId !== -1`, so a user who had just installed the
        // extension — or had just deleted their last account — had storage
        // working perfectly and was told `storage: "error"`.
        const stores = createStores({settings: {activeAccountId: -1}});
        await adapter.initializeApp(stores, {title: "t", message: "m"});

        expect(adapter.getStatus(stores).storage).toBe("ok");
    });

    it("getStatus() reports a storage error when the storage read itself fails", async () => {
        // Phase 1 rethrows, so the failure is what makes this the real
        // negative case rather than the "not attempted yet" one above.
        mockGetStorage.mockRejectedValue(new Error("storage unavailable"));
        const stores = createStores();

        await expect(
            adapter.initializeApp(stores, {title: "t", message: "m"})
        ).rejects.toThrow();

        expect(adapter.getStatus(stores).storage).toBe("error");
    });
});