/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import type {RecordsDbData} from '@/types'
import {defineStore} from 'pinia'
import {useSettingsStore} from '@/stores/settings'
import {useAlertStore} from '@/stores/alerts'
import {UtilsService} from '@/domains/utils'
import {useAccountsStore} from '@/stores/accounts'
import {useBookingsStore} from '@/stores/bookings'
import {useBookingTypesStore} from '@/stores/bookingTypes'
import {useStocksStore} from '@/stores/stocks'
import {DomainLogic} from '@/domains/logic'

/**
 * Pinia store that acts as a central hub for all record-related stores.
 * Orchestrates the cleaning and initialization of accounts, bookings,
 * booking types, and stocks stores.
 *
 * @module stores/records
 * @returns Reactive records state, computed aggregations,
 * and methods to mutate and enrich records.
 */
export const useRecordsStore = defineStore('records', function () {
    const accountsStore = useAccountsStore()
    const bookingsStore = useBookingsStore()
    const bookingTypesStore = useBookingTypesStore()
    const stocksStore = useStocksStore()

    /**
     * Clears all record stores.
     *
     * @param all - Whether to also clear the accounts store.
     */
    function clean(all = true) {
        UtilsService.log('RECORDS: clean')
        if (all) {
            accountsStore.clean()
        }
        bookingsStore.clean()
        bookingTypesStore.clean()
        stocksStore.clean()
    }

    /**
     * Initializes all record stores with data from the database.
     *
     * @param storesDB - Raw data from IndexedDB.
     * @param messages - Localization messages for alerts.
     * @param removeAccounts - Whether to clear accounts before loading.
     */
    async function init(storesDB: RecordsDbData, messages: Record<string, string>, removeAccounts = true): Promise<void> {
        const settings = useSettingsStore()
        const alerts = useAlertStore()

        await DomainLogic.initializeRecords(
            storesDB,
            {
                accounts: accountsStore,
                bookings: bookingsStore,
                bookingTypes: bookingTypesStore,
                stocks: stocksStore,
                settings,
                alerts
            },
            messages,
            removeAccounts
        )
    }

    return {
        /** The accounts store instance. */
        accounts: accountsStore,
        /** The bookings store instance. */
        bookings: bookingsStore,
        /** The booking types store instance. */
        bookingTypes: bookingTypesStore,
        /** The stocks store instance. */
        stocks: stocksStore,
        init,
        clean
    }
})

UtilsService.log('--- stores/records.ts ---')
