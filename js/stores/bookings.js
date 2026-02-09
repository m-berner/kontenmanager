import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { DomainUtils } from "@/domains/utils";
import { useBookingTypesStore } from "@/stores/bookingTypes";
import { DomainLogic } from "@/domains/logic";
import { AppError, ERROR_CATEGORY } from "@/domains/errors";
export const useBookingsStore = defineStore("bookings", function () {
    const items = ref([]);
    const getIndexById = computed(() => (ident) => {
        return items.value.findIndex((entry) => entry.cID === ident);
    });
    const getItemById = computed(() => (id) => items.value[getIndexById.value(id)]);
    const getById = computed(() => (ident) => {
        const booking = items.value.find((entry) => entry.cID === ident);
        return booking ? booking : null;
    });
    const getTextById = computed(() => (ident) => {
        const booking = items.value.find((entry) => entry.cID === ident);
        if (booking) {
            return `${booking.cBookDate} : ${booking.cDebit} : ${booking.cCredit}`;
        }
        else {
            throw new AppError("xx_missing_record", ERROR_CATEGORY.STORE, false);
        }
    });
    const sumBookings = computed(() => () => {
        return DomainLogic.calculateTotalSum(items.value);
    });
    const hasBookingType = computed(() => (ident) => {
        const findings = items.value.filter((entry) => entry.cBookingTypeID === ident);
        return findings.length > 0;
    });
    const hasStockID = computed(() => (ident) => {
        const findings = items.value.filter((entry) => entry.cStockID === ident);
        return findings.length > 0;
    });
    const sumFees = computed(() => (y) => {
        return DomainLogic.calculateSumFees(items.value, y);
    });
    const sumTaxes = computed(() => (y) => {
        return DomainLogic.calculateSumTaxes(items.value, y);
    });
    const sumAllFees = computed(() => {
        return DomainLogic.calculateSumAllFees(items.value);
    });
    const sumAllTaxes = computed(() => {
        return DomainLogic.calculateSumAllTaxes(items.value);
    });
    const sumBookingsPerTypeAndYear = computed(() => (y) => {
        const bt = useBookingTypesStore();
        return DomainLogic.aggregateBookingsPerType(items.value, bt.items, y);
    });
    const sumBookingsPerType = computed(() => {
        const bt = useBookingTypesStore();
        return DomainLogic.aggregateBookingsPerType(items.value, bt.items);
    });
    const portfolioByStockId = computed(() => (ident) => {
        return DomainLogic.calculatePortfolioByStockId(items.value, ident);
    });
    const investByStockId = computed(() => (ident) => {
        return DomainLogic.calculateInvestByStockId(items.value, ident);
    });
    const dividendsByStockId = computed(() => (ident) => {
        return items.value
            .filter((entry) => {
            return entry.cStockID === ident && entry.cBookingTypeID === 3;
        })
            .map((entry) => {
            return { id: ident, year: entry.cExDate, sum: entry.cCredit };
        });
    });
    const bookedYears = computed(() => {
        const years = items.value.map((entry) => new Date(entry.cBookDate).getFullYear());
        return new Set(years);
    });
    function add(booking, prepend = false) {
        DomainUtils.log("RECORDS_BOOKINGS: add");
        if (prepend) {
            items.value = [booking, ...items.value];
        }
        else {
            items.value = [...items.value, booking];
        }
    }
    function update(booking) {
        DomainUtils.log("RECORDS_BOOKINGS: update");
        const index = getIndexById.value(booking.cID);
        if (index !== -1) {
            const newItems = [...items.value];
            newItems[index] = { ...booking };
            items.value = newItems;
        }
    }
    function remove(ident) {
        DomainUtils.log("RECORDS_BOOKINGS: remove", ident, "info");
        items.value = items.value.filter((entry) => entry.cID !== ident);
    }
    function clean() {
        DomainUtils.log("RECORDS_BOOKINGS: clean");
        items.value = [];
    }
    function set(bookings) {
        items.value = bookings;
    }
    return {
        items,
        bookedYears,
        getById,
        getItemById,
        getIndexById,
        getTextById,
        sumBookings,
        sumFees,
        sumTaxes,
        sumAllFees,
        sumAllTaxes,
        sumBookingsPerTypeAndYear,
        sumBookingsPerType,
        hasBookingType,
        hasStockID,
        portfolioByStockId,
        investByStockId,
        dividendsByStockId,
        add,
        update,
        remove,
        set,
        clean
    };
});
DomainUtils.log("STORES bookings");
