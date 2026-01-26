import { useRuntimeStore } from '@/stores/runtime';
import { useRecordsStore } from '@/stores/records';
import { useAlertStore } from '@/stores/alerts';
import { useBookingsDB, useStocksDB } from '@/composables/useIndexedDB';
import { useBrowser } from '@/composables/useBrowser';
import { storeToRefs } from 'pinia';
import { computed, onUnmounted, readonly, ref } from 'vue';
import { AppError } from '@/domains/errors';
import { CODES } from '@/config/codes';
import { SYSTEM } from '@/domains/config/system';
export function useMenuHighlight() {
    const highlightedItems = ref(new Map());
    const timeouts = new Map();
    const highlight = (recordId, color = 'green') => {
        clearHighlight(recordId);
        highlightedItems.value.set(recordId, color);
    };
    const clearHighlight = (recordId) => {
        highlightedItems.value.delete(recordId);
        const timeout = timeouts.get(recordId);
        if (timeout) {
            clearTimeout(timeout);
            timeouts.delete(recordId);
        }
    };
    const clearAllHighlights = () => {
        highlightedItems.value.clear();
        for (const timeout of timeouts.values()) {
            clearTimeout(timeout);
        }
        timeouts.clear();
    };
    const highlightTemporary = (recordId, options = {}) => {
        const { color = 'green', duration = 3000 } = options;
        highlight(recordId, color);
        const existingTimeout = timeouts.get(recordId);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }
        const timeout = setTimeout(() => {
            clearHighlight(recordId);
        }, duration);
        timeouts.set(recordId, timeout);
    };
    const isHighlighted = (recordId) => {
        return highlightedItems.value.has(recordId);
    };
    const getHighlightColor = (recordId) => {
        return highlightedItems.value.get(recordId);
    };
    onUnmounted(() => {
        clearAllHighlights();
    });
    return {
        highlightedItems: readonly(computed(() => highlightedItems.value)),
        highlight,
        clearHighlight,
        clearAllHighlights,
        highlightTemporary,
        isHighlighted,
        getHighlightColor
    };
}
export function useMenuAction() {
    const runtime = useRuntimeStore();
    const records = useRecordsStore();
    const { info } = useAlertStore();
    const { notice } = useBrowser();
    const { remove: removeBooking } = useBookingsDB();
    const { remove: removeStock } = useStocksDB();
    const openDialog = (dialogName, dialogOk = false) => {
        runtime.setTeleport({
            dialogName,
            dialogOk,
            dialogVisibility: true
        });
    };
    const checkStockHasBookings = (stockId) => {
        const { items: bookingItems } = storeToRefs(records.bookings);
        return bookingItems.value.some(booking => booking.cStockID === stockId);
    };
    const actionHandlers = {
        async updateBooking() {
            openDialog('updateBooking', true);
        },
        async addBooking() {
            openDialog('addBooking', true);
        },
        async deleteBooking(recordId) {
            records.bookings.remove(recordId);
            await removeBooking(recordId);
            await notice(['Booking deleted successfully']);
        },
        async updateStock() {
            openDialog('updateStock', true);
        },
        async addStock() {
            openDialog('addStock', true);
        },
        async deleteStock(recordId) {
            if (checkStockHasBookings(recordId)) {
                info('Cannot Delete', 'This stock has associated bookings. Delete bookings first.', null);
                return;
            }
            records.stocks.remove(recordId);
            await removeStock(recordId);
            await notice(['Stock deleted successfully']);
        },
        async fadeInStock() {
            openDialog('fadeInStock', true);
        },
        async updateQuote() {
            openDialog('updateQuote', true);
        },
        async addAccount() {
            openDialog('addAccount', true);
        },
        async updateAccount() {
            openDialog('updateAccount', true);
        },
        async deleteAccount() {
            openDialog('deleteAccount', true);
        },
        async deleteAccountConfirmation() {
            openDialog('deleteAccountConfirmation', true);
        },
        async addBookingType() {
            openDialog('addBookingType', true);
        },
        async updateBookingType() {
            openDialog('updateBookingType', true);
        },
        async deleteBookingType() {
            openDialog('deleteBookingType', true);
        },
        async showDividend() {
            openDialog('showDividend', false);
        },
        async showAccounting() {
            openDialog('showAccounting', false);
        },
        async openLink(recordId) {
            const { items: stockItems } = storeToRefs(records.stocks);
            const stockIndex = records.stocks.getIndexById(recordId);
            const url = stockItems.value[stockIndex]?.cURL;
            if (url) {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
            else {
                await notice(['No URL available for this stock']);
            }
        },
        async exportDatabase() {
            openDialog('exportDatabase', true);
        },
        async importDatabase() {
            openDialog('importDatabase', true);
        },
        async home() {
            runtime.setCurrentView(CODES.VIEW_CODES.HOME);
        },
        async company() {
            runtime.setCurrentView(CODES.VIEW_CODES.COMPANY);
        },
        async setting() {
            runtime.setCurrentView(CODES.VIEW_CODES.SETTINGS);
        }
    };
    const executeAction = async (actionType, recordId) => {
        runtime.activeId = recordId;
        const handler = actionHandlers[actionType];
        if (!handler) {
            throw new AppError(`Unknown action type: ${actionType}`, 'USE_MENU_ACTION', SYSTEM.ERROR_CATEGORY.VALIDATION, {}, false);
        }
        try {
            await handler(recordId);
        }
        catch (err) {
            throw new AppError('Unknown error', 'USE_MENU_ACTION', SYSTEM.ERROR_CATEGORY.VALIDATION, { p: err }, true);
        }
    };
    const hasAction = (actionType) => {
        return actionType in actionHandlers;
    };
    return {
        executeAction,
        hasAction
    };
}
