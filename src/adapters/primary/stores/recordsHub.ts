/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {defineStore} from "pinia";
import {computed} from "vue";

import {initRecordsUsecase} from "@/app/usecases/records/init";

import type {RecordsDbData} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useAccountingStore} from "@/adapters/primary/stores/accounting";
import {useAccountsStore} from "@/adapters/primary/stores/accounts";
import {useBookingsStore} from "@/adapters/primary/stores/bookings";
import {useBookingTypesStore} from "@/adapters/primary/stores/bookingTypes";
import {usePortfolioStore} from "@/adapters/primary/stores/portfolio";
import {useSettingsStore} from "@/adapters/primary/stores/settings";
import {useStocksStore} from "@/adapters/primary/stores/stocks";

/**
 * Pinia store that acts as a central hub for all record-related stores.
 * Orchestrates the cleaning and initialization of accounts, bookings,
 * booking types, and stocks stores.
 *
 * @module stores/recordsHub
 * @returns Reactive records state, computed aggregations,
 * and methods to mutate and enrich records.
 */
export const useRecordsStore = defineStore("records", function () {
    const settingsStore = useSettingsStore();
    const accountsStore = useAccountsStore();
    const bookingsStore = useBookingsStore();
    const bookingTypesStore = useBookingTypesStore();
    const stocksStore = useStocksStore();
    const accountingStore = useAccountingStore();
    const portfolioStore = usePortfolioStore();
    const entityStores = {
        accounts: accountsStore,
        bookings: bookingsStore,
        bookingTypes: bookingTypesStore,
        stocks: stocksStore
    };

    const isDepot = computed((): boolean => {
        const id = settingsStore.activeAccountId;
        if (id <= 0) return false;
        return accountsStore.isDepotById(id);
    });

    /**
     * Clears all record stores.
     *
     * @param withAccounts - When true, also clears the accounts store (default: true).
     * @returns Void.
     */
    function clean(withAccounts: boolean = true): void {
        log("STORES records: clean");
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
        await initRecordsUsecase(
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
        /** Derived aggregates that require multiple stores. */
        accounting: accountingStore,
        /** Derived portfolio state and online data orchestration. */
        portfolio: portfolioStore,
        /** Whether the currently active account is a depot. */
        isDepot,
        init,
        clean
    };
});

log("STORES recordsHub");