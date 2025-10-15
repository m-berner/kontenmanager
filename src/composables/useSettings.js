import {ref} from 'vue';
import {useApp} from '@/composables/useApp';

const {CONS} = useApp();
const skin = ref(CONS.DEFAULTS.BROWSER_STORAGE.SKIN);
const bookingsPerPage = ref(CONS.DEFAULTS.BROWSER_STORAGE.BOOKINGS_PER_PAGE);
const stocksPerPage = ref(CONS.DEFAULTS.BROWSER_STORAGE.STOCKS_PER_PAGE);
const dividendsPerPage = ref(CONS.DEFAULTS.BROWSER_STORAGE.DIVIDENDS_PER_PAGE);
const activeAccountId = ref(0);
const partner = ref(false);
const service = ref(CONS.DEFAULTS.BROWSER_STORAGE.SERVICE);
const materials = ref(CONS.DEFAULTS.BROWSER_STORAGE.MATERIALS);
const markets = ref(CONS.DEFAULTS.BROWSER_STORAGE.MARKETS);
const indexes = ref(CONS.DEFAULTS.BROWSER_STORAGE.INDEXES);
const exchanges = ref(CONS.DEFAULTS.BROWSER_STORAGE.EXCHANGES);
export const useSettings = () => {
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
        dividendsPerPage,
        activeAccountId,
        partner,
        service,
        materials,
        markets,
        indexes,
        exchanges,
        setSkin,
        init
    };
};
