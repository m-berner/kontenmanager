/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import type { BookingDb } from "@/types";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { UtilsService } from "@/domains/utils";
import { useBookingTypesStore } from "@/stores/bookingTypes";
import { DomainLogic } from "@/domains/logic";
import { AppError, ERROR_CATEGORY, ERROR_CODES } from "@/domains/errors";

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
        ERROR_CODES.STORES.BOOKINGS.A,
        ERROR_CATEGORY.DATABASE,
        { input: ident, entity: "getTextById" },
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
    const findings = items.value.filter(
      (entry: BookingDb) => entry.cBookingTypeID === ident
    );
    return findings.length > 0;
  });

  /** Checks if any bookings are associated with a specific stock. */
  const hasStockID = computed(() => (ident: number): boolean => {
    const findings = items.value.filter(
      (entry: BookingDb) => entry.cStockID === ident
    );
    return findings.length > 0;
  });

  /** Sum of fees for a specific year. */
  const sumFees = computed(() => (y: number) => {
    return DomainLogic.calculateSumFees(items.value, y);
  });

  /** Sum of taxes for a specific year. */
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

  /** Aggregated booking sums per type for a specific year. */
  const sumBookingsPerTypeAndYear = computed(() => (y: number) => {
    const bt = useBookingTypesStore();
    return DomainLogic.aggregateBookingsPerType(items.value, bt.items, y);
  });

  /** Total aggregated booking sums per type. */
  const sumBookingsPerType = computed(() => {
    const bt = useBookingTypesStore();
    return DomainLogic.aggregateBookingsPerType(items.value, bt.items);
  });

  /** Calculates the current portfolio quantity for a stock. */
  const portfolioByStockId = computed(() => (ident: number) => {
    return DomainLogic.calculatePortfolioByStockId(items.value, ident);
  });

  /** Calculates the total investment value still held in a stock (FIFO principle). */
  const investByStockId = computed(() => (ident: number) => {
    return DomainLogic.calculateInvestByStockId(items.value, ident);
  });

  /** Retrieves all dividend bookings for a specific stock. */
  const dividendsByStockId = computed(() => (ident: number) => {
    return items.value
      .filter((entry: BookingDb) => {
        return entry.cStockID === ident && entry.cBookingTypeID === 3;
      })
      .map((entry: BookingDb) => {
        return { id: ident, year: entry.cExDate, sum: entry.cCredit };
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
    UtilsService.log("RECORDS_BOOKINGS: add");
    if (prepend) {
      items.value = [booking, ...items.value];
    } else {
      items.value = [...items.value, booking];
    }
  }

  /**
   * Updates an existing booking.
   *
   * @param booking - Updated booking data.
   */
  function update(booking: BookingDb): void {
    UtilsService.log("RECORDS_BOOKINGS: update");
    const index = getIndexById.value(booking.cID);
    if (index !== -1) {
      const newItems = [...items.value];
      newItems[index] = { ...booking };
      items.value = newItems;
    }
  }

  /**
   * Removes a booking by ID.
   *
   * @param ident - Booking ID to remove.
   */
  function remove(ident: number): void {
    UtilsService.log("RECORDS_BOOKINGS: remove", ident, "info");
    items.value = items.value.filter((entry) => entry.cID !== ident);
  }

  /**
   * Clears all bookings.
   */
  function clean(): void {
    UtilsService.log("RECORDS_BOOKINGS: clean");
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

UtilsService.log("--- stores/bookings.ts ---");
