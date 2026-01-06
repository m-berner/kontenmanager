import { ref } from 'vue';
import { useApp } from '@/composables/useApp';
import { defineStore } from 'pinia';
import { useBrowser } from '@/composables/useBrowser';
import { useAppConfig } from '@/composables/useAppConfig';
const { log } = useApp();
const { BROWSER_STORAGE } = useAppConfig();
const { setStorage } = useBrowser();
export const useSettingsStore = defineStore('settings', function () {
    const skin = ref(BROWSER_STORAGE.LOCAL.SKIN.value);
    const bookingsPerPage = ref(BROWSER_STORAGE.LOCAL.BOOKINGS_PER_PAGE.value);
    const stocksPerPage = ref(BROWSER_STORAGE.LOCAL.STOCKS_PER_PAGE.value);
    const dividendsPerPage = ref(BROWSER_STORAGE.LOCAL.DIVIDENDS_PER_PAGE.value);
    const sumsPerPage = ref(BROWSER_STORAGE.LOCAL.SUMS_PER_PAGE.value);
    const activeAccountId = ref(-1);
    const service = ref(BROWSER_STORAGE.LOCAL.SERVICE.value);
    const materials = ref(BROWSER_STORAGE.LOCAL.MATERIALS.value);
    const markets = ref(BROWSER_STORAGE.LOCAL.MARKETS.value);
    const indexes = ref(BROWSER_STORAGE.LOCAL.INDEXES.value);
    const exchanges = ref(BROWSER_STORAGE.LOCAL.EXCHANGES.value);
    function init(storage) {
        log('SETTINGS: init');
        skin.value = storage[BROWSER_STORAGE.LOCAL.SKIN.key];
        bookingsPerPage.value = storage[BROWSER_STORAGE.LOCAL.BOOKINGS_PER_PAGE.key];
        stocksPerPage.value = storage[BROWSER_STORAGE.LOCAL.STOCKS_PER_PAGE.key];
        dividendsPerPage.value = storage[BROWSER_STORAGE.LOCAL.DIVIDENDS_PER_PAGE.key];
        sumsPerPage.value = storage[BROWSER_STORAGE.LOCAL.SUMS_PER_PAGE.key];
        activeAccountId.value = storage[BROWSER_STORAGE.LOCAL.ACTIVE_ACCOUNT_ID.key];
        service.value = storage[BROWSER_STORAGE.LOCAL.SERVICE.key];
        materials.value = [...storage[BROWSER_STORAGE.LOCAL.MATERIALS.key]];
        markets.value = [...storage[BROWSER_STORAGE.LOCAL.MARKETS.key]];
        indexes.value = [...storage[BROWSER_STORAGE.LOCAL.INDEXES.key]];
        exchanges.value = [...storage[BROWSER_STORAGE.LOCAL.EXCHANGES.key]];
    }
    async function setSumsPerPage(v) {
        sumsPerPage.value = v;
        await setStorage(BROWSER_STORAGE.LOCAL.SUMS_PER_PAGE.key, v);
    }
    async function setBookingsPerPage(v) {
        bookingsPerPage.value = v;
        await setStorage(BROWSER_STORAGE.LOCAL.BOOKINGS_PER_PAGE.key, v);
    }
    async function setStocksPerPage(v) {
        stocksPerPage.value = v;
        await setStorage(BROWSER_STORAGE.LOCAL.STOCKS_PER_PAGE.key, v);
    }
    async function setDividendsPerPage(v) {
        dividendsPerPage.value = v;
        await setStorage(BROWSER_STORAGE.LOCAL.DIVIDENDS_PER_PAGE.key, v);
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
