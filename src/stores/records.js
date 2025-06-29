import { defineStore } from 'pinia';
import { useAppApi } from '@/pages/background';
import { useSettingsStore } from '@/stores/settings';
import { toRaw } from 'vue';
const { log } = useAppApi();
export const useRecordsStore = defineStore('records', {
    state: () => {
        return {
            accounts: [],
            bookings: [],
            bookingSum: 0,
            bookingSumField: '',
            bookingTypes: [],
            stocks: []
        };
    },
    getters: {},
    actions: {
        getAccountIndexById(ident) {
            return this.accounts.findIndex((account) => {
                return account.cID === ident;
            });
        },
        getBookingTypeNameById(ident) {
            const tmp = this.bookingTypes.filter((entry) => {
                return entry.cID === ident;
            });
            if (tmp.length > 0) {
                return tmp[0].cName;
            }
            else {
                return '';
            }
        },
        getBookingTypeById(ident) {
            return this.bookingTypes.findIndex((entry) => {
                return entry.cID === ident;
            });
        },
        getBookingTextById(ident) {
            const tmp = this.bookings.filter((entry) => {
                return entry.cID === ident;
            });
            if (tmp.length > 0) {
                return `${tmp[0].cDate} : ${tmp[0].cDebit} : ${tmp[0].cCredit}`;
            }
            else {
                throw new Error('getBookingTextById: No booking found for given ID');
            }
        },
        getBookingById(ident) {
            return this.bookings.findIndex((entry) => {
                return entry.cID === ident;
            });
        },
        getStockById(ident) {
            return this.stocks.findIndex((entry) => {
                return entry.cID === ident;
            });
        },
        sumBookings() {
            const settings = useSettingsStore();
            const activeAccountIndex = this.getAccountIndexById(settings.activeAccountId);
            if (activeAccountIndex === -1) {
                return;
            }
            const bookings_per_account = [...this.bookings];
            if (bookings_per_account.length > 0) {
                this.bookingSum = bookings_per_account.map((entry) => {
                    return entry.cCredit - entry.cDebit;
                }).reduce((acc, cur) => {
                    return acc + cur;
                }, 0);
            }
            else {
                this.bookings = [];
                this.bookingSum = 0;
            }
        },
        setBookingSumField(value) {
            this.bookingSumField = value;
        },
        initStore(stores) {
            log('RECORDS: initStore');
            this.bookings.splice(0, this.bookings.length);
            this.bookingTypes.splice(0, this.bookingTypes.length);
            this.accounts.splice(0, this.accounts.length);
            this.stocks.splice(0, this.stocks.length);
            this.accounts = stores.accounts;
            this.bookings = stores.bookings;
            this.bookingTypes = stores.bookingTypes;
            this.stocks = stores.stocks;
            this.bookings.sort((a, b) => {
                const A = new Date(a.cDate).getTime();
                const B = new Date(b.cDate).getTime();
                return B - A;
            });
        },
        addAccount(value) {
            log('RECORDS: addAccount');
            this.accounts.push(value);
        },
        updateAccount(value) {
            log('RECORDS: updateAccount');
            const cloneAccounts = [...this.accounts];
            this.accounts = cloneAccounts.map(account => {
                if (account.cID === value.cID) {
                    return value;
                }
                else {
                    return toRaw(account);
                }
            });
        },
        deleteAccount(ident) {
            log('RECORDS: deleteAccount', { info: ident });
            this.accounts.splice(this.getAccountIndexById(ident), 1);
        },
        addBooking(value) {
            log('RECORDS: addBooking');
            this.bookings.unshift(value);
        },
        deleteBooking(ident) {
            log('RECORDS: deleteBooking', { info: ident });
            this.bookings.splice(this.getBookingById(ident), 1);
        },
        addStock(value) {
            log('RECORDS: addStock');
            this.stocks.push(value);
        },
        deleteStock(ident) {
            log('RECORDS: deleteStock', { info: ident });
            this.stocks.splice(this.getStockById(ident), 1);
        },
        updateStock(value) {
            log('RECORDS: updateStock');
            const cloneStocks = [...this.stocks];
            this.stocks = cloneStocks.map(stock => {
                if (stock.cID === value.cID) {
                    return value;
                }
                else {
                    return toRaw(stock);
                }
            });
        },
        addBookingType(value) {
            log('RECORDS: addBookingType');
            this.bookingTypes.push(value);
        },
        deleteBookingType(ident) {
            log('RECORDS: deleteBookingType', { info: ident });
            this.bookingTypes.splice(this.getBookingTypeById(ident), 1);
        },
        cleanStore() {
            log('RECORDS: cleanStore');
            this.bookings.splice(0, this.bookings.length);
            this.bookingTypes.splice(0, this.bookingTypes.length);
            this.accounts.splice(0, this.accounts.length);
            this.stocks.splice(0, this.stocks.length);
        }
    }
});
log('--- STORE records.js ---');
