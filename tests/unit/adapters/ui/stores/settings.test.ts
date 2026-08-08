/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {useSettingsStore} from "@/adapters/ui/stores/settings";
import {BROWSER_STORAGE} from "@/domain/constants";
import type {StorageDataType} from "@/domain/types";
import {attachStoreDeps} from "@/adapters/ui/stores/deps";
import {setActiveTestPinia} from "@test/pinia";

// Mock persistence domain used by the settings store
const mockSetStorage = vi.fn();
vi.mock("@/adapters/driven/storageAdapter", () => ({
    storageAdapter: () => ({
        getStorage: vi.fn(),
        setStorage: mockSetStorage,
        addStorageChangedListener: vi.fn()
    })
}));

describe("Settings Store", () => {
    beforeEach(() => {
        const pinia = setActiveTestPinia();
        attachStoreDeps(pinia, {
            storageAdapter: () => ({
                clearStorage: vi.fn().mockResolvedValue(undefined),
                getStorage: vi.fn(),
                setStorage: mockSetStorage,
                addStorageChangedListener: vi.fn(() => vi.fn()),
                installStorageLocal: vi.fn().mockResolvedValue(undefined)
            }),
            alertAdapter: {
                feedbackInfo: vi.fn(),
                feedbackWarning: vi.fn(),
                feedbackConfirm: vi.fn(),
                feedbackError: vi.fn()
            }
        });
    });

    it("init() should hydrate state from provided storage", () => {
        const store = useSettingsStore();

        const storage: StorageDataType = {
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
        };

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

        await store.setBookingsPerPage(12);
        expect(store.bookingsPerPage).toBe(12);
        expect(mockSetStorage).toHaveBeenCalledWith(
            BROWSER_STORAGE.BOOKINGS_PER_PAGE.key,
            12
        );

        await store.setStocksPerPage(18);
        expect(store.stocksPerPage).toBe(18);
        expect(mockSetStorage).toHaveBeenCalledWith(
            BROWSER_STORAGE.STOCKS_PER_PAGE.key,
            18
        );

        await store.setDividendsPerPage(22);
        expect(store.dividendsPerPage).toBe(22);
        expect(mockSetStorage).toHaveBeenCalledWith(
            BROWSER_STORAGE.DIVIDENDS_PER_PAGE.key,
            22
        );

        await store.setSumsPerPage(7);
        expect(store.sumsPerPage).toBe(7);
        expect(mockSetStorage).toHaveBeenCalledWith(
            BROWSER_STORAGE.SUMS_PER_PAGE.key,
            7
        );
    });

    // browser.storage.onChanged fires in EVERY extension context, including the
    // one that performed the write -- so every local updateSetting() round trip
    // came straight back through the listener and re-applied its own value.
    describe("cross-context storage listener", () => {
        function initWithCapturedListener() {
            let listener: ((_changes: Record<string, {newValue?: unknown}>) => void) | undefined;
            const pinia = setActiveTestPinia();
            attachStoreDeps(pinia, {
                storageAdapter: () => ({
                    clearStorage: vi.fn().mockResolvedValue(undefined),
                    getStorage: vi.fn(),
                    setStorage: mockSetStorage,
                    addStorageChangedListener: vi.fn((cb) => {
                        listener = cb;
                        return vi.fn();
                    }),
                    installStorageLocal: vi.fn().mockResolvedValue(undefined)
                }),
                alertAdapter: {
                    feedbackInfo: vi.fn(),
                    feedbackWarning: vi.fn(),
                    feedbackConfirm: vi.fn(),
                    feedbackError: vi.fn()
                }
            });

            const store = useSettingsStore();
            store.init({
                [BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key]: 42,
                [BROWSER_STORAGE.EXCHANGES.key]: ["EURUSD", "USDJPY"]
            } as StorageDataType);

            return {store, fire: (changes: Record<string, {newValue?: unknown}>) => listener?.(changes)};
        }

        it("ignores an echo of the value this context already holds", () => {
            const {store, fire} = initWithCapturedListener();
            const exchangesBefore = store.exchanges;

            fire({
                [BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key]: {newValue: 42},
                [BROWSER_STORAGE.EXCHANGES.key]: {newValue: ["EURUSD", "USDJPY"]}
            });

            expect(store.activeAccountId).toBe(42);
            // Identity, not just equality: cloneStorageValue returns a NEW array,
            // so re-applying an unchanged array changed the ref's identity and
            // re-fired every watcher on it. That is the half of this echo that
            // was not idempotent.
            expect(store.exchanges).toBe(exchangesBefore);
        });

        it("still applies a genuine cross-context change", () => {
            const {store, fire} = initWithCapturedListener();

            fire({
                [BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key]: {newValue: 7},
                [BROWSER_STORAGE.EXCHANGES.key]: {newValue: ["EURUSD"]}
            });

            expect(store.activeAccountId).toBe(7);
            expect(store.exchanges).toEqual(["EURUSD"]);
        });

        it("treats a same-length array with different contents as a change", () => {
            // Guards the element-wise half of isSameStorageValue: a length-only
            // comparison would swallow this.
            const {store, fire} = initWithCapturedListener();

            fire({[BROWSER_STORAGE.EXCHANGES.key]: {newValue: ["EURUSD", "EURGBP"]}});

            expect(store.exchanges).toEqual(["EURUSD", "EURGBP"]);
        });
    });
});
