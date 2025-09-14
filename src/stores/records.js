import { defineStore } from 'pinia';
import { useApp } from '@/composables/useApp';
import { useAccountsDB, useBookingsDB, useBookingTypesDB, useStocksDB } from '@/composables/useIndexedDB';
import { useAccounts } from '@/stores/childs/accounts';
import { useBookings } from '@/stores/childs/bookings';
import { useBookingTypes } from '@/stores/childs/bookingTypes';
import { useStocks } from '@/stores/childs/stocks';
import { useSettingsStore } from '@/stores/settings';
const { log } = useApp();
export const useRecordsStore = defineStore('records', () => {
    const accountsStore = useAccounts();
    const bookingsStore = useBookings();
    const bookingTypesStore = useBookingTypes();
    const stocksStore = useStocks();
    function clean(all = true) {
        log('RECORDS: clean');
        if (all) {
            accountsStore.clean();
        }
        bookingsStore.clean();
        bookingTypesStore.clean();
        stocksStore.clean();
    }
    function load(stores) {
        log('RECORDS: load');
        const settings = useSettingsStore();
        for (const entry of stores.accounts) {
            accountsStore.add(entry);
        }
        accountsStore.add({ cID: 0, cSwift: '', cIban: '', cLogoUrl: '', cWithDepot: false }, true);
        for (const entry of stores.bookings) {
            bookingsStore.add(entry);
        }
        for (const entry of stores.bookingTypes) {
            bookingTypesStore.add(entry);
        }
        bookingTypesStore.add({ cID: 0, cName: '', cAccountNumberID: settings.activeAccountId }, true);
        for (const entry of stores.stocks) {
            stocksStore.add(entry);
        }
        stocksStore.add({
            cID: 0,
            cISIN: 'XX00000000000000000000',
            cWKN: 'AAAAAAA',
            cSymbol: 'WWW',
            cFadeOut: 0,
            cFirstPage: 0,
            cURL: '',
            cCompany: '',
            cMeetingDay: '',
            cQuarterDay: '',
            cAccountNumberID: settings.activeAccountId,
            mBuyValue: 0,
            mMax: 0,
            mMin: 0,
            mChange: 0,
            mEuroChange: 0,
            mPortfolio: 0,
            mValue: 0
        }, true);
        bookingsStore.items.sort((a, b) => {
            const dateA = new Date(a.cDate).getTime();
            const dateB = new Date(b.cDate).getTime();
            return dateB - dateA;
        });
    }
    async function init() {
        log('RECORDS: init');
        const { getAllAccounts } = useAccountsDB();
        const { getAllBookings } = useBookingsDB();
        const { getAllBookingTypes } = useBookingTypesDB();
        const { getAllStocks } = useStocksDB();
        const settings = useSettingsStore();
        const accounts = await getAllAccounts();
        const bookings = (await getAllBookings()).filter((booking) => booking.cAccountNumberID === settings.activeAccountId);
        const bookingTypes = (await getAllBookingTypes()).filter((bookingType) => bookingType.cAccountNumberID === settings.activeAccountId);
        const stocks = (await getAllStocks()).filter((stock) => stock.cAccountNumberID === settings.activeAccountId);
        const stocksOnlyMemory = {
            mPortfolio: 0,
            mChange: 0,
            mBuyValue: 0,
            mEuroChange: 0,
            mMin: 0,
            mValue: 0,
            mMax: 0
        };
        const stores = {
            accounts,
            bookings,
            bookingTypes,
            stocks: stocks.map((stock) => {
                return { ...stock, ...stocksOnlyMemory };
            })
        };
        if (settings.activeAccountId < 1 && accounts.length > 0) {
            settings.activeAccountId = accounts[0].cID;
        }
        clean();
        load(stores);
    }
    return {
        accounts: accountsStore,
        bookings: bookingsStore,
        bookingTypes: bookingTypesStore,
        stocks: stocksStore,
        init,
        load,
        clean
    };
});
log('--- STORES records.ts ---');
