/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {BookingDb} from "@/types";
import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {DomainUtils} from "@/domains/utils";
import {useBookingTypesStore} from "@/stores/bookingTypes";
import {DomainLogic} from "@/domains/logic";
import {AppError, ERROR_CATEGORY} from "@/domains/errors";

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

    function insertItem(item: BookingDb, prepend: boolean): void {
        items.value = prepend ? [item, ...items.value] : [...items.value, item];
    }

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

    /** Resolves a booking by its ID. */
    const getItemById = computed(
        () =>
            (id: number): BookingDb =>
                items.value[getIndexById.value(id)]
    );

    /** Retrieves a booking record by its ID. */
    const getById = computed(() => (ident: number): BookingDb | null => {
        const booking = items.value.find((entry: BookingDb) => entry.cID === ident);
        return booking ? booking : null;
    });

    /** Generates a summary text for a booking. */
    const getTextById = computed(() => (ident: number): string => {
        const booking = items.value.find((entry: BookingDb) => entry.cID === ident);
        if (booking) {
            return `${booking.cBookDate} : ${booking.cDebit} : ${booking.cCredit}`;
        } else {
            throw new AppError(
                "xx_missing_record",
                ERROR_CATEGORY.STORE,
                false
            );
        }
    });

    /** Total balance of all bookings. */
    const sumBookings = computed(() => (): number => {
        return DomainLogic.calculateTotalSum(items.value);
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
        return DomainLogic.calculateSumFees(items.value, y);
    });

    /**
     * Sum of taxes for a specific year.
     *
     * @param y - The target year (e.g., 2026).
     * @returns The aggregated tax sum for that year.
     */
    const sumTaxes = computed(() => (y: number) => {
        return DomainLogic.calculateSumTaxes(items.value, y);
    });

    /** Total sum of all fees across all years. */
    const sumAllFees = computed(() => {
        return DomainLogic.calculateSumAllFees(items.value);
    });

    /** Total sum of all taxes across all years. */
    const sumAllTaxes = computed(() => {
        return DomainLogic.calculateSumAllTaxes(items.value);
    });

    /**
     * Aggregated booking sums per type for a specific year.
     *
     * @param y - The target year to aggregate.
     * @returns An array of per-type aggregates for the given year.
     */
    const sumBookingsPerTypeAndYear = computed(() => (y: number) => {
        const bt = useBookingTypesStore();
        return DomainLogic.aggregateBookingsPerType(items.value, bt.items, y);
    });

    /** Total aggregated booking sums per type. */
    const sumBookingsPerType = computed(() => {
        const bt = useBookingTypesStore();
        return DomainLogic.aggregateBookingsPerType(items.value, bt.items);
    });

    /**
     * Calculates the current portfolio quantity for a stock (FIFO principle).
     *
     * @param ident - The stock ID.
     * @returns The quantity currently held.
     */
    const portfolioByStockId = computed(() => (ident: number) => {
        return DomainLogic.calculatePortfolioByStockId(items.value, ident);
    });

    /**
     * Calculates the total investment value still held in a stock (FIFO principle).
     *
     * @param ident - The stock ID.
     * @returns The total invested amount currently bound to the position.
     */
    const investByStockId = computed(() => (ident: number) => {
        return DomainLogic.calculateInvestByStockId(items.value, ident);
    });

    /**
     * Retrieves all dividend bookings for a specific stock.
     *
     * @param ident - The stock ID.
     * @returns A list of dividend entries containing id, year (ex-date), and sum (credit).
     */
    const dividendsByStockId = computed(() => (ident: number) => {
        return items.value
            .filter((entry: BookingDb) => {
                return entry.cStockID === ident && entry.cBookingTypeID === 3;
            })
            .map((entry: BookingDb) => {
                return {id: ident, year: entry.cExDate, sum: entry.cCredit};
            });
    });

    /** Set of all years that have at least one booking. */
    const bookedYears = computed(() => {
        const years = items.value.map((entry: BookingDb) =>
            new Date(entry.cBookDate).getFullYear()
        );
        return new Set(years);
    });

    /**
     * Adds a booking to the store.
     *
     * @param booking - Booking record to add.
     * @param prepend - Whether to insert at the beginning.
     */
    function add(booking: BookingDb, prepend: boolean = false): void {
        DomainUtils.log("STORES bookings: add", booking, "info");
        insertItem(booking, prepend);
    }

    /**
     * Updates an existing booking.
     *
     * @param booking - Updated booking data.
     */
    function update(booking: BookingDb): void {
        DomainUtils.log("STORES bookings: update");
        replaceItemById(booking.cID, {...booking});
    }

    /**
     * Removes a booking by ID.
     *
     * @param ident - Booking ID to remove.
     */
    function remove(ident: number): void {
        DomainUtils.log("STORES bookings: remove", ident, "info");
        items.value = items.value.filter((entry) => entry.cID !== ident);
    }

    /**
     * Clears all bookings.
     */
    function clean(): void {
        DomainUtils.log("STORES bookings: clean");
        items.value = [];
    }

    /**
     * Sets the entire booking's collection.
     *
     * @param bookings - New bookings array.
     */
    function set(bookings: BookingDb[]): void {
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
