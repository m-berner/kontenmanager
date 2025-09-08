/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {defineStore} from 'pinia'
import {useNotification} from '@/composables/useNotification'
import {useAccounts} from '@/stores/childs/accounts'
import {useBookings} from '@/stores/childs/bookings'
import {useBookingTypes} from '@/stores/childs/bookingTypes'
import {useStocks} from '@/stores/childs/stocks'
import {useSettingsStore} from '@/stores/settings'
import type {IBooking, IStores} from '@/types'

const {log} = useNotification()

export const useRecordsStore = defineStore('records', () => {
    const accountsStore = useAccounts()
    const bookingsStore = useBookings()
    const bookingTypesStore = useBookingTypes()
    const stocksStore = useStocks()

    function cleanStore() {
        accountsStore.clean()
        bookingsStore.clean()
        bookingTypesStore.clean()
        stocksStore.clean()
    }

    function initStore(stores: IStores): void {
        log('RECORDS: initStore', {info: stores})
        const settings = useSettingsStore()
        cleanStore()
        accountsStore.items = [...stores.accounts]
        accountsStore.addAccount({cID: 0, cSwift: '', cNumber: '', cLogoUrl: '', cStockAccount: false}, true)

        bookingsStore.items = [...stores.bookings]

        bookingTypesStore.items = [...stores.bookingTypes]
        bookingTypesStore.addBookingType({cID: 0, cName: '', cAccountNumberID: settings.activeAccountId}, true)

        stocksStore.items = [...stores.stocks]
        stocksStore.addStock({
            cID: 0,
            cISIN: 'XX00000000000000000000',
            cWKN: 'AAAAAAA',
            cSymbol: 'WWW',
            cFadeOut: 0,
            cFirstPage: 0,
            cURL: '',
            cCompany: '',
            cMeetingDay: '',
            cQuarterDay: '',
            cAccountNumberID: settings.activeAccountId,
            mBuyValue: 0,
            mMax: 0,
            mMin: 0,
            mChange: 0,
            mEuroChange: 0,
            mPortfolio: 0,
            mValue: 0
        }, true)

        // Sort bookings by date: newest first
        bookingsStore.items.sort((a: IBooking, b: IBooking) => {
            const dateA = new Date(a.cDate).getTime()
            const dateB = new Date(b.cDate).getTime()
            return dateB - dateA
        })
    }

    return {
        accounts: accountsStore,
        bookings: bookingsStore,
        bookingTypes: bookingTypesStore,
        stocks: stocksStore,
        initStore,
        cleanStore
    }
})

log('--- STORE records.ts ---')
