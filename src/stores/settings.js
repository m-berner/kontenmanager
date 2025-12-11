import { ref } from 'vue';
import { useApp } from '@/composables/useApp';
import { defineStore } from 'pinia';
import { useBrowser } from '@/composables/useBrowser';
const { CONS, log } = useApp();
const { setStorage } = useBrowser();
export const useSettingsStore = defineStore('settings', function () {
    const skin = ref(CONS.DEFAULTS.BROWSER_STORAGE.SKIN);
    const bookingsPerPage = ref(CONS.DEFAULTS.BROWSER_STORAGE.BOOKINGS_PER_PAGE);
    const stocksPerPage = ref(CONS.DEFAULTS.BROWSER_STORAGE.STOCKS_PER_PAGE);
    const dividendsPerPage = ref(CONS.DEFAULTS.BROWSER_STORAGE.DIVIDENDS_PER_PAGE);
    const sumsPerPage = ref(CONS.DEFAULTS.BROWSER_STORAGE.SUMS_PER_PAGE);
    const activeAccountId = ref(-1);
    const service = ref(CONS.DEFAULTS.BROWSER_STORAGE.SERVICE);
    const materials = ref(CONS.DEFAULTS.BROWSER_STORAGE.MATERIALS);
    const markets = ref(CONS.DEFAULTS.BROWSER_STORAGE.MARKETS);
    const indexes = ref(CONS.DEFAULTS.BROWSER_STORAGE.INDEXES);
    const exchanges = ref(CONS.DEFAULTS.BROWSER_STORAGE.EXCHANGES);
    function init(storage) {
        skin.value = storage[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SKIN];
        bookingsPerPage.value = storage[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.BOOKINGS_PER_PAGE];
        stocksPerPage.value = storage[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.STOCKS_PER_PAGE];
        dividendsPerPage.value = storage[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.DIVIDENDS_PER_PAGE];
        sumsPerPage.value = storage[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SUMS_PER_PAGE];
        activeAccountId.value = storage[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.ACTIVE_ACCOUNT_ID];
        service.value = storage[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SERVICE];
        materials.value = [...storage[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MATERIALS]];
        markets.value = [...storage[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MARKETS]];
        indexes.value = [...storage[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.INDEXES]];
        exchanges.value = [...storage[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.EXCHANGES]];
    }
    async function setSumsPerPage(v) {
        sumsPerPage.value = v;
        await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SUMS_PER_PAGE, v);
    }
    async function setBookingsPerPage(v) {
        bookingsPerPage.value = v;
        await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.BOOKINGS_PER_PAGE, v);
    }
    async function setStocksPerPage(v) {
        stocksPerPage.value = v;
        await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.STOCKS_PER_PAGE, v);
    }
    async function setDividendsPerPage(v) {
        dividendsPerPage.value = v;
        await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.DIVIDENDS_PER_PAGE, v);
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
