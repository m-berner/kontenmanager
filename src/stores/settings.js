import { ref } from 'vue';
import { useApp } from '@/composables/useApp';
import { defineStore } from 'pinia';
const { CONS, log } = useApp();
export const useSettingsStore = defineStore('settings', function () {
    const skin = ref(CONS.DEFAULTS.BROWSER_STORAGE.SKIN);
    const bookingsPerPage = ref(CONS.DEFAULTS.BROWSER_STORAGE.BOOKINGS_PER_PAGE);
    const stocksPerPage = ref(CONS.DEFAULTS.BROWSER_STORAGE.STOCKS_PER_PAGE);
    const dividendsPerPage = ref(CONS.DEFAULTS.BROWSER_STORAGE.DIVIDENDS_PER_PAGE);
    const sumsPerPage = ref(CONS.DEFAULTS.BROWSER_STORAGE.CATEGORIES_PER_PAGE);
    const activeAccountId = ref(-1);
    const partner = ref(false);
    const service = ref(CONS.DEFAULTS.BROWSER_STORAGE.SERVICE);
    const materials = ref(CONS.DEFAULTS.BROWSER_STORAGE.MATERIALS);
    const markets = ref(CONS.DEFAULTS.BROWSER_STORAGE.MARKETS);
    const indexes = ref(CONS.DEFAULTS.BROWSER_STORAGE.INDEXES);
    const exchanges = ref(CONS.DEFAULTS.BROWSER_STORAGE.EXCHANGES);
    function setStocksPerPage(v) {
        stocksPerPage.value = v;
    }
    function setBookingsPerPage(v) {
        bookingsPerPage.value = v;
    }
    function setSkin(theme, value) {
        if (theme?.global?.name) {
            theme.global.name.value = value;
        }
        skin.value = value;
    }
    function init(theme, storage) {
        theme.global.name.value = storage.sSkin;
        skin.value = storage.sSkin;
        bookingsPerPage.value = storage.sBookingsPerPage;
        stocksPerPage.value = storage.sStocksPerPage;
        dividendsPerPage.value = storage.sDividendsPerPage;
        sumsPerPage.value = storage.sSumsPerPage;
        activeAccountId.value = storage.sActiveAccountId;
        partner.value = storage.sPartner;
        service.value = storage.sService;
        materials.value = [...storage.sMaterials];
        markets.value = [...storage.sMarkets];
        indexes.value = [...storage.sIndexes];
        exchanges.value = [...storage.sExchanges];
    }
    function setActiveAccountId(v) {
        activeAccountId.value = v;
    }
    return {
        skin,
        bookingsPerPage,
        stocksPerPage,
        dividendsPerPage,
        sumsPerPage,
        activeAccountId,
        partner,
        service,
        materials,
        markets,
        indexes,
        exchanges,
        setActiveAccountId,
        setStocksPerPage,
        setBookingsPerPage,
        setSkin,
        init
    };
});
log('--- STORES settings.ts ---');
