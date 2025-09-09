import { defineStore } from 'pinia';
import { useApp } from '@/composables/useApp';
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
    function cleanStore() {
        log('RECORDS: cleanStore');
        accountsStore.clean();
        bookingsStore.clean();
        bookingTypesStore.clean();
        stocksStore.clean();
    }
    function initStore(stores) {
        log('RECORDS: initStore', { info: stores });
        const settings = useSettingsStore();
        cleanStore();
        accountsStore.items = [...stores.accounts];
        accountsStore.addAccount({ cID: 0, cSwift: '', cNumber: '', cLogoUrl: '', cWithDepot: false }, true);
        bookingsStore.items = stores.bookings.filter((booking) => booking.cAccountNumberID === settings.activeAccountId);
        bookingTypesStore.items = stores.bookingTypes.filter((bookingType) => bookingType.cAccountNumberID === settings.activeAccountId);
        bookingTypesStore.addBookingType({ cID: 0, cName: '', cAccountNumberID: settings.activeAccountId }, true);
        stocksStore.items = stores.stocks.filter((stock) => stock.cAccountNumberID === settings.activeAccountId);
        stocksStore.addStock({
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
    return {
        accounts: accountsStore,
        bookings: bookingsStore,
        bookingTypes: bookingTypesStore,
        stocks: stocksStore,
        initStore,
        cleanStore
    };
});
log('--- STORE records.ts ---');
