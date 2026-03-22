/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {setActiveTestPinia} from "@test/pinia";
import {attachStoreDeps} from "@/adapters/primary/stores/deps";
import {useRuntimeStore} from "@/adapters/primary/stores/runtime";
import {useStocksStore} from "@/adapters/primary/stores/stocks";
import {useSettingsStore} from "@/adapters/primary/stores/settings";
import {importDatabaseUsecase} from "@/app/usecases/backup";
import {BROWSER_STORAGE, CACHE_POLICY, DATE, INDEXED_DB} from "@/domain/constants";
import type {ModernBackupData, StockItem} from "@/domain/types";

describe("backup import refresh integration", () => {
    it("import invalidates caches so portfolio online reload runs afterward", async () => {
        const pinia = setActiveTestPinia();

        const clearCache = vi.fn();

        attachStoreDeps(pinia, {
            storageAdapter: () => ({
                clearStorage: vi.fn().mockResolvedValue(undefined),
                getStorage: vi.fn().mockResolvedValue({
                    [BROWSER_STORAGE.SERVICE.key]: BROWSER_STORAGE.SERVICE.value
                }),
                setStorage: vi.fn().mockResolvedValue(undefined),
                addStorageChangedListener: vi.fn(() => vi.fn()),
                installStorageLocal: vi.fn().mockResolvedValue(undefined)
            }),
            alertService: {
                feedbackInfo: vi.fn(),
                feedbackWarning: vi.fn(),
                feedbackConfirm: vi.fn(),
                feedbackError: vi.fn()
            }
        });

        const runtime = useRuntimeStore(pinia);
        const stocks = useStocksStore(pinia);
        const settings = useSettingsStore(pinia);

        settings.activeAccountId = 1;
        settings.stocksPerPage = 10;

        stocks.items = [
            {
                cID: 1,
                cCompany: "Test",
                cISIN: "US123",
                cSymbol: "T",
                cFadeOut: 0,
                cFirstPage: 0,
                cURL: "",
                cMeetingDay: DATE.ISO,
                cQuarterDay: DATE.ISO,
                cAccountNumberID: 1,
                cAskDates: DATE.ISO,
                ...INDEXED_DB.STORE.STOCK_MEMORY
            } satisfies StockItem
        ];

        runtime.markStocksPageLoaded(1);
        expect(runtime.isStocksPageFresh(1, CACHE_POLICY.ONLINE_RATES_MAX_AGE_MS)).toBe(true);

        const backup: ModernBackupData = {
            sm: {cVersion: 1, cDBVersion: INDEXED_DB.CURRENT_VERSION, cEngine: "indexeddb"},
            accounts: [],
            bookings: [],
            bookingTypes: [],
            stocks: []
        };

        const onImported = vi.fn();
        const onError = vi.fn();

        await importDatabaseUsecase(
            {
                importExportService: {
                    readJsonFile: vi.fn().mockResolvedValue(backup),
                    validateBackup: vi.fn().mockReturnValue({isValid: true, version: backup.sm.cDBVersion}),
                    validateLegacyDataIntegrity: vi.fn().mockReturnValue([]),
                    validateDataIntegrity: vi.fn().mockReturnValue([]),
                    transformLegacyStock: vi.fn(),
                    transformLegacyBooking: vi.fn()
                } as never,
                atomicImport: vi.fn().mockResolvedValue(undefined),
                records: {
                    accounts: {items: []},
                    init: vi.fn().mockResolvedValue(undefined)
                } as never,
                settings,
                runtime,
                setStorage: vi.fn().mockResolvedValue(undefined),
                clearStocksPages: () => runtime.clearStocksPages(),
                clearHttpCache: clearCache
            },
            {
                fileBlob: new Blob(["{}"], {type: "application/json"}),
                initMessages: {title: "t", message: "m"},
                legacyDefaultBookingTypeLabels: {
                    buy: "buy",
                    sell: "sell",
                    dividend: "dividend",
                    other: "other",
                    fee: "fee",
                    tax: "tax"
                },
                onResetFileInput: vi.fn(),
                onInvalidBackup: vi.fn(),
                onLegacyAlreadyRestored: vi.fn(),
                onIntegrityErrors: vi.fn(),
                confirmProceed: vi.fn().mockResolvedValue(true),
                onUnsupportedVersion: vi.fn(),
                onImported,
                onError
            }
        );

        expect(runtime.loadedStocksPages.has(1)).toBe(false);
        expect(onError).not.toHaveBeenCalled();
        expect(onImported).toHaveBeenCalledTimes(1);
        expect(clearCache).toHaveBeenCalledTimes(1);
        expect(runtime.isStocksPageFresh(1, CACHE_POLICY.ONLINE_RATES_MAX_AGE_MS)).toBe(false);
    });
});
