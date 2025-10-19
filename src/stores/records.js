import { defineStore } from 'pinia';
import { useApp } from '@/composables/useApp';
import { useSettings } from '@/composables/useSettings';
import { useAccountsStore } from '@/stores/childs/accounts';
import { useBookingsStore } from '@/stores/childs/bookings';
import { useBookingTypesStore } from '@/stores/childs/bookingTypes';
import { useStocksStore } from '@/stores/childs/stocks';
import { useBrowser } from '@/composables/useBrowser';
const { CONS, log } = useApp();
export const useRecordsStore = defineStore('records', () => {
    const accountsStore = useAccountsStore();
    const bookingsStore = useBookingsStore();
    const bookingTypesStore = useBookingTypesStore();
    const stocksStore = useStocksStore();
    function clean(all = true) {
        log('RECORDS: clean');
        if (all) {
            accountsStore.clean();
        }
        bookingsStore.clean();
        bookingTypesStore.clean();
        stocksStore.clean();
    }
    async function init(storesDB, removeAccounts = true) {
        log('RECORDS: init');
        const load = (stores) => {
            log('RECORDS: load');
            const { activeAccountId } = useSettings();
            for (const entry of stores.accounts) {
                accountsStore.add(entry);
            }
            for (const entry of stores.bookings) {
                bookingsStore.add(entry);
            }
            for (const entry of stores.bookingTypes) {
                bookingTypesStore.add(entry);
            }
            for (const entry of stores.stocks) {
                stocksStore.add(entry);
            }
            stocksStore.add({
                cID: 0,
                cISIN: 'XX0000000000',
                cSymbol: 'XYZOO6',
                cFadeOut: 0,
                cFirstPage: 0,
                cURL: '',
                cCompany: '',
                cMeetingDay: '',
                cQuarterDay: '',
                cAccountNumberID: activeAccountId.value,
                cAskDates: CONS.DATE.DEFAULT_ISO
            }, true);
            bookingsStore.items.sort((a, b) => {
                const dateA = new Date(a.cDate).getTime();
                const dateB = new Date(b.cDate).getTime();
                return dateB - dateA;
            });
        };
        const { activeAccountId } = useSettings();
        const { setStorage } = useBrowser();
        if (activeAccountId.value > -1 && storesDB.accountsDB.length > 0) {
            activeAccountId.value = storesDB.accountsDB[0].cID;
            await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.ACTIVE_ACCOUNT_ID, activeAccountId.value);
        }
        const stocksOnlyMemory = {
            mPortfolio: 0,
            mInvest: 0,
            mChange: 0,
            mBuyValue: 0,
            mEuroChange: 0,
            mMin: 0,
            mValue: 0,
            mMax: 0,
            mDividendYielda: 0,
            mDividendYeara: 0,
            mDividendYieldb: 0,
            mDividendYearb: 0,
            mRealDividend: 0,
            mRealBuyValue: 0,
            mDeleteable: false
        };
        const stores = {
            accounts: storesDB.accountsDB,
            bookings: storesDB.bookingsDB,
            bookingTypes: storesDB.bookingTypesDB,
            stocks: storesDB.stocksDB.map((stock) => {
                return { ...stock, ...stocksOnlyMemory };
            })
        };
        clean(removeAccounts);
        load(stores);
    }
    return {
        accounts: accountsStore,
        bookings: bookingsStore,
        bookingTypes: bookingTypesStore,
        stocks: stocksStore,
        init,
        clean
    };
});
log('--- STORES records.ts ---');
