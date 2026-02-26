/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {RecordsDbData} from "@/types";
import {defineStore} from "pinia";
import {useSettingsStore} from "@/stores/settings";
import {DomainUtils} from "@/domains/utils";
import {useAccountsStore} from "@/stores/accounts";
import {useBookingsStore} from "@/stores/bookings";
import {useBookingTypesStore} from "@/stores/bookingTypes";
import {useStocksStore} from "@/stores/stocks";
import {DomainLogic} from "@/domains/logic";

/**
 * Pinia store that acts as a central hub for all record-related stores.
 * Orchestrates the cleaning and initialization of accounts, bookings,
 * booking types, and stocks stores.
 *
 * @module stores/records
 * @returns Reactive records state, computed aggregations,
 * and methods to mutate and enrich records.
 */
export const useRecordsStore = defineStore("records", function () {
    const settingsStore = useSettingsStore();
    const accountsStore = useAccountsStore();
    const bookingsStore = useBookingsStore();
    const bookingTypesStore = useBookingTypesStore();
    const stocksStore = useStocksStore();
    const entityStores = {
        accounts: accountsStore,
        bookings: bookingsStore,
        bookingTypes: bookingTypesStore,
        stocks: stocksStore
    };

    /**
     * Clears all record stores.
     *
     * @param withAccounts - When true, also clears the accounts store (default: true).
     * @returns Void.
     */
    function clean(withAccounts: boolean = true): void {
        DomainUtils.log("STORES records: clean");
        if (withAccounts) {
            accountsStore.clean();
        }
        bookingsStore.clean();
        bookingTypesStore.clean();
        stocksStore.clean();
    }

    /**
     * Initializes all record stores with data from the database.
     *
     * @param storesDB - Raw data from IndexedDB for all entity stores.
     * @param messages - Localization messages used for user feedback during initialization.
     * @param removeAccounts - When true, clears existing accounts before loading new ones (default: true).
     * @returns A promise that resolves when all stores are hydrated.
     */
    async function init(
        storesDB: RecordsDbData,
        messages: Record<string, string>,
        removeAccounts: boolean = true
    ): Promise<void> {
        await DomainLogic.initializeRecords(
            storesDB,
            {
                ...entityStores,
                settings: settingsStore
            },
            messages,
            removeAccounts
        );
    }

    return {
        /** The accounts store instance. */
        accounts: entityStores.accounts,
        /** The bookings store instance. */
        bookings: entityStores.bookings,
        /** The booking types store instance. */
        bookingTypes: entityStores.bookingTypes,
        /** The stocks store instance. */
        stocks: entityStores.stocks,
        init,
        clean
    };
});

DomainUtils.log("STORES records");
