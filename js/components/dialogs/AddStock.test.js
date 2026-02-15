import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useStockForm } from "@/composables/useForms";
import { useSettingsStore } from "@/stores/settings";
import { useRecordsStore } from "@/stores/records";
import { useRuntimeStore } from "@/stores/runtime";
import { databaseService } from "@/services/database/service";
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
        getManifest: vi.fn().mockReturnValue({ version: "1.0.0" })
    },
    i18n: {
        getUILanguage: vi.fn().mockReturnValue("de-DE")
    }
};
vi.stubGlobal("browser", browserMock);
describe("AddStock Logic Test", () => {
    beforeEach(async () => {
        setActivePinia(createPinia());
        vi.spyOn(databaseService, "isConnected").mockReturnValue(true);
    });
    it("should add a stock and verify it reaches the database service", async () => {
        const { stockFormData, mapStockFormToDb } = useStockForm();
        const records = useRecordsStore();
        const settings = useSettingsStore();
        const runtime = useRuntimeStore();
        settings.activeAccountId = 1;
        stockFormData.isin = "US0378331005";
        stockFormData.company = "Apple Inc.";
        stockFormData.symbol = "AAPL";
        const stocksRepo = databaseService.getRepository("stocks");
        const saveSpy = vi.spyOn(stocksRepo, "save").mockResolvedValue(456);
        vi.spyOn(records.stocks, "refreshOnlineData").mockResolvedValue(undefined);
        const stockData = mapStockFormToDb(settings.activeAccountId);
        const addStockID = await stocksRepo.save(stockData);
        if (addStockID !== -1) {
            records.stocks.add({ ...stockData, cID: addStockID });
            await records.stocks.refreshOnlineData(runtime.stocksPage);
        }
        expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({
            cISIN: "US0378331005",
            cCompany: "Apple Inc.",
            cSymbol: "AAPL",
            cAccountNumberID: 1
        }));
        expect(records.stocks.items).toHaveLength(1);
        expect(records.stocks.items[0].cID).toBe(456);
        expect(records.stocks.refreshOnlineData).toHaveBeenCalled();
    });
});
