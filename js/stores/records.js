import { defineStore } from 'pinia';
import { useSettingsStore } from '@/stores/settings';
import { useAlertStore } from '@/stores/alerts';
import { UtilsService } from '@/domains/utils';
import { useAccountsStore } from '@/stores/accounts';
import { useBookingsStore } from '@/stores/bookings';
import { useBookingTypesStore } from '@/stores/bookingTypes';
import { useStocksStore } from '@/stores/stocks';
import { DomainLogic } from '@/domains/logic';
export const useRecordsStore = defineStore('records', function () {
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
        const settings = useSettingsStore();
        const alerts = useAlertStore();
        await DomainLogic.initializeRecords(storesDB, {
            accounts: accountsStore,
            bookings: bookingsStore,
            bookingTypes: bookingTypesStore,
            stocks: stocksStore,
            settings,
            alerts
        }, messages, removeAccounts);
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
UtilsService.log('--- stores/records.ts ---');
