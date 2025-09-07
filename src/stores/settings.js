import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useConstant } from '@/composables/useConstant';
import { useNotification } from '@/composables/useNotification';
const { CONS } = useConstant();
const { log } = useNotification();
export const useSettingsStore = defineStore('settings', () => {
    const skin = ref(CONS.DEFAULTS.STORAGE.SKIN);
    const bookingsPerPage = ref(CONS.DEFAULTS.STORAGE.BOOKINGS_PER_PAGE);
    const stocksPerPage = ref(CONS.DEFAULTS.STORAGE.STOCKS_PER_PAGE);
    const activeAccountId = ref(0);
    const partner = ref(false);
    const service = ref(CONS.DEFAULTS.STORAGE.SERVICE);
    const materials = ref(CONS.DEFAULTS.STORAGE.MATERIALS);
    const markets = ref(CONS.DEFAULTS.STORAGE.MARKETS);
    const indexes = ref(CONS.DEFAULTS.STORAGE.INDEXES);
    const exchanges = ref(CONS.DEFAULTS.STORAGE.EXCHANGES);
    function setActiveAccountId(value) {
        activeAccountId.value = value;
    }
    function setBookingsPerPage(value) {
        bookingsPerPage.value = value;
    }
    function setStocksPerPage(value) {
        stocksPerPage.value = value;
    }
    function setPartner(value) {
        partner.value = value;
    }
    function setService(value) {
        service.value = value;
    }
    function setMaterials(value) {
        materials.value = value;
    }
    function setMarkets(value) {
        markets.value = value;
    }
    function setIndexes(value) {
        indexes.value = value;
    }
    function setExchanges(value) {
        exchanges.value = value;
    }
    function setSkin(theme, value) {
        if (theme?.global?.name) {
            theme.global.name.value = value;
        }
        skin.value = value;
    }
    function initStore(theme, storage) {
        log('SETTINGS: initStore', { info: storage });
        if (theme?.global?.name) {
            theme.global.name.value = storage.sSkin;
        }
        skin.value = storage.sSkin;
        bookingsPerPage.value = storage.sBookingsPerPage;
        stocksPerPage.value = storage.sStocksPerPage;
        activeAccountId.value = storage.sActiveAccountId;
        partner.value = storage.sPartner;
        service.value = storage.sService;
        materials.value = [...storage.sMaterials];
        markets.value = [...storage.sMarkets];
        indexes.value = [...storage.sIndexes];
        exchanges.value = [...storage.sExchanges];
    }
    function updatePagination(bookings, stocks) {
        bookingsPerPage.value = bookings;
        stocksPerPage.value = stocks;
    }
    function updateMarketData(data) {
        if (data.materials)
            materials.value = [...data.materials];
        if (data.markets)
            markets.value = [...data.markets];
        if (data.indexes)
            indexes.value = [...data.indexes];
        if (data.exchanges)
            exchanges.value = [...data.exchanges];
    }
    function validateSettings() {
        return (bookingsPerPage.value > 0 &&
            stocksPerPage.value > 0 &&
            skin.value.length > 0 &&
            service.value.length > 0 &&
            Array.isArray(materials.value) &&
            Array.isArray(markets.value) &&
            Array.isArray(indexes.value) &&
            Array.isArray(exchanges.value));
    }
    return {
        skin,
        bookingsPerPage,
        stocksPerPage,
        activeAccountId,
        partner,
        service,
        materials,
        markets,
        indexes,
        exchanges,
        setActiveAccountId,
        setBookingsPerPage,
        setStocksPerPage,
        setPartner,
        setService,
        setMaterials,
        setMarkets,
        setIndexes,
        setExchanges,
        setSkin,
        initStore,
        updatePagination,
        updateMarketData,
        validateSettings
    };
});
log('--- STORE settings.js ---');
