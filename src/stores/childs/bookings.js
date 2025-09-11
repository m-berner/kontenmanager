import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useApp } from '@/composables/useApp';
import { useSettingsStore } from '@/stores/settings';
const { log } = useApp();
export const useBookings = defineStore('bookings', () => {
    const items = ref([]);
    const getBookingsByAccountId = computed(() => (accountId) => {
        return items.value.filter(booking => booking.cAccountNumberID === accountId);
    });
    const getBookingById = computed(() => (id) => {
        return items.value.find(account => account.cID === id);
    });
    const getBookingIndexById = computed(() => (ident) => {
        return items.value.findIndex((entry) => entry.cID === ident);
    });
    const getBookingTextById = computed(() => (ident) => {
        const booking = items.value.find((entry) => entry.cID === ident);
        if (booking) {
            return `${booking.cDate} : ${booking.cDebit} : ${booking.cCredit}`;
        }
        else {
            throw new Error('getBookingTextById: No booking found for given ID');
        }
    });
    const sumBookings = computed(() => () => {
        const settings = useSettingsStore();
        if (settings.activeAccountId === -1) {
            return 0;
        }
        if (items.value.length > 0) {
            return items.value
                .map((entry) => {
                const fees = entry.cTax + entry.cSourceTax + entry.cTransactionTax + entry.cSoli + entry.cFee;
                const balance = entry.cCredit - entry.cDebit;
                return fees + balance;
            })
                .reduce((acc, cur) => acc + cur, 0);
        }
        else {
            return 0;
        }
    });
    const includeBookingTypeId = computed(() => (ident) => {
        return items.value.findIndex((entry) => entry.cBookingTypeID === ident);
    });
    function addBooking(booking, prepend = false) {
        log('BOOKINGS_STORE: addBooking');
        if (prepend) {
            items.value.unshift(booking);
        }
        else {
            items.value.push(booking);
        }
    }
    function updateBooking(booking) {
        log('BOOKINGS_STORE: updateBooking');
        const index = getBookingIndexById.value(booking?.cID ?? -1);
        if (index !== -1) {
            items.value[index] = { ...booking };
        }
    }
    function deleteBooking(ident) {
        log('BOOKINGS_STORE: deleteBooking', { info: ident });
        const index = getBookingIndexById.value(ident);
        if (index !== -1) {
            items.value.splice(index, 1);
        }
    }
    function clean() {
        items.value.length = 0;
    }
    return {
        items,
        getBookingById,
        getBookingIndexById,
        getBookingsByAccountId,
        getBookingTextById,
        sumBookings,
        includeBookingTypeId,
        addBooking,
        updateBooking,
        deleteBooking,
        clean
    };
});
log('--- STORES bookings.ts ---');
