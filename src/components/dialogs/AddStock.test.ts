/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {createPinia, setActivePinia} from "pinia";
import {useStockForm} from "@/composables/useForms";
import {useSettingsStore} from "@/stores/settings";
import {useRecordsStore} from "@/stores/records";
import {useRuntimeStore} from "@/stores/runtime";
import {databaseService} from "@/services/database/service";

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

describe("AddStock Logic Test", () => {
    beforeEach(async () => {
        setActivePinia(createPinia());

        // Mock connection state
        vi.spyOn(databaseService, "isConnected").mockReturnValue(true);
    });

    it("should add a stock and verify it reaches the database service", async () => {
        const {stockFormData, mapStockFormToDb} = useStockForm();
        const records = useRecordsStore();
        const settings = useSettingsStore();
        const runtime = useRuntimeStore();

        // 0. Setup active account
        settings.activeAccountId = 1;

        // 1. Setup form data
        stockFormData.isin = "US0378331005";
        stockFormData.company = "Apple Inc.";
        stockFormData.symbol = "AAPL";

        // 2. Mock the DB add operation success
        const stocksRepo = databaseService.getRepository("stocks");
        const saveSpy = vi.spyOn(stocksRepo, "save").mockResolvedValue(456);

        // Mock refreshOnlineData to avoid network calls or heavy logic
        vi.spyOn(records.stocks, "refreshOnlineData").mockResolvedValue(undefined);

        // 3. Directly test the mapping and adding logic (simulating onClickOk's core operation)
        const stockData = mapStockFormToDb(settings.activeAccountId);

        const addStockID = await stocksRepo.save(stockData as any);

        if (addStockID !== -1) {
            records.stocks.add({...stockData, cID: addStockID as number});
            await records.stocks.refreshOnlineData(runtime.stocksPage);
        }

        // 4. Verify database interaction
        expect(saveSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                cISIN: "US0378331005",
                cCompany: "Apple Inc.",
                cSymbol: "AAPL",
                cAccountNumberID: 1
            })
        );

        // 5. Verify store updates
        expect(records.stocks.items).toHaveLength(1);
        expect(records.stocks.items[0].cID).toBe(456);
        expect(records.stocks.refreshOnlineData).toHaveBeenCalled();
    });
});
