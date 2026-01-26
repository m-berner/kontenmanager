import { defineStore, storeToRefs } from 'pinia';
import { useSettingsStore } from '@/stores/settings';
import { useAlertStore } from '@/stores/alerts';
import { UtilsService } from '@/services/utils';
import { SESSION_STORAGE } from '@/configurations/storage';
import { DEFAULTS } from '@/configurations/defaults';
import { DATE } from '@/configurations/date';
import { useBrowser } from '@/composables/useBrowser';
import { useAccountsStore } from '@/stores/accounts';
import { useBookingsStore } from '@/stores/bookings';
import { useBookingTypesStore } from '@/stores/bookingTypes';
import { useStocksStore } from '@/stores/stocks';
export const useRootStore = defineStore('root', function () {
    const accountsStore = useAccountsStore();
    const bookingsStore = useBookingsStore();
    const bookingTypesStore = useBookingTypesStore();
    const stocksStore = useStocksStore();
    function clean(all = true) {
        UtilsService.log('RECORDS: clean');
        if (all) {
            accountsStore.clean();
        }
        bookingsStore.clean();
        bookingTypesStore.clean();
        stocksStore.clean();
    }
    async function init(storesDB, messages, removeAccounts = true) {
        UtilsService.log('RECORDS: init');
        const settings = useSettingsStore();
        const { activeAccountId } = storeToRefs(settings);
        const { info } = useAlertStore();
        clean(removeAccounts);
        storesDB.accountsDB.forEach(a => accountsStore.add(a));
        storesDB.bookingTypesDB.forEach(bt => bookingTypesStore.add(bt));
        storesDB.stocksDB.forEach(s => stocksStore.add({ ...s, ...DEFAULTS.STOCK_MEMORY }));
        storesDB.bookingsDB.forEach(b => bookingsStore.add(b));
        bookingsStore.items.sort((a, b) => new Date(b.cBookDate).getTime() - new Date(a.cBookDate).getTime());
        stocksStore.add({
            cID: 0,
            cISIN: 'XX0000000000',
            cSymbol: 'XXXOO0',
            cFadeOut: 1,
            cFirstPage: 0,
            cURL: '',
            cCompany: '',
            cMeetingDay: '',
            cQuarterDay: '',
            cAccountNumberID: activeAccountId.value,
            cAskDates: DATE.ISO
        }, true);
        const { getStorage } = useBrowser();
        const session = await getStorage([SESSION_STORAGE.HIDE_IMPORT_ALERT.key]);
        if (accountsStore.items.length === 0 && !session[SESSION_STORAGE.HIDE_IMPORT_ALERT.key]) {
            info(messages.title, messages.message, null);
            const { setStorage } = useBrowser();
            await setStorage(SESSION_STORAGE.HIDE_IMPORT_ALERT.key, true);
        }
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
UtilsService.log('--- stores/root.ts ---');
