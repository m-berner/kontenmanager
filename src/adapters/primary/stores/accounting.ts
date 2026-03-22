/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {defineStore} from "pinia";
import {computed} from "vue";

import {log} from "@/domain/utils/utils";

import {useBookingsStore} from "@/adapters/primary/stores/bookings";
import {useBookingTypesStore} from "@/adapters/primary/stores/bookingTypes";

/**
 * Orchestration store that derives accounting aggregates that require
 * combining multiple leaf stores (bookings + bookingTypes).
 */
export const useAccountingStore = defineStore("accounting", function () {
    const bookings = useBookingsStore();
    const bookingTypes = useBookingTypesStore();

    const sumBookingsPerType = computed(() => {
        return bookings.sumBookingsPerType(bookingTypes.items);
    });

    const sumBookingsPerTypeAndYear = computed(() => (y: number) => {
        return bookings.sumBookingsPerTypeAndYear(bookingTypes.items, y);
    });

    return {
        sumBookingsPerType,
        sumBookingsPerTypeAndYear
    };
});

log("STORES accounting");
