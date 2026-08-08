/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {defineStore} from "pinia";
import {computed, ref} from "vue";

import {ERROR_CATEGORY} from "@/domain/constants";
import {appError} from "@/domain/errors";
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

    /** Resolves a bookingType by its ID. */
    const getItemById = computed(
        () =>
            (id: number): BookingTypeDb => {
                const bookingType = getById.value(id);
                if (!bookingType) {
                    throw appError("xx_missing_record", ERROR_CATEGORY.STORE, false, {id});
                }
                return bookingType;
            }
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
                return isDuplicateBookingTypeName(items.value, name, excludeId);
            }
    );

    /** List of all booking type names. */
    const getNames = computed(() => items.value.map((item) => item.cName));

    /**
     * List of booking type names paired with their **stable id**.
     *
     * The pairing used to be with the array *position* (`(item, index) =>
     * ({name, index})`), which is the positional-versus-identity hazard this
     * codebase already documents elsewhere — `stocks.active`'s comment warns
     * that page positions computed from a getter "would not match what the UI
     * renders". Every other accessor in this store (`getById`, `getNameById`,
     * `getItemById`, `getIndexById`, `isDuplicate`) is keyed on `cID`, which is
     * stable; the array position is not, and `add(…, prepend)`, `remove()` and
     * `clean()` all reshuffle it. A consumer that stored or awaited the value
     * across a mutation would have selected the wrong booking type.
     *
     * `getIndexById` remains for the genuinely positional case, where the caller
     * is explicitly asking about the current array.
     */
    const getNamesWithId = computed(() =>
        items.value.map((item) => ({
            name: item.cName,
            id: item.cID
        }))
    );

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
        getItemById,
        getIndexById,
        getNames,
        getNamesWithId,
        isDuplicate,
        add,
        remove,
        update,
        clean
    };
});

log("STORES bookingTypes");
