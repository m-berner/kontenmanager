import { defineStore } from 'pinia';
import {} from 'vuetify';
import { useAppApi } from '@/pages/background';
const { CONS, log } = useAppApi();
export const useSettingsStore = defineStore('settings', {
    state: () => {
        return {
            skin: CONS.DEFAULTS.STORAGE.SKIN,
            bookingsPerPage: CONS.DEFAULTS.STORAGE.BOOKINGS_PER_PAGE,
            stocksPerPage: CONS.DEFAULTS.STORAGE.STOCKS_PER_PAGE,
            activeAccountId: -1,
            partner: false,
            service: CONS.DEFAULTS.STORAGE.SERVICE,
            materials: CONS.DEFAULTS.STORAGE.MATERIALS,
            markets: CONS.DEFAULTS.STORAGE.MARKETS,
            indexes: CONS.DEFAULTS.STORAGE.INDEXES,
            exchanges: CONS.DEFAULTS.STORAGE.EXCHANGES
        };
    },
    getters: {},
    actions: {
        setActiveAccountId(value) {
            this.activeAccountId = value;
        },
        setBookingsPerPage(value) {
            this.bookingsPerPage = value;
        },
        setStocksPerPage(value) {
            this.stocksPerPage = value;
        },
        setSkin(theme, value) {
            theme.global.name.value = value;
            this.skin = value;
        },
        setPartner(value) {
            this.partner = value;
        },
        setService(value) {
            this.service = value;
        },
        setMaterials(value) {
            this.materials = value;
        },
        setMarkets(value) {
            this.markets = value;
        },
        setIndexes(value) {
            this.indexes = value;
        },
        setExchanges(value) {
            this.exchanges = value;
        },
        initStore(theme, storage) {
            log('SETTINGS: initStore');
            theme.global.name.value = storage.sSkin;
            this.skin = storage.sSkin;
            this.bookingsPerPage = storage.sBookingsPerPage;
            this.stocksPerPage = storage.sStocksPerPage;
            this.activeAccountId = storage.sActiveAccountId;
            this.partner = storage.sPartner;
            this.service = storage.sService;
            this.materials = storage.sMaterials;
            this.markets = storage.sMarkets;
            this.indexes = storage.sIndexes;
            this.exchanges = storage.sExchanges;
        }
    }
});
log('--- STORE settings.js ---');
