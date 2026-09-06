/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {defineStore} from "pinia";
import {computed, ref} from "vue";

import {
    aggregateBookingsPerType,
    calculateInvestByStockId,
    calculatePortfolioByStockId,
    calculateSumAllFees,
    calculateSumAllTaxes,
    calculateSumFees,
    calculateSumTaxes,
    calculateTotalSum,
    getDividendBookingsByStockId
} from "@/domain/logic";
import type {BookingDb, BookingTypeDb} from "@/domain/types";
import {isValidISODate, log, utcDate} from "@/domain/utils/utils";

/**
 * Pinia store managing financial booking records.
 * Provides computed aggregations for portfolio balances, fees, and taxes.
 *
 * @module stores/bookings
 * @returns Reactive booking state, computed aggregations,
 * and methods to mutate and enrich booking records.
 */
export const useBookingsStore = defineStore("bookings", function () {
    /** All financial booking records. */
    const items = ref<BookingDb[]>([]);

    /**
     * Inserts an item into the item array, either at the beginning or the end, based on prepended parameter.
     *
     * @param item - The item to insert into the array.
     * @param prepend - Determines the position of the insertion; if true, the item is added at the beginning, otherwise at the end.
     */
    function insertItem(item: BookingDb, prepend: boolean): void {
        items.value = prepend ? [item, ...items.value] : [...items.value, item];
    }

    /**
     * Replaces an item in the item collection with a new item based on the specified ID.
     *
     * @param id - The ID of the item to be replaced.
     * @param next - The new item to replace the existing item.
     */
    function replaceItemById(id: number, next: BookingDb): void {
        const index = getIndexById.value(id);
        if (index === -1) {
            return;
        }
        const newItems = [...items.value];
        newItems[index] = next;
        items.value = newItems;
    }

    /** Resolves the index of a booking in the collection. */
    const getIndexById = computed(() => (ident: number): number => {
        return items.value.findIndex((entry: BookingDb) => entry.cID === ident);
    });

    // `getItemById` (the throwing counterpart to `getById`) and `getTextById`
    // were removed here: neither had a single consumer in `src/` or `tests/`.
    // The throwing variant existed in all three record stores and nothing ever
    // used any of them — every real lookup site (`UpdateBooking`, `UpdateStock`,
    // `UpdateAccount`, `BookingTypeForm`, `useMenu.openLink`) reaches for the
    // nullable `getById` and writes its own guard, because each needs to do
    // something specific on a miss rather than throw. Re-adding a fail-closed
    // accessor is fine if a caller ever wants one; re-adding it speculatively is
    // what produced three unused copies.

    /** Retrieves a booking record by its ID. */
    const getById = computed(() => (ident: number): BookingDb | null => {
        const booking = items.value.find((entry: BookingDb) => entry.cID === ident);
        return booking ? booking : null;
    });

    /**
     * Total balance of all bookings.
     *
     * A plain computed value — same reasoning as `portfolio.sumDepot`: the
     * computed-returning-a-zero-argument-function shape is the idiom for
     * *parameterised* getters in this codebase, and applying it to a getter with
     * no parameters only disables the memoization. Both feed always-mounted app
     * bar chips, so both used to recompute on every re-render of that bar rather
     * than when their inputs changed.
     */
    const sumBookings = computed((): number => {
        return calculateTotalSum(items.value);
    });

    /** Checks if any bookings exist for a specific booking type. */
    const hasBookingType = computed(() => (ident: number): boolean => {
        return items.value.some((entry: BookingDb) => entry.cBookingTypeID === ident);
    });

    /** Checks if any bookings are associated with a specific stock. */
    const hasStockID = computed(() => (ident: number): boolean => {
        return items.value.some((entry: BookingDb) => entry.cStockID === ident);
    });

    /**
     * Sum of fees for a specific year.
     *
     * @param y - The target year (e.g., 2026).
     * @returns The aggregated fee sum for that year.
     */
    const sumFees = computed(() => (y: number) => {
        return calculateSumFees(items.value, y);
    });

    /**
     * Sum of taxes for a specific year.
     *
     * @param y - The target year (e.g., 2026).
     * @returns The aggregated tax sum for that year.
     */
    const sumTaxes = computed(() => (y: number) => {
        return calculateSumTaxes(items.value, y);
    });

    /** Total sum of all fees across all years. */
    const sumAllFees = computed(() => {
        return calculateSumAllFees(items.value);
    });

    /** Total sum of all taxes across all years. */
    const sumAllTaxes = computed(() => {
        return calculateSumAllTaxes(items.value);
    });

    /**
     * Aggregated booking sums per type for a specific year.
     *
     * @param y - The target year to aggregate.
     * @param bookingTypes - Booking type definitions.
     * @returns An array of per-type aggregates for the given year.
     */
    const sumBookingsPerTypeAndYear = computed(() => (bookingTypes: BookingTypeDb[], y: number) => {
        return aggregateBookingsPerType(items.value, bookingTypes, y);
    });

    /**
     * Total aggregated booking sums per type.
     *
     * @param bookingTypes - Booking type definitions.
     */
    const sumBookingsPerType = computed(() => (bookingTypes: BookingTypeDb[]) => {
        return aggregateBookingsPerType(items.value, bookingTypes);
    });

    /**
     * Calculates the current portfolio quantity for a stock (FIFO principle).
     *
     * @param ident - The stock ID.
     * @param bookingTypes - The account's own booking types (to resolve Buy/Sell ids).
     * @returns The quantity currently held.
     */
    const portfolioByStockId = computed(() => (ident: number, bookingTypes: BookingTypeDb[]) => {
        return calculatePortfolioByStockId(items.value, ident, bookingTypes);
    });

    /**
     * Calculates the total investment value still held in a stock (FIFO principle).
     *
     * @param ident - The stock ID.
     * @param bookingTypes - The account's own booking types (to resolve the Buy id).
     * @returns The total invested amount currently bound to the position.
     */
    const investByStockId = computed(() => (ident: number, bookingTypes: BookingTypeDb[]) => {
        return calculateInvestByStockId(items.value, ident, bookingTypes);
    });

    /**
     * Retrieves all dividend bookings for a specific stock.
     *
     * @param ident - The stock ID.
     * @param bookingTypes - The account's own booking types (to resolve the Dividend id).
     * @returns A list of dividend entries containing id, year (ex-date), and sum (credit).
     */
    const dividendsByStockId = computed(() => (ident: number, bookingTypes: BookingTypeDb[]) => {
        return getDividendBookingsByStockId(items.value, ident, bookingTypes);
    });

    /**
     * Set of all years that have at least one booking.
     *
     * `isValidISODate` first: the `Number.isFinite` filter below catches the
     * `NaN` that `utcDate("")` yields, but it cannot catch a **throw**, and
     * `utcDate` throws an AppError on a non-empty, non-ISO string. Read-path
     * rows are never re-validated (`databaseAdapter.getAccountRecords` returns
     * raw IndexedDB rows), so a legacy row like `"15.03.2024"` reached this
     * computed and threw out of it — and this computed's only consumer is
     * ShowAccounting's year selector, so the dialog failed to open at all for a
     * database every other view rendered fine.
     */
    const bookedYears = computed(() => {
        const years = items.value
            .filter((entry: BookingDb) => isValidISODate(entry.cBookDate))
            .map((entry: BookingDb) => utcDate(entry.cBookDate).getUTCFullYear())
            .filter((y) => Number.isFinite(y));
        return new Set(years);
    });

    /**
     * Whether any booking has no usable `cBookDate`.
     *
     * Drives the "Undated" entry in ShowAccounting's year selector. Such
     * bookings are counted by the all-time totals but by no calendar year, so
     * without that entry the dialog shows an "All Years" figure none of its own
     * year selections can reproduce, and nothing accounts for the difference.
     */
    const hasUndatedBookings = computed(() =>
        items.value.some((entry: BookingDb) => !isValidISODate(entry.cBookDate))
    );

    /**
     * Adds a booking to the store.
     *
     * @param booking - Booking record to add.
     * @param prepend - Whether to insert at the beginning.
     */
    function add(booking: BookingDb, prepend: boolean = false): void {
        log("STORES bookings: add");
        insertItem(booking, prepend);
    }

    /**
     * Updates an existing booking.
     *
     * @param booking - Updated booking data.
     */
    function update(booking: BookingDb): void {
        log("STORES bookings: update");
        replaceItemById(booking.cID, {...booking});
    }

    /**
     * Removes a booking by ID.
     *
     * @param ident - Booking ID to remove.
     */
    function remove(ident: number): void {
        log("STORES bookings: remove", ident, "info");
        items.value = items.value.filter((entry) => entry.cID !== ident);
    }

    /**
     * Clears all bookings.
     */
    function clean(): void {
        log("STORES bookings: clean");
        items.value = [];
    }

    return {
        items,
        bookedYears,
        hasUndatedBookings,
        getById,
        getIndexById,
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
        clean
    };
});

log("STORES bookings");
