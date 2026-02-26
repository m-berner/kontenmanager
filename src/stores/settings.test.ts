/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {createPinia, setActivePinia} from "pinia";
import {useSettingsStore} from "./settings";
import {BROWSER_STORAGE} from "@/domains/configs/storage";

// Mock persistence composable used by the settings store
const mockSetStorage = vi.fn();
vi.mock("@/composables/useStorage", () => ({
    useStorage: () => ({
        getStorage: vi.fn(),
        setStorage: mockSetStorage,
        addStorageChangedListener: vi.fn()
    })
}));

describe("Settings Store", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it("init() should hydrate state from provided storage", () => {
        const store = useSettingsStore();

        const storage = {
            [BROWSER_STORAGE.SKIN.key]: "forest",
            [BROWSER_STORAGE.BOOKINGS_PER_PAGE.key]: 15,
            [BROWSER_STORAGE.STOCKS_PER_PAGE.key]: 20,
            [BROWSER_STORAGE.DIVIDENDS_PER_PAGE.key]: 25,
            [BROWSER_STORAGE.SUMS_PER_PAGE.key]: 30,
            [BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key]: 42,
            [BROWSER_STORAGE.SERVICE.key]: "alphavantage",
            [BROWSER_STORAGE.MATERIALS.key]: ["au", "cu"],
            [BROWSER_STORAGE.MARKETS.key]: ["XETRA"],
            [BROWSER_STORAGE.INDEXES.key]: ["dax"],
            [BROWSER_STORAGE.EXCHANGES.key]: ["EURUSD", "USDJPY"]
        } as any;

        store.init(storage);

        expect(store.skin).toBe("forest");
        expect(store.bookingsPerPage).toBe(15);
        expect(store.stocksPerPage).toBe(20);
        expect(store.dividendsPerPage).toBe(25);
        expect(store.sumsPerPage).toBe(30);
        expect(store.activeAccountId).toBe(42);
        expect(store.service).toBe("alphavantage");
        expect(store.materials).toEqual(["au", "cu"]);
        expect(store.markets).toEqual(["XETRA"]);
        expect(store.indexes).toEqual(["dax"]);
        expect(store.exchanges).toEqual(["EURUSD", "USDJPY"]);
    });

    it("setters should update state and persist via setStorage", async () => {
        const store = useSettingsStore();

        await store.setBookingsPerPage(12 as any);
        expect(store.bookingsPerPage).toBe(12);
        expect(mockSetStorage).toHaveBeenCalledWith(
            BROWSER_STORAGE.BOOKINGS_PER_PAGE.key,
            12
        );

        await store.setStocksPerPage(18 as any);
        expect(store.stocksPerPage).toBe(18);
        expect(mockSetStorage).toHaveBeenCalledWith(
            BROWSER_STORAGE.STOCKS_PER_PAGE.key,
            18
        );

        await store.setDividendsPerPage(22 as any);
        expect(store.dividendsPerPage).toBe(22);
        expect(mockSetStorage).toHaveBeenCalledWith(
            BROWSER_STORAGE.DIVIDENDS_PER_PAGE.key,
            22
        );

        await store.setSumsPerPage(7 as any);
        expect(store.sumsPerPage).toBe(7);
        expect(mockSetStorage).toHaveBeenCalledWith(
            BROWSER_STORAGE.SUMS_PER_PAGE.key,
            7
        );

        await store.setActiveAccountId(5 as any);
        expect(store.activeAccountId).toBe(5);
        expect(mockSetStorage).toHaveBeenCalledWith(
            BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key,
            5
        );
    });
});
