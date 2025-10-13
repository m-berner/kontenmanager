/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {IBooking, IStockOnlyMemory, IStores, IStoresDB} from '@/types'
import {defineStore} from 'pinia'
import {useApp} from '@/composables/useApp'
import {useSettings} from '@/composables/useSettings'
import {useAccountsStore} from '@/stores/childs/accounts'
import {useBookingsStore} from '@/stores/childs/bookings'
import {useBookingTypesStore} from '@/stores/childs/bookingTypes'
import {useStocksStore} from '@/stores/childs/stocks'
import {useBrowser} from '@/composables/useBrowser'

const {CONS, log} = useApp()

export const useRecordsStore = defineStore('records', () => {
    const accountsStore = useAccountsStore()
    const bookingsStore = useBookingsStore()
    const bookingTypesStore = useBookingTypesStore()
    const stocksStore = useStocksStore()

    function clean(all = true) {
        log('RECORDS: clean')
        if (all) {
            accountsStore.clean()
        }
        bookingsStore.clean()
        bookingTypesStore.clean()
        stocksStore.clean()
    }

    function load(stores: IStores) {
        log('RECORDS: load')
        const {activeAccountId} = useSettings()
        for (const entry of stores.accounts) {
            accountsStore.add(entry)
        }
        accountsStore.add({cID: 0, cSwift: '', cIban: '', cLogoUrl: '', cWithDepot: false}, true)

        for (const entry of stores.bookings) {
            bookingsStore.add(entry)
        }

        for (const entry of stores.bookingTypes) {
            bookingTypesStore.add(entry)
        }
        bookingTypesStore.add({cID: 0, cName: '', cAccountNumberID: activeAccountId.value}, true)

        for (const entry of stores.stocks) {
            stocksStore.add(entry)
        }
        stocksStore.add({
            cID: 0,
            cISIN: 'XX0000000000',
            cSymbol: 'XYZOO6',
            cFadeOut: 0,
            cFirstPage: 0,
            cURL: '',
            cCompany: '',
            cMeetingDay: '',
            cQuarterDay: '',
            cAccountNumberID: activeAccountId.value
        }, true)

        bookingsStore.items.sort((a: IBooking, b: IBooking) => {
            const dateA = new Date(a.cDate).getTime()
            const dateB = new Date(b.cDate).getTime()
            return dateB - dateA
        })
    }

    async function init(storesDB: IStoresDB): Promise<void> {
        log('RECORDS: init')
        const {activeAccountId} = useSettings()
        const {setStorage} = useBrowser()
        if (activeAccountId.value < 1 && storesDB.accountsDB.length > 0) {
            activeAccountId.value = storesDB.accountsDB[0].cID
            await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.ACTIVE_ACCOUNT_ID, activeAccountId.value)
        }
        //
        const stocksOnlyMemory: IStockOnlyMemory = {
            mPortfolio: 0,
            mInvest: 0,
            mChange: 0,
            mBuyValue: 0,
            mEuroChange: 0,
            mMin: 0,
            mValue: 0,
            mMax: 0,
            mDividendYielda: 0,
            mDividendYeara: 0,
            mDividendYieldb: 0,
            mDividendYearb: 0,
            mRealDividend: 0,
            mRealBuyValue: 0,
            mDeleteable: false,
            mAskDates: false
        }
        const stores: IStores = {
            accounts: storesDB.accountsDB,
            bookings: storesDB.bookingsDB,
            bookingTypes: storesDB.bookingTypesDB,
            stocks: storesDB.stocksDB.map((stock) => {
                return {...stock, ...stocksOnlyMemory}
            })
        }

        clean()
        load(stores)
    }

    return {
        accounts: accountsStore,
        bookings: bookingsStore,
        bookingTypes: bookingTypesStore,
        stocks: stocksStore,
        init,
        load,
        clean
    }
})

log('--- STORES records.ts ---')
