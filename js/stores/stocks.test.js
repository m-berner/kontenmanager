import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useStocksStore } from "./stocks";
import { useBookingsStore } from "./bookings";
import { useSettingsStore } from "./settings";
vi.mock("@/services/fetch", () => ({
    fetchService: {
        fetchMinRateMaxData: vi.fn(),
        fetchDateData: vi.fn()
    }
}));
vi.mock("@/composables/useBrowser", () => ({
    useBrowser: () => ({
        notice: vi.fn()
    })
}));
vi.mock("@/composables/useStorage", () => ({
    useStorage: () => ({
        getStorage: vi.fn(),
        setStorage: vi.fn()
    })
}));
describe("Stocks Store", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });
    describe("sumDepot", () => {
        it("should calculate the total depot value correctly", () => {
            const stocksStore = useStocksStore();
            const settingsStore = useSettingsStore();
            const bookingsStore = useBookingsStore();
            settingsStore.activeAccountId = 1;
            stocksStore.items = [
                {
                    cID: 1,
                    cCompany: "Apple",
                    cISIN: "US0378331005",
                    cSymbol: "AAPL",
                    cFadeOut: 0,
                    cFirstPage: 0,
                    cURL: "",
                    cMeetingDay: "",
                    cQuarterDay: "",
                    cAccountNumberID: 1,
                    cAskDates: "",
                    mValue: 200
                },
                {
                    cID: 2,
                    cCompany: "Allianz",
                    cISIN: "DE0008404005",
                    cSymbol: "ALV",
                    cFadeOut: 0,
                    cFirstPage: 0,
                    cURL: "",
                    cMeetingDay: "",
                    cQuarterDay: "",
                    cAccountNumberID: 1,
                    cAskDates: "",
                    mValue: 250
                }
            ];
            bookingsStore.items = [
                {
                    cID: 1,
                    cStockID: 1,
                    cCount: 10,
                    cBookingTypeID: 1,
                    cCredit: 0,
                    cDebit: 2000,
                    cBookDate: "2024-01-01",
                    cExDate: "",
                    cDescription: "",
                    cMarketPlace: "",
                    cAccountNumberID: 1,
                    cTaxDebit: 0,
                    cTaxCredit: 0,
                    cSourceTaxDebit: 0,
                    cSourceTaxCredit: 0,
                    cTransactionTaxDebit: 0,
                    cTransactionTaxCredit: 0,
                    cSoliDebit: 0,
                    cSoliCredit: 0,
                    cFeeDebit: 0,
                    cFeeCredit: 0
                },
                {
                    cID: 2,
                    cStockID: 2,
                    cCount: 5,
                    cBookingTypeID: 1,
                    cCredit: 0,
                    cDebit: 1250,
                    cBookDate: "2024-01-01",
                    cExDate: "",
                    cDescription: "",
                    cMarketPlace: "",
                    cAccountNumberID: 1,
                    cTaxDebit: 0,
                    cTaxCredit: 0,
                    cSourceTaxDebit: 0,
                    cSourceTaxCredit: 0,
                    cTransactionTaxDebit: 0,
                    cTransactionTaxCredit: 0,
                    cSoliDebit: 0,
                    cSoliCredit: 0,
                    cFeeDebit: 0,
                    cFeeCredit: 0
                }
            ];
            expect(stocksStore.sumDepot()).toBe(3250);
        });
        it("should update original items when loadOnlineData is called", async () => {
            const stocksStore = useStocksStore();
            const { fetchService } = await import("@/services/fetch");
            stocksStore.items = [
                {
                    cID: 1,
                    cCompany: "Test Co",
                    cISIN: "US1234567890",
                    cSymbol: "TEST",
                    cFadeOut: 0,
                    cFirstPage: 0,
                    cURL: "",
                    cMeetingDay: "",
                    cQuarterDay: "",
                    cAccountNumberID: 1,
                    cAskDates: ""
                }
            ];
            vi.mocked(fetchService.fetchMinRateMaxData).mockResolvedValue([
                {
                    id: 1,
                    isin: "US1234567890",
                    min: "100",
                    rate: "150",
                    max: "200",
                    cur: "EUR"
                }
            ]);
            vi.mocked(fetchService.fetchDateData).mockResolvedValue([]);
            await stocksStore.loadOnlineData(1);
            expect(stocksStore.items[0].mValue).toBe(150);
            expect(stocksStore.items[0].mMin).toBe(100);
            expect(stocksStore.items[0].mMax).toBe(200);
        });
        it("should trigger reactivity when updating a stock", () => {
            const stocksStore = useStocksStore();
            stocksStore.items = [
                {
                    cID: 1,
                    cCompany: "Test Co",
                    cISIN: "US1234567890",
                    cSymbol: "TEST",
                    cFadeOut: 0,
                    cFirstPage: 0,
                    cURL: "",
                    cMeetingDay: "",
                    cQuarterDay: "",
                    cAccountNumberID: 1,
                    cAskDates: ""
                }
            ];
            expect(stocksStore.active).toHaveLength(1);
            const updatedStock = { ...stocksStore.items[0], cFadeOut: 1 };
            stocksStore.update(updatedStock);
            expect(stocksStore.active).toHaveLength(0);
            expect(stocksStore.passive).toHaveLength(1);
        });
        it("should trigger reactivity when fading in a stock", () => {
            const stocksStore = useStocksStore();
            stocksStore.items = [
                {
                    cID: 1,
                    cCompany: "Test Co",
                    cISIN: "US1234567890",
                    cSymbol: "TEST",
                    cFadeOut: 1,
                    cFirstPage: 0,
                    cURL: "",
                    cMeetingDay: "",
                    cQuarterDay: "",
                    cAccountNumberID: 1,
                    cAskDates: ""
                }
            ];
            expect(stocksStore.passive).toHaveLength(1);
            expect(stocksStore.active).toHaveLength(0);
            const updatedStock = { ...stocksStore.items[0], cFadeOut: 0 };
            stocksStore.update(updatedStock);
            expect(stocksStore.active).toHaveLength(1);
            expect(stocksStore.passive).toHaveLength(0);
        });
        it("should trigger reactivity when removing a stock", () => {
            const stocksStore = useStocksStore();
            stocksStore.items = [
                {
                    cID: 1,
                    cCompany: "Test Co",
                    cISIN: "US1234567890",
                    cSymbol: "TEST",
                    cFadeOut: 0,
                    cFirstPage: 0,
                    cURL: "",
                    cMeetingDay: "",
                    cQuarterDay: "",
                    cAccountNumberID: 1,
                    cAskDates: ""
                }
            ];
            expect(stocksStore.active).toHaveLength(1);
            stocksStore.remove(1);
            expect(stocksStore.active).toHaveLength(0);
        });
        it("should return 0 if no active account is set", () => {
            const stocksStore = useStocksStore();
            const settingsStore = useSettingsStore();
            settingsStore.activeAccountId = -1;
            expect(stocksStore.sumDepot()).toBe(0);
        });
        it("should include fractional shares >= 0.1", () => {
            const stocksStore = useStocksStore();
            const settingsStore = useSettingsStore();
            const bookingsStore = useBookingsStore();
            settingsStore.activeAccountId = 1;
            stocksStore.items = [
                {
                    cID: 1,
                    cCompany: "Fractional Inc",
                    cISIN: "FR0000",
                    cSymbol: "FRAC",
                    cFadeOut: 0,
                    cFirstPage: 0,
                    cURL: "",
                    cMeetingDay: "",
                    cQuarterDay: "",
                    cAccountNumberID: 1,
                    cAskDates: "",
                    mValue: 100
                }
            ];
            bookingsStore.items = [
                {
                    cID: 1,
                    cStockID: 1,
                    cCount: 0.5,
                    cBookingTypeID: 1,
                    cCredit: 0,
                    cDebit: 50,
                    cBookDate: "2024-01-01",
                    cExDate: "",
                    cDescription: "",
                    cMarketPlace: "",
                    cAccountNumberID: 1,
                    cTaxDebit: 0,
                    cTaxCredit: 0,
                    cSourceTaxDebit: 0,
                    cSourceTaxCredit: 0,
                    cTransactionTaxDebit: 0,
                    cTransactionTaxCredit: 0,
                    cSoliDebit: 0,
                    cSoliCredit: 0,
                    cFeeDebit: 0,
                    cFeeCredit: 0
                }
            ];
            expect(stocksStore.sumDepot()).toBe(50);
        });
    });
    describe("CRUD operations", () => {
        const sampleStock = {
            cID: 10,
            cCompany: "Test Co",
            cISIN: "US1234567890",
            cSymbol: "TEST",
            cFadeOut: 0,
            cFirstPage: 0,
            cURL: "http://test.com",
            cMeetingDay: "2025-05-01",
            cQuarterDay: "2025-02-01",
            cAccountNumberID: 1,
            cAskDates: ""
        };
        it("should add a stock", () => {
            const stocksStore = useStocksStore();
            stocksStore.add(sampleStock);
            expect(stocksStore.items).toHaveLength(1);
            expect(stocksStore.items[0].cCompany).toBe("Test Co");
            expect(stocksStore.items[0].mPortfolio).toBe(0);
        });
        it("should update a stock", () => {
            const stocksStore = useStocksStore();
            stocksStore.add(sampleStock);
            const updatedStock = { ...sampleStock, cCompany: "Updated Co" };
            stocksStore.update(updatedStock);
            expect(stocksStore.items[0].cCompany).toBe("Updated Co");
        });
        it("should remove a stock", () => {
            const stocksStore = useStocksStore();
            stocksStore.add(sampleStock);
            expect(stocksStore.items).toHaveLength(1);
            stocksStore.remove(sampleStock.cID);
            expect(stocksStore.items).toHaveLength(0);
        });
    });
});
