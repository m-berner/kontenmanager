import { useRuntimeStore } from '@/stores/runtime';
import { useRecordsStore } from '@/stores/records';
import { useAlertStore } from '@/stores/alerts';
import { useBookingsDB, useStocksDB } from '@/composables/useIndexedDB';
import { useBrowser } from '@/composables/useBrowser';
import { storeToRefs } from 'pinia';
export function useMenuActions() {
    const runtime = useRuntimeStore();
    const records = useRecordsStore();
    const { info } = useAlertStore();
    const { notice } = useBrowser();
    const { remove: removeBooking } = useBookingsDB();
    const { remove: removeStock } = useStocksDB();
    const actionHandlers = {
        async updateBooking(_recordId) {
            runtime.setTeleport({
                dialogName: 'updateBooking',
                dialogOk: true,
                dialogVisibility: true
            });
        },
        async deleteBooking(recordId) {
            records.bookings.remove(recordId);
            await removeBooking(recordId);
            await notice(['Booking deleted successfully']);
        },
        async updateStock(_recordId) {
            runtime.setTeleport({
                dialogName: 'updateStock',
                dialogOk: true,
                dialogVisibility: true
            });
        },
        async deleteStock(recordId) {
            const { items: bookingItems } = storeToRefs(records.bookings);
            const hasBookings = bookingItems.value.some(booking => booking.cStockID === recordId);
            if (hasBookings) {
                info('Cannot Delete', 'This stock has associated bookings. Delete bookings first.', null);
                return;
            }
            records.stocks.remove(recordId);
            await removeStock(recordId);
            await notice(['Stock deleted successfully']);
        },
        async showDividend(_recordId) {
            runtime.setTeleport({
                dialogName: 'showDividend',
                dialogOk: false,
                dialogVisibility: true
            });
        },
        async openLink(recordId) {
            const { items: stockItems } = storeToRefs(records.stocks);
            const stockIndex = records.stocks.getIndexById(recordId);
            const url = stockItems.value[stockIndex]?.cURL;
            if (url) {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        },
        async fadeInStock(_recordId) {
        },
        async addAccount(_recordId) {
        },
        async updateAccount(_recordId) {
        },
        async deleteAccount(_recordId) {
        },
        async addStock(_recordId) {
        },
        async addBookingType(_recordId) {
        },
        async deleteBookingType(_recordId) {
        },
        async updateBookingType(_recordId) {
        },
        async addBooking(_recordId) {
        },
        async exportDatabase(_recordId) {
        },
        async importDatabase(_recordId) {
        },
        async showAccounting(_recordId) {
        },
        async updateQuote(_recordId) {
        },
        async deleteAccountConfirmation(_recordId) {
        },
        async home(_recordId) {
        },
        async company(_recordId) {
        },
        async setting(_recordId) {
        }
    };
    const executeAction = async (actionType, recordId) => {
        runtime.activeId = recordId;
        const handler = actionHandlers[actionType];
        if (!handler) {
            console.error(`Unknown action type: ${actionType}`);
            return;
        }
        try {
            await handler(recordId);
        }
        catch (error) {
            console.error(`Action ${actionType} failed:`, error);
            throw error;
        }
    };
    return { executeAction };
}
