import { defineStore } from 'pinia';
import { useNotification } from '@/composables/useNotification';
import { useAccounts } from '@/stores/childs/accounts';
import { useBookings } from '@/stores/childs/bookings';
import { useBookingTypes } from '@/stores/childs/bookingTypes';
import { useStocks } from '@/stores/childs/stocks';
import { useSettingsStore } from '@/stores/settings';
const { log } = useNotification();
export const useRecordsStore = defineStore('records', () => {
    const accountsStore = useAccounts();
    const bookingsStore = useBookings();
    const bookingTypesStore = useBookingTypes();
    const stocksStore = useStocks();
    function initStore(stores) {
        log('RECORDS: initStore', { info: stores });
        const settings = useSettingsStore();
        accountsStore.clean();
        bookingsStore.clean();
        bookingTypesStore.clean();
        stocksStore.clean();
        accountsStore.setAccounts(stores.accounts);
        accountsStore.addAccount({ cID: 0, cSwift: '', cNumber: '', cLogoUrl: '', cStockAccount: false }, true);
        bookingsStore.setBookings(stores.bookings);
        bookingTypesStore.setBookingTypes(stores.bookingTypes);
        bookingTypesStore.addBookingType({ cID: 0, cName: '', cAccountNumberID: settings.activeAccountId }, true);
        stocksStore.setStocks(stores.stocks);
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
        initStore
    };
});
log('--- STORE records.ts ---');
