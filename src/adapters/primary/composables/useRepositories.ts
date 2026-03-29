/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {useAdapters} from "@/adapters/context";

/**
 * Typed convenience accessor for database repositories.
 * Keeps components/composables from importing a global database singleton.
 */
export function useRepositories() {
    const {repositories} = useAdapters();

    return {
        accountsRepository: repositories.accounts,
        bookingsRepository: repositories.bookings,
        bookingTypesRepository: repositories.bookingTypes,
        stocksRepository: repositories.stocks
    };
}
