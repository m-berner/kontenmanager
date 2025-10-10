import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useApp } from '@/composables/useApp';
import { useSettings } from '@/composables/useSettings';
const { log } = useApp();
export const useBookingsStore = defineStore('bookings', () => {
    const items = ref([]);
    const getById = computed(() => (id) => {
        return items.value.find(account => account.cID === id);
    });
    const getIndexById = computed(() => (ident) => {
        return items.value.findIndex((entry) => entry.cID === ident);
    });
    const getTextById = computed(() => (ident) => {
        const booking = items.value.find((entry) => entry.cID === ident);
        if (booking) {
            return `${booking.cDate} : ${booking.cDebit} : ${booking.cCredit}`;
        }
        else {
            throw new Error('getTextById: No booking found for given ID');
        }
    });
    const sumBookings = computed(() => () => {
        const { activeAccountId } = useSettings();
        if (activeAccountId.value === -1) {
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
    const hasBookingType = computed(() => (ident) => {
        const findings = items.value.filter((entry) => entry.cBookingTypeID === ident);
        return findings.length > 0;
    });
    const sumFees = computed(() => {
        return items.value.map((entry) => {
            return entry.cFee;
        }).reduce((acc, cur) => acc + cur, 0);
    });
    const sumTaxes = computed(() => {
        return items.value.map((entry) => {
            return entry.cTax || entry.cSoli || entry.cSourceTax || entry.cTransactionTax;
        }).reduce((acc, cur) => acc + cur, 0);
    });
    const portfolioByStockId = computed(() => (ident) => {
        const bought = items.value.filter((entry) => {
            return entry.cStockID === ident && entry.cBookingTypeID === 1;
        }).map((entry) => {
            return entry.cCount;
        }).reduce((acc, cur) => acc + cur, 0);
        const sold = items.value.filter((entry) => {
            return entry.cStockID === ident && entry.cBookingTypeID === 2;
        }).map((entry) => {
            return entry.cCount;
        }).reduce((acc, cur) => acc + cur, 0);
        return bought - sold;
    });
    const investByStockId = computed(() => (ident) => {
        const bought = items.value.filter((entry) => {
            return entry.cStockID === ident && entry.cBookingTypeID === 1;
        }).map((entry) => {
            return entry.cCount * entry.cDebit;
        }).reduce((acc, cur) => acc + cur, 0);
        const sold = items.value.filter((entry) => {
            return entry.cStockID === ident && entry.cBookingTypeID === 2;
        }).map((entry) => {
            return entry.cCount * entry.cCredit;
        }).reduce((acc, cur) => acc + cur, 0);
        return bought - sold;
    });
    function add(booking, prepend = false) {
        log('BOOKINGS_STORE: add');
        if (prepend) {
            items.value.unshift(booking);
        }
        else {
            items.value.push(booking);
        }
    }
    function update(booking) {
        log('BOOKINGS_STORE: update');
        const index = getIndexById.value(booking?.cID ?? -1);
        if (index !== -1) {
            items.value[index] = { ...booking };
        }
    }
    function remove(ident) {
        log('BOOKINGS_STORE: remove', { info: ident });
        const index = getIndexById.value(ident);
        if (index !== -1) {
            items.value.splice(index, 1);
        }
    }
    function clean() {
        items.value.length = 0;
    }
    return {
        items,
        getById,
        getIndexById,
        getTextById,
        sumBookings,
        sumFees,
        sumTaxes,
        hasBookingType,
        portfolioByStockId,
        investByStockId,
        add,
        update,
        remove,
        clean
    };
});
log('--- STORES bookings.ts ---');
