import { defineStore } from 'pinia';
import { useAppApi } from '@/pages/background';
import { useSettingsStore } from '@/stores/settings';
const { log } = useAppApi();
export const useRecordsStore = defineStore('records', {
    state: () => {
        return {
            _accounts: [],
            _bookings: [],
            _booking_sum: 0,
            _booking_sum_field: '',
            _booking_types: [],
            _stocks: []
        };
    },
    getters: {
        accounts(state) {
            return state._accounts;
        },
        bookings(state) {
            return state._bookings;
        },
        stocks(state) {
            return state._stocks;
        },
        bookingSum(state) {
            return state._booking_sum;
        },
        bookingSumField(state) {
            return state._booking_sum_field;
        },
        bookingTypes(state) {
            return state._booking_types;
        }
    },
    actions: {
        getAccountIndexById(ident) {
            return this._accounts.findIndex((account) => {
                return account.cID === ident;
            });
        },
        getBookingTypeNameById(ident) {
            const tmp = this._booking_types.filter((entry) => {
                return entry.cID === ident;
            });
            if (tmp.length > 0) {
                return tmp[0].cName;
            }
            else {
                return '';
            }
        },
        getBookingTextById(ident) {
            const tmp = this._bookings.filter((entry) => {
                return entry.cID === ident;
            });
            if (tmp.length > 0) {
                return `${tmp[0].cDate} : ${tmp[0].cDebit} : ${tmp[0].cCredit}`;
            }
            else {
                throw new Error('getBookingTextById: No booking found for given ID');
            }
        },
        sumBookings() {
            const settings = useSettingsStore();
            const activeAccountIndex = this.getAccountIndexById(settings.activeAccountId);
            if (activeAccountIndex === -1) {
                return;
            }
            const bookings_per_account = this._bookings.filter((rec) => {
                return rec.cAccountNumberID === this._accounts[activeAccountIndex].cID;
            });
            if (bookings_per_account.length > 0) {
                bookings_per_account.sort((a, b) => {
                    const A = new Date(a.cDate).getTime();
                    const B = new Date(b.cDate).getTime();
                    return A - B;
                });
                this._bookings = bookings_per_account;
                this._booking_sum = bookings_per_account.map((entry) => {
                    return entry.cCredit - entry.cDebit;
                }).reduce((acc, cur) => acc + cur, 0);
            }
            else {
                this._bookings = [];
                this._booking_sum = 0;
            }
        },
        setBookingSumField(value) {
            this._booking_sum_field = value;
        },
        initStore(stores) {
            log('RECORDS: initStore');
            this._accounts = stores.accounts;
            this._bookings = stores.bookings;
            this._booking_types = stores.bookingTypes;
            this._stocks = stores.stocks;
        },
        cleanStores() {
            log('RECORDS: cleanStores');
            this._bookings.splice(0, this._bookings.length);
            this._booking_types.splice(0, this._booking_types.length);
            this._accounts.splice(0, this._accounts.length);
            this._stocks.splice(0, this._accounts.length);
        }
    }
});
log('--- STORE records.js ---');
