import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useRecordsStore } from "@/stores/records";
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
describe("FadeInStock Logic Test", () => {
    beforeEach(async () => {
        setActivePinia(createPinia());
        vi.spyOn(databaseService, "isConnected").mockReturnValue(true);
    });
    it("should fade in a faded out stock", async () => {
        const records = useRecordsStore();
        const stock = {
            cID: 1,
            cISIN: "DE0001",
            cSymbol: "TEST",
            cCompany: "Test Company",
            cFadeOut: 1,
            cFirstPage: 0,
            cURL: "https://test.com",
            cMeetingDay: "",
            cQuarterDay: "",
            cAccountNumberID: 1,
            cAskDates: "1970-01-01"
        };
        records.stocks.add(stock);
        const stocksRepo = databaseService.getRepository("stocks");
        const saveSpy = vi.spyOn(stocksRepo, "save").mockResolvedValue(4);
        stock.cFadeOut = 0;
        await stocksRepo.save(stock);
        records.stocks.update(stock);
        expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ cFadeOut: 0 }));
        expect(records.stocks.items[0].cFadeOut).toBe(0);
    });
});
