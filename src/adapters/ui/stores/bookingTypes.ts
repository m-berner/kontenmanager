/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {defineStore} from "pinia";
import {computed, ref} from "vue";

import type {BookingTypeDb} from "@/domain/types";
import {log} from "@/domain/utils/utils";
import {isDuplicateBookingTypeName} from "@/domain/validation/duplicates";

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

    /**
     * Inserts an item into the list of items.
     *
     * @param item - The item to be added to the list.
     * @param prepend - Determines whether the item should be added at the beginning (true) or at the end (false) of the list.
     */
    function insertItem(item: BookingTypeDb, prepend: boolean): void {
        items.value = prepend ? [item, ...items.value] : [...items.value, item];
    }

    /**
     * Replaces an item in the list by its identifier.
     *
     * @param id - The unique identifier of the item to be replaced.
     * @param next - The new item that will replace the existing one.
     */
    function replaceItemById(id: number, next: BookingTypeDb): void {
        const index = getIndexById.value(id);
        if (index === -1) {
            return;
        }
        const newItems = [...items.value];
        newItems[index] = next;
        items.value = newItems;
    }

    /** Retrieves the name of a booking type by its ID. */
    const getNameById = computed(() => (ident: number): string => {
        const bookingType = items.value.find(
            (entry: BookingTypeDb) => entry.cID === ident
        );
        return bookingType !== undefined ? bookingType.cName : "";
    });

    // `getItemById`, the throwing counterpart to `getById`, was removed here —
    // no consumer in `src/` or `tests/`. See the note in `stores/bookings.ts`.

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
                return isDuplicateBookingTypeName(items.value, name, excludeId);
            }
    );

    // `getNames` and `getNamesWithId` were removed here — neither had a consumer
    // in `src/` or `tests/`. `getNamesWithId` is worth a word because it carried
    // a six-line comment describing a positional-versus-identity bug that had
    // been found and fixed *in it*: the pairing was once with the array index
    // rather than `cID`, so a consumer holding the value across a mutation would
    // have selected the wrong booking type. That analysis was real and correct —
    // and protected nobody, because nothing called the getter. The lesson is
    // recorded here rather than lost: every accessor in this store is keyed on
    // the stable `cID`, and `getIndexById` is the only deliberately positional
    // one, for callers explicitly asking about the current array.

    /**
     * Adds a booking type to the store.
     *
     * @param bookingType - Booking type record to add.
     * @param prepend - Whether to insert at the beginning.
     */
    function add(bookingType: BookingTypeDb, prepend: boolean = false): void {
        log("STORES bookingTypes: add");
        insertItem(bookingType, prepend);
    }

    /**
     * Updates an existing booking type.
     *
     * @param bookingType - Updated booking type data.
     */
    function update(bookingType: BookingTypeDb): void {
        log("STORES bookingTypes: update");
        replaceItemById(bookingType.cID, {...bookingType});
    }

    /**
     * Removes a booking type by ID.
     *
     * @param ident - Booking type ID to remove.
     */
    function remove(ident: number): void {
        log("STORES bookingTypes: remove", ident, "info");
        items.value = items.value.filter((entry) => entry.cID !== ident);
    }

    /**
     * Clears all booking type records.
     */
    function clean(): void {
        log("STORES bookingTypes: clean");
        items.value = [];
    }

    return {
        items,
        getById,
        getNameById,
        getIndexById,
        isDuplicate,
        add,
        remove,
        update,
        clean
    };
});

log("STORES bookingTypes");
