import { ref } from 'vue';
import { useApp } from '@/composables/useApp';
import { defineStore } from 'pinia';
import { useBrowser } from '@/composables/useBrowser';
import { useAppConfig } from '@/composables/useAppConfig';
const { log } = useApp();
const { BROWSER_STORAGE } = useAppConfig();
const { setStorage } = useBrowser();
export const useSettingsStore = defineStore('settings', function () {
    const skin = ref(BROWSER_STORAGE.SKIN.value);
    const bookingsPerPage = ref(BROWSER_STORAGE.BOOKINGS_PER_PAGE.value);
    const stocksPerPage = ref(BROWSER_STORAGE.STOCKS_PER_PAGE.value);
    const dividendsPerPage = ref(BROWSER_STORAGE.DIVIDENDS_PER_PAGE.value);
    const sumsPerPage = ref(BROWSER_STORAGE.SUMS_PER_PAGE.value);
    const activeAccountId = ref(-1);
    const service = ref(BROWSER_STORAGE.SERVICE.value);
    const materials = ref(BROWSER_STORAGE.MATERIALS.value);
    const markets = ref(BROWSER_STORAGE.MARKETS.value);
    const indexes = ref(BROWSER_STORAGE.INDEXES.value);
    const exchanges = ref(BROWSER_STORAGE.EXCHANGES.value);
    function init(storage) {
        log('SETTINGS: init');
        skin.value = storage[BROWSER_STORAGE.SKIN.key];
        bookingsPerPage.value = storage[BROWSER_STORAGE.BOOKINGS_PER_PAGE.key];
        stocksPerPage.value = storage[BROWSER_STORAGE.STOCKS_PER_PAGE.key];
        dividendsPerPage.value = storage[BROWSER_STORAGE.DIVIDENDS_PER_PAGE.key];
        sumsPerPage.value = storage[BROWSER_STORAGE.SUMS_PER_PAGE.key];
        activeAccountId.value = storage[BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key];
        service.value = storage[BROWSER_STORAGE.SERVICE.key];
        materials.value = [...storage[BROWSER_STORAGE.MATERIALS.key]];
        markets.value = [...storage[BROWSER_STORAGE.MARKETS.key]];
        indexes.value = [...storage[BROWSER_STORAGE.INDEXES.key]];
        exchanges.value = [...storage[BROWSER_STORAGE.EXCHANGES.key]];
    }
    async function setSumsPerPage(v) {
        sumsPerPage.value = v;
        await setStorage(BROWSER_STORAGE.SUMS_PER_PAGE.key, v);
    }
    async function setBookingsPerPage(v) {
        bookingsPerPage.value = v;
        await setStorage(BROWSER_STORAGE.BOOKINGS_PER_PAGE.key, v);
    }
    async function setStocksPerPage(v) {
        stocksPerPage.value = v;
        await setStorage(BROWSER_STORAGE.STOCKS_PER_PAGE.key, v);
    }
    async function setDividendsPerPage(v) {
        dividendsPerPage.value = v;
        await setStorage(BROWSER_STORAGE.DIVIDENDS_PER_PAGE.key, v);
    }
    return {
        skin,
        bookingsPerPage,
        stocksPerPage,
        dividendsPerPage,
        sumsPerPage,
        activeAccountId,
        service,
        materials,
        markets,
        indexes,
        exchanges,
        init,
        setSumsPerPage,
        setBookingsPerPage,
        setDividendsPerPage,
        setStocksPerPage
    };
});
log('--- STORES settings.ts ---');
