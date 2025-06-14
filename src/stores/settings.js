import { defineStore } from 'pinia';
import {} from 'vuetify';
import { useAppApi } from '@/pages/background';
const { CONS, log } = useAppApi();
export const useSettingsStore = defineStore('settings', {
    state: () => {
        return {
            _skin: CONS.DEFAULTS.STORAGE.SKIN,
            _bookings_per_page: CONS.DEFAULTS.STORAGE.BOOKINGS_PER_PAGE,
            _stocks_per_page: CONS.DEFAULTS.STORAGE.STOCKS_PER_PAGE,
            _active_account_id: -1,
            _debug: false,
            _partner: false,
            _service: CONS.DEFAULTS.STORAGE.SERVICE,
            _materials: CONS.DEFAULTS.STORAGE.MATERIALS,
            _markets: CONS.DEFAULTS.STORAGE.MARKETS,
            _indexes: CONS.DEFAULTS.STORAGE.INDEXES,
            _exchanges: CONS.DEFAULTS.STORAGE.EXCHANGES
        };
    },
    getters: {
        activeAccountId(state) {
            return state._active_account_id;
        },
        bookingsPerPage(state) {
            return state._bookings_per_page;
        },
        stocksPerPage(state) {
            return state._stocks_per_page;
        },
        skin(state) {
            return state._skin;
        },
        debug(state) {
            return state._debug;
        },
        partner(state) {
            return state._partner;
        },
        service(state) {
            return state._service;
        },
        materials(state) {
            return state._materials;
        },
        markets(state) {
            return state._markets;
        },
        indexes(state) {
            return state._indexes;
        },
        exchanges(state) {
            return state._exchanges;
        }
    },
    actions: {
        setActiveAccountId(value) {
            this._active_account_id = value;
        },
        setBookingsPerPage(value) {
            this._bookings_per_page = value;
        },
        setStocksPerPage(value) {
            this._stocks_per_page = value;
        },
        setSkin(theme, value) {
            theme.global.name.value = value;
            this._skin = value;
        },
        setDebug(value) {
            this._debug = value;
        },
        setPartner(value) {
            this._partner = value;
        },
        setService(value) {
            this._service = value;
        },
        setMaterials(value) {
            this._materials = value;
        },
        setMarkets(value) {
            this._markets = value;
        },
        setIndexes(value) {
            this._indexes = value;
        },
        setExchanges(value) {
            this._exchanges = value;
        },
        initStore(theme, storage) {
            log('SETTINGS: initStore');
            theme.global.name.value = storage.sSkin;
            this._skin = storage.sSkin;
            this._bookings_per_page = storage.sBookingsPerPage;
            this._stocks_per_page = storage.sStocksPerPage;
            this._active_account_id = storage.sActiveAccountId;
            this._debug = storage.sDebug;
            this._partner = storage.sPartner;
            this._service = storage.sService;
            this._materials = storage.sMaterials;
            this._markets = storage.sMarkets;
            this._indexes = storage.sIndexes;
            this._exchanges = storage.sExchanges;
        }
    }
});
log('--- STORE settings.js ---');
