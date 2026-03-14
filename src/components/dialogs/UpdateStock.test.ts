/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {createPinia, setActivePinia} from "pinia";
import {useStockForm} from "@/composables/useForms";
import {useStocksStore} from "@/stores/stocks";
import {useSettingsStore} from "@/stores/settings";
import {useRuntimeStore} from "@/stores/runtime";
import {createDatabaseService} from "@/services/database/service";

const testDb = createDatabaseService("test-db", 1);

// Mock browser API
const browserMock = {
    storage: {
        local: {
            get: vi.fn().mockResolvedValue({}),
            set: vi.fn().mockResolvedValue(undefined)
        }
    },
    notifications: {
        create: vi.fn().mockResolvedValue(undefined)
    },
    runtime: {
        getURL: vi.fn().mockReturnValue(""),
        getManifest: vi.fn().mockReturnValue({version: "1.0.0"})
    },
    i18n: {
        getUILanguage: vi.fn().mockReturnValue("de-DE")
    }
};
vi.stubGlobal("browser", browserMock);

describe("UpdateStock Logic Test", () => {
    beforeEach(async () => {
        setActivePinia(createPinia());

        // Mock connection state
        vi.spyOn(testDb, "isConnected").mockReturnValue(true);
    });

    it("should update a stock and verify it reaches the database service", async () => {
        const {stockFormData, mapStockFormToDb} = useStockForm();
        const stocksStore = useStocksStore();
        const settings = useSettingsStore();
        const runtime = useRuntimeStore();

        settings.activeAccountId = 1;
        runtime.activeId = 123;

        // 1. Initial state
        const initialStock = {
            cID: 123,
            cISIN: "US0378331002",
            cCompany: "Apple Inc.",
            cSymbol: "AAPL",
            cMeetingDay: "",
            cQuarterDay: "",
            cFadeOut: 0,
            cFirstPage: 0,
            cURL: "",
            cAccountNumberID: 1,
            cAskDates: "2025-01-01"
        };
        stocksStore.add(initialStock);

        // 2. Setup form data for update
        stockFormData.id = 123;
        stockFormData.isin = "US0378331002";
        stockFormData.company = "Apple Updated";
        stockFormData.symbol = "AAPL";
        stockFormData.fadeOut = 1;
        stockFormData.firstPage = 1;

        // 3. Mock the DB update operation
        const stocksRepo = testDb.getRepository("stocks");
        const saveSpy = vi
            .spyOn(stocksRepo, "save")
            .mockResolvedValue(123);

        // 4. Directly test the mapping and updating logic (simulating onClickOk)
        const stockData = mapStockFormToDb(settings.activeAccountId);

        // In useStocksDB.ts, it strips 'm' properties, but our form mapper already returns a clean DB object.
        // However, we simulate what the component does.
        await stocksRepo.save(stockData as any);
        stocksStore.update(stockData as any);

        // 5. Verify database interaction
        expect(saveSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                cID: 123,
                cCompany: "Apple Updated",
                cFadeOut: 1,
                cFirstPage: 1
            })
        );

        // 6. Verify store updates
        expect(stocksStore.items).toHaveLength(1);
        expect(stocksStore.items[0].cCompany).toBe("Apple Updated");
        expect(stocksStore.items[0].cFadeOut).toBe(1);
    });
});
