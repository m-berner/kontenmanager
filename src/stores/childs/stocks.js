import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useApp } from '@/composables/useApp';
import { useSettings } from '@/composables/useSettings';
import { useFetch } from '@/composables/useFetch';
import { useRuntime } from '@/composables/useRuntime';
import { useStocksDB } from '@/composables/useIndexedDB';
const { log, isoDate, toNumber, utcDate } = useApp();
export const useStocksStore = defineStore('stocks', () => {
    const items = ref([]);
    const getIndexById = computed(() => (id) => {
        return items.value.findIndex(stock => stock.cID === id);
    });
    const getItemById = computed(() => (id) => items.value[getIndexById.value(id)]);
    const passive = computed(() => {
        return items.value.filter(rec => {
            return rec.cFadeOut === 1 && rec.cID > 0;
        });
    });
    const active = computed(() => {
        return items.value.filter(rec => {
            return rec.cFadeOut === 0 && rec.cID > 0;
        });
    });
    const sumDepot = computed(() => () => {
        return active.value.map(rec => {
            return (rec.mPortfolio ?? 0) * (rec.mValue ?? 0);
        }).reduce((acc, cur) => acc + cur, 0);
    });
    function add(stock, prepend = false) {
        log('STOCKS_STORE: add');
        const stocksOnlyMemory = {
            mPortfolio: 0,
            mInvest: 0,
            mChange: 0,
            mBuyValue: 0,
            mEuroChange: 0,
            mMin: 0,
            mValue: 0,
            mMax: 0,
            mDividendYielda: 0,
            mDividendYeara: 0,
            mDividendYieldb: 0,
            mDividendYearb: 0,
            mRealDividend: 0,
            mRealBuyValue: 0,
            mDeleteable: false
        };
        const completeStock = {
            ...stock,
            ...stocksOnlyMemory
        };
        if (prepend) {
            items.value.unshift(completeStock);
        }
        else {
            items.value.push(completeStock);
        }
    }
    function updateStock(stock) {
        log('STOCKS_STORE: updateStock');
        const index = getIndexById.value(stock?.cID ?? -1);
        if (index !== -1) {
            const stocksOnlyMemory = {
                mPortfolio: items.value[index].mPortfolio,
                mInvest: items.value[index].mInvest,
                mChange: items.value[index].mChange,
                mBuyValue: items.value[index].mBuyValue,
                mEuroChange: items.value[index].mEuroChange,
                mMin: items.value[index].mMin,
                mValue: items.value[index].mValue,
                mMax: items.value[index].mMax,
                mDividendYielda: items.value[index].mDividendYielda,
                mDividendYeara: items.value[index].mDividendYeara,
                mDividendYieldb: items.value[index].mDividendYieldb,
                mDividendYearb: items.value[index].mDividendYearb,
                mRealDividend: items.value[index].mRealDividend,
                mRealBuyValue: items.value[index].mRealBuyValue,
                mDeleteable: items.value[index].mDeleteable
            };
            items.value[index] = { ...stock, ...stocksOnlyMemory };
        }
    }
    function remove(ident) {
        log('STOCKS_STORE: remove', { info: ident });
        const index = getIndexById.value(ident);
        if (index !== -1) {
            items.value.splice(index, 1);
        }
    }
    function clean() {
        log('STOCKS_STORE: clean');
        items.value.length = 0;
    }
    async function loadOnlineData(page) {
        log('INDEXED_DB/STOCKS: loadOnlineData');
        const { fetchDateData, fetchMinRateMaxData } = useFetch();
        const { curEur, curUsd, loadedStocksPages } = useRuntime();
        const { stocksPerPage } = useSettings();
        const { updateStock } = useStocksDB();
        const { CONS } = useApp();
        const isin = [];
        const isinDates = [];
        const itemsLength = active.value.length;
        const rest = itemsLength % stocksPerPage.value;
        const lastPage = Math.ceil(itemsLength / stocksPerPage.value);
        let pageStocks = [];
        if (itemsLength > 0) {
            if (page < lastPage || rest === 0) {
                pageStocks = active.value.slice((page - 1) * stocksPerPage.value, (page - 1) * stocksPerPage.value + stocksPerPage.value);
            }
            else {
                pageStocks = active.value.slice((page - 1) * stocksPerPage.value, (page - 1) * stocksPerPage.value + rest);
            }
            for (let i = 0; i < pageStocks.length; i++) {
                if (pageStocks[i].mValue === 0) {
                    isin.push({
                        id: pageStocks[i].cID,
                        isin: pageStocks[i].cISIN,
                        min: '0',
                        rate: '0',
                        max: '0',
                        cur: ''
                    });
                }
                if ((utcDate(pageStocks[i].cMeetingDay).getTime() < Date.now() || utcDate(pageStocks[i].cQuarterDay).getTime() < Date.now()) && utcDate(pageStocks[i].cAskDates).getTime() < Date.now()) {
                    isinDates.push({
                        id: pageStocks[i].cID,
                        isin: pageStocks[i].cISIN
                    });
                }
            }
        }
        const minRateMaxResponse = await fetchMinRateMaxData(isin);
        const dateResponse = await fetchDateData(isinDates);
        for (let i = 0; i < pageStocks.length; i++) {
            pageStocks[i].mMin = minRateMaxResponse[i].cur === 'USD' ? toNumber(minRateMaxResponse[i].min) / curUsd.value : toNumber(minRateMaxResponse[i].min) / curEur.value;
            pageStocks[i].mValue = minRateMaxResponse[i].cur === 'USD' ? toNumber(minRateMaxResponse[i].rate) / curUsd.value : toNumber(minRateMaxResponse[i].rate) / curEur.value;
            pageStocks[i].mMax = minRateMaxResponse[i].cur === 'USD' ? toNumber(minRateMaxResponse[i].max) / curUsd.value : toNumber(minRateMaxResponse[i].max) / curEur.value;
            pageStocks[i].mEuroChange = (pageStocks[i].mValue ?? 0) * (pageStocks[i].mPortfolio ?? 0) - (pageStocks[i].mInvest ?? 0);
            for (let j = 0; isinDates.length > 0 && j < isinDates.length && pageStocks[i].cID === isinDates[j].id; j++) {
                pageStocks[i].cMeetingDay = (await dateResponse[j]).value.gm > 0 ? isoDate((await dateResponse[j]).value.gm) : CONS.DATE.DEFAULT_ISO;
                pageStocks[i].cQuarterDay = (await dateResponse[j]).value.qf > 0 ? isoDate((await dateResponse[j]).value.qf) : CONS.DATE.DEFAULT_ISO;
                pageStocks[i].cAskDates = isoDate(Date.now() + CONS.DEFAULTS.ASK_DATE_INTERVAL * 86400000);
            }
            const dbStock = { ...pageStocks[i] };
            delete dbStock.mPortfolio;
            delete dbStock.mInvest;
            delete dbStock.mChange;
            delete dbStock.mBuyValue;
            delete dbStock.mEuroChange;
            delete dbStock.mMin;
            delete dbStock.mValue;
            delete dbStock.mMax;
            delete dbStock.mDividendYielda;
            delete dbStock.mDividendYeara;
            delete dbStock.mDividendYieldb;
            delete dbStock.mDividendYearb;
            delete dbStock.mRealDividend;
            delete dbStock.mRealBuyValue;
            delete dbStock.mDeleteable;
            await updateStock(dbStock);
        }
        loadedStocksPages.add(page);
    }
    return {
        items,
        getItemById,
        getIndexById,
        active,
        passive,
        sumDepot,
        add,
        updateStock,
        remove,
        clean,
        loadOnlineData
    };
});
log('--- STORES stocks.ts ---');
