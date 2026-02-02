/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import type { BookingTypeDb } from "@/types";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { DomainUtils } from "@/domains/utils";

/**
 * Pinia store managing booking type definitions.
 *
 * @module stores/bookingTypes
 * @returns Reactive booking types state, computed aggregations,
 * and methods to mutate and enrich booking types records.
 */
export const useBookingTypesStore = defineStore("bookingTypes", function () {
  /** All booking type records. */
  const items = ref<BookingTypeDb[]>([]);

  /** Retrieves the name of a booking type by its ID. */
  const getNameById = computed(() => (ident: number): string => {
    const bookingType = items.value.find(
      (entry: BookingTypeDb) => entry.cID === ident
    );
    return bookingType !== undefined ? bookingType.cName : "";
  });

  /** Resolves a bookingType by its ID. */
  const getItemById = computed(
    () =>
      (id: number): BookingTypeDb =>
        items.value[getIndexById.value(id)]
  );

  /** Retrieves a booking type record by its ID. */
  const getById = computed(() => (ident: number): BookingTypeDb | null => {
    const bookingType = items.value.find(
      (entry: BookingTypeDb) => entry.cID === ident
    );
    return bookingType ? bookingType : null;
  });

  /** Resolves the index of a booking type in the collection. */
  const getIndexById = computed(() => (id: number): number => {
    return items.value.findIndex((bookingType) => bookingType.cID === id);
  });

  /** Checks if a booking type with the given name already exists. */
  const isDuplicate = computed(
    () =>
      (name: string, excludeId?: number): boolean => {
        const normalizedInput = DomainUtils.normalizeBookingTypeName(name);
        return items.value.some((entry: BookingTypeDb) => {
          const isSameName =
            DomainUtils.normalizeBookingTypeName(entry.cName) ===
            normalizedInput;
          const isNotExcluded =
            excludeId === undefined || entry.cID !== excludeId;
          return isSameName && isNotExcluded;
        });
      }
  );

  /** List of all booking type names. */
  const getNames = computed(() => items.value.map((item) => item.cName));

  /** List of booking type names along with their original indices. */
  const getNamesWithIndex = computed(() =>
    items.value.map((item, index) => ({
      name: item.cName,
      index
    }))
  );

  /**
   * Adds a booking type to the store.
   *
   * @param bookingType - Booking type record to add.
   * @param prepend - Whether to insert at the beginning.
   */
  function add(bookingType: BookingTypeDb, prepend: boolean = false): void {
    DomainUtils.log("BOOKING_TYPES_STORE: add");
    if (prepend) {
      items.value.unshift(bookingType);
    } else {
      items.value.push(bookingType);
    }
  }

  /**
   * Updates an existing booking type.
   *
   * @param bookingType - Updated booking type data.
   */
  function update(bookingType: BookingTypeDb): void {
    DomainUtils.log("BOOKING_TYPES_STORE: update");
    const index = getIndexById.value(bookingType.cID);
    if (index !== -1) {
      items.value[index] = { ...bookingType };
    }
  }

  /**
   * Removes a booking type by ID.
   *
   * @param ident - Booking type ID to remove.
   */
  function remove(ident: number): void {
    DomainUtils.log("BOOKING_TYPE_STORE: remove", ident, "info");
    const index = getIndexById.value(ident);
    if (index !== -1) {
      items.value.splice(index, 1);
    }
  }

  /**
   * Clears all booking type records.
   */
  function clean(): void {
    DomainUtils.log("BOOKING_TYPES_STORE: clean");
    items.value = [];
  }

  return {
    items,
    getById,
    getNameById,
    getItemById,
    getIndexById,
    getNames,
    getNamesWithIndex,
    isDuplicate,
    add,
    remove,
    update,
    clean
  };
});

DomainUtils.log("--- stores/bookingTypes.ts ---");
