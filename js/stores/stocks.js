import { defineStore, storeToRefs } from "pinia";
import { computed, ref } from "vue";
import { useSettingsStore } from "@/stores/settings";
import { fetchService } from "@/services/fetch";
import { useRuntimeStore } from "@/stores/runtime";
import { DomainUtils } from "@/domains/utils";
import { STORES } from "@/configs/stores";
import { DEFAULTS } from "@/configs/defaults";
import { DATE } from "@/domains/configs/date";
import { useStorage } from "@/composables/useStorage";
import { useBrowser } from "@/composables/useBrowser";
import { useBookingsStore } from "@/stores/bookings";
import { DomainLogic } from "@/domains/logic";
import { CURRENCIES } from "@/domains/configs/currencies";
const { getUserLocale } = useBrowser();
export const useStocksStore = defineStore("stocks", function () {
    const { investByStockId, portfolioByStockId, hasStockID } = useBookingsStore();
    const runtime = useRuntimeStore();
    const settings = useSettingsStore();
    const { stocksPerPage } = storeToRefs(settings);
    const items = ref([]);
    const getIndexById = computed(() => (id) => {
        return items.value.findIndex((stock) => stock.cID === id);
    });
    const getItemById = computed(() => (id) => items.value[getIndexById.value(id)]);
    const getById = computed(() => (ident) => {
        const stock = items.value.find((entry) => entry.cID === ident);
        return stock ? stock : null;
    });
    const passive = computed(() => {
        return items.value.filter((rec) => {
            return rec.cFadeOut === 1 && rec.cID > 0;
        });
    });
    const active = computed(() => {
        return items.value
            .filter((rec) => rec.cFadeOut === 0 && rec.cID > 0)
            .map((rec) => ({
            ...rec,
            id: rec.cID,
            mPortfolio: portfolioByStockId(rec.cID),
            mInvest: investByStockId(rec.cID),
            mDeleteable: !hasStockID(rec.cID)
        }))
            .sort((a, b) => {
            const firstPageDiff = b.cFirstPage - a.cFirstPage;
            return firstPageDiff !== 0
                ? firstPageDiff
                : b.mPortfolio - a.mPortfolio;
        });
    });
    const sumDepot = computed(() => () => {
        const { activeAccountId } = useSettingsStore();
        if (activeAccountId === -1) {
            return 0;
        }
        return DomainLogic.calculateTotalDepotValue(active.value);
    });
    function add(stock, prepend = false) {
        DomainUtils.log("RECORDS_STOCKS: add");
        const completeStock = {
            ...stock,
            ...STORES.STOCK_STORE_MEMORY
        };
        if (prepend) {
            items.value = [completeStock, ...items.value];
        }
        else {
            items.value = [...items.value, completeStock];
        }
    }
    function update(stockDb) {
        DomainUtils.log("RECORDS_STOCKS: updateStock", stockDb, "info");
        const index = getIndexById.value(stockDb.cID);
        if (index !== -1) {
            const newItems = [...items.value];
            const stockRam = {
                mPortfolio: newItems[index].mPortfolio,
                mInvest: newItems[index].mInvest,
                mChange: newItems[index].mChange,
                mBuyValue: newItems[index].mBuyValue,
                mEuroChange: newItems[index].mEuroChange,
                mMin: newItems[index].mMin,
                mValue: newItems[index].mValue,
                mMax: newItems[index].mMax,
                mDividendYielda: newItems[index].mDividendYielda,
                mDividendYeara: newItems[index].mDividendYeara,
                mDividendYieldb: newItems[index].mDividendYieldb,
                mDividendYearb: newItems[index].mDividendYearb,
                mRealDividend: newItems[index].mRealDividend,
                mRealBuyValue: newItems[index].mRealBuyValue,
                mDeleteable: newItems[index].mDeleteable
            };
            newItems[index] = { ...stockDb, ...stockRam };
            items.value = newItems;
        }
    }
    function remove(ident) {
        DomainUtils.log("RECORDS_STOCKS: remove", ident, "info");
        items.value = items.value.filter((entry) => entry.cID !== ident);
    }
    function clean() {
        DomainUtils.log("RECORDS_STOCKS: clean");
        items.value = [];
    }
    async function refreshOnlineData(page) {
        runtime.loadedStocksPages.delete(page);
        await loadOnlineData(page);
    }
    async function loadOnlineData(page) {
        DomainUtils.log("RECORDS: loadOnlineData");
        const { getStorage } = useStorage();
        const isin = [];
        const isinDates = [];
        const itemsLength = active.value.length;
        if (itemsLength === 0)
            return;
        const startIndex = (page - 1) * stocksPerPage.value;
        const pageStocks = active.value.slice(startIndex, startIndex + stocksPerPage.value);
        const now = Date.now();
        for (const stock of pageStocks) {
            isin.push({
                id: stock.cID,
                isin: stock.cISIN,
                min: "0",
                rate: "0",
                max: "0",
                cur: ""
            });
            const meetingTime = DomainUtils.utcDate(stock.cMeetingDay).getTime();
            const quarterTime = DomainUtils.utcDate(stock.cQuarterDay).getTime();
            const askTime = DomainUtils.utcDate(stock.cAskDates).getTime();
            if ((meetingTime < now || quarterTime < now) && askTime < now) {
                isinDates.push({
                    key: stock.cID,
                    value: stock.cISIN
                });
            }
        }
        const [minRateMaxResponse, dateResponse] = await Promise.all([
            fetchService.fetchMinRateMaxData(isin, getStorage),
            fetchService.fetchDateData(isinDates)
        ]);
        pageStocks.forEach((stock, i) => {
            const data = minRateMaxResponse[i];
            if (!data)
                return;
            const stockToUpdate = getById.value(stock.id);
            if (!stockToUpdate)
                return;
            const uiCur = CURRENCIES.CODE.get(getUserLocale().toLowerCase().substring(3, 5));
            const divisor = data.cur === uiCur ? 1 : data.cur === "EUR" ? runtime.curUsd : runtime.curEur;
            stockToUpdate.mMin = DomainUtils.toNumber(data.min) / divisor;
            stockToUpdate.mValue = DomainUtils.toNumber(data.rate) / divisor;
            stockToUpdate.mMax = DomainUtils.toNumber(data.max) / divisor;
            stockToUpdate.mEuroChange =
                stockToUpdate.mValue * (stock.mPortfolio ?? 0) - (stock.mInvest ?? 0);
            const dateData = dateResponse.find((d) => d.key === stock.id);
            if (dateData) {
                stockToUpdate.cMeetingDay =
                    dateData.value.gm > 0
                        ? DomainUtils.isoDate(dateData.value.gm)
                        : DATE.ISO;
                stockToUpdate.cQuarterDay =
                    dateData.value.qf > 0
                        ? DomainUtils.isoDate(dateData.value.qf)
                        : DATE.ISO;
                stockToUpdate.cAskDates = DomainUtils.isoDate(now + DEFAULTS.ASK_DATE_INTERVAL * 86400000);
            }
        });
        runtime.loadedStocksPages.add(page);
    }
    return {
        items,
        getById,
        getItemById,
        getIndexById,
        active,
        passive,
        sumDepot,
        add,
        update,
        remove,
        clean,
        loadOnlineData,
        refreshOnlineData
    };
});
DomainUtils.log("STORES stocks");
