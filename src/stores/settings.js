import { defineStore } from 'pinia';
import {} from 'vuetify';
import { useApp } from '@/composables/useApp';
const { CONS, log } = useApp();
export const useSettingsStore = defineStore('settings', {
    state: () => {
        return {
            skin: CONS.DEFAULTS.STORAGE.SKIN,
            bookingsPerPage: CONS.DEFAULTS.STORAGE.BOOKINGS_PER_PAGE,
            stocksPerPage: CONS.DEFAULTS.STORAGE.STOCKS_PER_PAGE,
            activeAccountId: 0,
            partner: false,
            service: CONS.DEFAULTS.STORAGE.SERVICE,
            materials: CONS.DEFAULTS.STORAGE.MATERIALS,
            markets: CONS.DEFAULTS.STORAGE.MARKETS,
            indexes: CONS.DEFAULTS.STORAGE.INDEXES,
            exchanges: CONS.DEFAULTS.STORAGE.EXCHANGES
        };
    },
    getters: {
        hasActiveAccount: (state) => state.activeAccountId !== -1,
    },
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
        setPartner(value) {
            this.partner = value;
        },
        setService(value) {
            this.service = value;
        },
        setMaterials(value) {
            this.materials = [...value];
        },
        setMarkets(value) {
            this.markets = [...value];
        },
        setIndexes(value) {
            this.indexes = [...value];
        },
        setExchanges(value) {
            this.exchanges = [...value];
        },
        setSkin(theme, value) {
            if (theme?.global?.name) {
                theme.global.name.value = value;
            }
            this.skin = value;
        },
        initStore(theme, storage) {
            log('SETTINGS: initStore', { info: storage });
            if (theme?.global?.name) {
                theme.global.name.value = storage.sSkin;
            }
            this.skin = storage.sSkin;
            this.bookingsPerPage = storage.sBookingsPerPage;
            this.stocksPerPage = storage.sStocksPerPage;
            this.activeAccountId = storage.sActiveAccountId;
            this.partner = storage.sPartner;
            this.service = storage.sService;
            this.materials = [...storage.sMaterials];
            this.markets = [...storage.sMarkets];
            this.indexes = [...storage.sIndexes];
            this.exchanges = [...storage.sExchanges];
        },
        updatePagination(bookings, stocks) {
            this.bookingsPerPage = bookings;
            this.stocksPerPage = stocks;
        },
        updateMarketData(data) {
            if (data.materials)
                this.materials = [...data.materials];
            if (data.markets)
                this.markets = [...data.markets];
            if (data.indexes)
                this.indexes = [...data.indexes];
            if (data.exchanges)
                this.exchanges = [...data.exchanges];
        },
        validateSettings() {
            return (this.bookingsPerPage > 0 &&
                this.stocksPerPage > 0 &&
                this.skin.length > 0 &&
                this.service.length > 0 &&
                Array.isArray(this.materials) &&
                Array.isArray(this.markets) &&
                Array.isArray(this.indexes) &&
                Array.isArray(this.exchanges));
        }
    }
});
log('--- STORE settings.js ---');
