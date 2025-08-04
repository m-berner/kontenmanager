import { defineStore } from 'pinia';
import { useApp } from '@/apis/useApp';
import { useSettingsStore } from '@/stores/settings';
const { CONS, log } = useApp();
export const useRecordsStore = defineStore('records', {
    state: () => ({
        accounts: [],
        bookings: [],
        bookingSum: 0,
        bookingTypes: [],
        stocks: [],
        totalController: CONS.RECORDS.CONTROLLER.TOTAL
    }),
    getters: {
        getAccountById: (state) => (id) => {
            return state.accounts.find(account => account.cID === id);
        },
        getBookingByAccountId: (state) => (accountId) => {
            return state.bookings.filter(booking => booking.cAccountNumberID === accountId);
        }
    },
    actions: {
        getAccountIndexById(ident) {
            return this.accounts.map((account) => {
                return account.cID;
            }).findIndex(entry => entry === ident);
        },
        getBookingTypeNameById(ident) {
            const bookingType = this.bookingTypes.find((entry) => entry.cID === ident);
            return bookingType ? bookingType.cName : '';
        },
        getBookingTypeById(ident) {
            return this.bookingTypes.findIndex((entry) => entry.cID === ident);
        },
        getBookingTextById(ident) {
            const booking = this.bookings.find((entry) => entry.cID === ident);
            if (booking) {
                return `${booking.cDate} : ${booking.cDebit} : ${booking.cCredit}`;
            }
            else {
                throw new Error('getBookingTextById: No booking found for given ID');
            }
        },
        getBookingById(ident) {
            return this.bookings.findIndex((entry) => entry.cID === ident);
        },
        getStockById(ident) {
            return this.stocks.findIndex((entry) => entry.cID === ident);
        },
        sumBookings() {
            const settings = useSettingsStore();
            const activeAccountIndex = this.getAccountIndexById(settings.activeAccountId);
            if (activeAccountIndex === -1) {
                this.bookingSum = 0;
                return;
            }
            const bookingsPerAccount = [...this.bookings];
            if (bookingsPerAccount.length > 0) {
                this.bookingSum = bookingsPerAccount
                    .map((entry) => {
                    const fees = entry.cTax + entry.cSourceTax + entry.cTransactionTax + entry.cSoli + entry.cFee;
                    const balance = entry.cCredit - entry.cDebit;
                    return fees + balance;
                })
                    .reduce((acc, cur) => acc + cur, 0);
            }
            else {
                this.bookingSum = 0;
            }
        },
        initStore(stores) {
            log('RECORDS: initStore');
            const settings = useSettingsStore();
            this.accounts.length = 0;
            this.bookings.length = 0;
            this.bookingTypes.length = 0;
            this.stocks.length = 0;
            this.accounts.push({ cID: 0, cSwift: '', cNumber: '', cLogoUrl: '', cStockAccount: false });
            this.accounts.push(...stores.accounts);
            this.bookings.push(...stores.bookings);
            this.bookingTypes.push({ cID: 0, cName: '', cAccountNumberID: settings.activeAccountId });
            this.bookingTypes.push(...stores.bookingTypes);
            this.stocks.push(...stores.stocks);
            this.bookings.sort((a, b) => {
                const dateA = new Date(a.cDate).getTime();
                const dateB = new Date(b.cDate).getTime();
                return dateB - dateA;
            });
        },
        addAccount(account) {
            log('RECORDS: addAccount');
            this.accounts.push(account);
        },
        updateAccount(account) {
            log('RECORDS: updateAccount');
            const index = this.getAccountIndexById(account.cID);
            if (index !== -1) {
                this.accounts[index] = { ...account };
            }
        },
        deleteAccount(ident) {
            log('RECORDS: deleteAccount', { info: ident });
            const index = this.getAccountIndexById(ident);
            if (index !== -1) {
                this.accounts.splice(index, 1);
            }
        },
        addBooking(booking) {
            log('RECORDS: addBooking');
            this.bookings.unshift(booking);
        },
        deleteBooking(ident) {
            log('RECORDS: deleteBooking', { info: ident });
            const index = this.getBookingById(ident);
            if (index !== -1) {
                this.bookings.splice(index, 1);
            }
        },
        addStock(stock) {
            log('RECORDS: addStock');
            this.stocks.push(stock);
        },
        updateStock(stock) {
            log('RECORDS: updateStock');
            const index = this.getStockById(stock?.cID ?? -1);
            if (index !== -1) {
                this.stocks[index] = { ...stock };
            }
        },
        updateBooking(booking) {
            log('RECORDS: updateBooking');
            const index = this.getBookingById(booking?.cID ?? -1);
            if (index !== -1) {
                this.bookings[index] = { ...booking };
            }
        },
        deleteStock(ident) {
            log('RECORDS: deleteStock', { info: ident });
            const index = this.getStockById(ident);
            if (index !== -1) {
                this.stocks.splice(index, 1);
            }
        },
        addBookingType(bookingType) {
            log('RECORDS: addBookingType');
            this.bookingTypes.push(bookingType);
        },
        deleteBookingType(ident) {
            log('RECORDS: deleteBookingType', { info: ident });
            const index = this.getBookingTypeById(ident);
            if (index !== -1) {
                this.bookingTypes.splice(index, 1);
            }
        },
        cleanStore() {
            log('RECORDS: cleanStore');
            this.accounts.length = 0;
            this.bookings.length = 0;
            this.bookingTypes.length = 0;
            this.stocks.length = 0;
            this.bookingSum = 0;
        }
    }
});
log('--- STORE records.ts ---');
