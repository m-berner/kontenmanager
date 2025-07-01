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
            theme.global.name.value = storage[CONS.STORAGE.PROPS.SKIN];
            this.skin = storage[CONS.STORAGE.PROPS.SKIN];
            this.bookingsPerPage = storage[CONS.STORAGE.PROPS.BOOKINGS_PER_PAGE];
            this.stocksPerPage = storage[CONS.STORAGE.PROPS.STOCKS_PER_PAGE];
            this.activeAccountId = storage[CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID];
            this.partner = storage[CONS.STORAGE.PROPS.PARTNER];
            this.service = storage[CONS.STORAGE.PROPS.SERVICE];
            this.materials = storage[CONS.STORAGE.PROPS.MATERIALS];
            this.markets = storage[CONS.STORAGE.PROPS.MARKETS];
            this.indexes = storage[CONS.STORAGE.PROPS.INDEXES];
            this.exchanges = storage[CONS.STORAGE.PROPS.EXCHANGES];
        }
    }
});
log('--- STORE settings.js ---');
