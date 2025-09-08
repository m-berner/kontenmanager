import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useConstant } from '@/composables/useConstant';
import { useNotification } from '@/composables/useNotification';
const { CONS } = useConstant();
const { log } = useNotification();
export const useSettingsStore = defineStore('settings', () => {
    const skin = ref(CONS.DEFAULTS.BROWSER_STORAGE.SKIN);
    const bookingsPerPage = ref(CONS.DEFAULTS.BROWSER_STORAGE.BOOKINGS_PER_PAGE);
    const stocksPerPage = ref(CONS.DEFAULTS.BROWSER_STORAGE.STOCKS_PER_PAGE);
    const activeAccountId = ref(0);
    const partner = ref(false);
    const service = ref(CONS.DEFAULTS.BROWSER_STORAGE.SERVICE);
    const materials = ref(CONS.DEFAULTS.BROWSER_STORAGE.MATERIALS);
    const markets = ref(CONS.DEFAULTS.BROWSER_STORAGE.MARKETS);
    const indexes = ref(CONS.DEFAULTS.BROWSER_STORAGE.INDEXES);
    const exchanges = ref(CONS.DEFAULTS.BROWSER_STORAGE.EXCHANGES);
    function setSkin(theme, value) {
        if (theme?.global?.name) {
            theme.global.name.value = value;
        }
        skin.value = value;
    }
    function initStore(theme, storage) {
        log('SETTINGS: initStore', { info: storage });
        setSkin(theme, storage.sSkin);
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
        setSkin,
        initStore
    };
});
log('--- STORE settings.js ---');
